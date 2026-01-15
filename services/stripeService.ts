
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { PricingPlan } from "../types";
import { getCurrentUser } from './supabaseService';
import { createClient } from '@supabase/supabase-js';
import { getCSRFToken, validateCSRFToken, refreshCSRFToken } from '../utils/csrf';

// Função helper para obter o cliente Supabase compartilhado
// Isso garante que usamos a mesma instância que foi usada para autenticação
function getSupabaseClient() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase não configurado');
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false
    }
  });
}

// Mapeamento de planos para valores em centavos (BRL)
// Nota: O Stripe trabalha com valores em centavos (menor unidade da moeda)
// Exemplo: 1990 centavos = R$ 19,90
// IMPORTANTE: Estes valores devem corresponder aos da Edge Function
const PLAN_PRICES: Record<string, number> = {
  // Planos Avulsos
  'starter': 1190,   // R$ 11,90 (1190 centavos)
  'genius': 1990,   // R$ 19,90 (1990 centavos)
  'master': 5990,  // R$ 59,90 (5990 centavos)
  // Assinaturas
  'subscription-monthly': 1990,  // R$ 19,90/mês
  'subscription-yearly': 1490,    // R$ 14,90/mês (cobrado anualmente: R$ 178,80)
};

// Bônus de créditos ao pagar via PIX (apenas para planos avulsos)
const PIX_BONUS: Record<string, number> = {
  'starter': 5,
  'genius': 20,
  'master': 100,
};

let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Inicializa o Stripe com a chave pública
 */
function getStripe(): Promise<Stripe | null> {
  const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  
  if (!publishableKey) {
    console.warn('VITE_STRIPE_PUBLISHABLE_KEY não configurada. Usando modo mock.');
    return Promise.resolve(null);
  }

  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey);
  }
  
  return stripePromise;
}

/**
 * Cria uma sessão de checkout via Edge Function do Supabase ou API externa
 */
async function createCheckoutSession(
  plan: PricingPlan,
  userId: string
): Promise<{ sessionId: string; url?: string }> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const edgeFunctionUrl = supabaseUrl 
    ? `${supabaseUrl}/functions/v1/create-checkout-session`
    : null;

  // Se houver Edge Function configurada, usa ela
  if (edgeFunctionUrl) {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Obter token de acesso do Supabase usando o cliente compartilhado
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseAnonKey) {
        throw new Error('Supabase não configurado');
      }

      // Usar cliente Supabase compartilhado (garante mesma sessão)
      const supabase = getSupabaseClient();
      
      // Obter usuário primeiro para garantir que o token está válido
      // Isso força um refresh do token se necessário
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Erro ao obter usuário:', userError);
        throw new Error(`Erro de autenticação: ${userError.message}. Faça login novamente.`);
      }
      
      if (!authUser) {
        throw new Error('Usuário não autenticado. Faça login novamente.');
      }
      
      // Obter sessão após validar usuário (garante token atualizado)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Erro ao obter sessão:', sessionError);
        throw new Error('Erro ao obter sessão de autenticação');
      }
      
      if (!session || !session.access_token) {
        throw new Error('Sessão não encontrada. Faça login novamente.');
      }
      
      // Verificar se o token não está expirado (opcional, mas útil para debug)
      const tokenExpiry = session.expires_at ? new Date(session.expires_at * 1000) : null;
      if (tokenExpiry && tokenExpiry < new Date()) {
        console.warn('Token expirado, tentando refresh...');
        // O Supabase deve fazer refresh automaticamente, mas vamos forçar
        const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
        if (!refreshedSession || !refreshedSession.access_token) {
          throw new Error('Token expirado. Faça login novamente.');
        }
        // Usar o token atualizado
        const response = await fetch(edgeFunctionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${refreshedSession.access_token}`,
            'apikey': supabaseAnonKey,
          },
          body: JSON.stringify({
            plan_id: plan.id,
            amount: PLAN_PRICES[plan.id] || 0,
            currency: 'brl',
            user_id: userId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: response.statusText }));
          throw new Error(errorData.error || errorData.message || `Erro ao criar sessão: ${response.statusText}`);
        }

        const data = await response.json();
        return { sessionId: data.sessionId, url: data.url };
      }

      // Log detalhado para debug
      const requestId = `frontend-${Date.now()}`;
      console.log(`[${requestId}] === ENVIANDO PARA EDGE FUNCTION ===`);
      console.log(`[${requestId}] URL: ${edgeFunctionUrl}`);
      console.log(`[${requestId}] Token presente: ${!!session.access_token}`);
      if (session.access_token) {
        console.log(`[${requestId}] Token length: ${session.access_token.length} caracteres`);
        console.log(`[${requestId}] Token prefix: ${session.access_token.substring(0, 20)}...`);
        console.log(`[${requestId}] Token expira em: ${session.expires_at ? new Date(session.expires_at * 1000).toISOString() : "desconhecido"}`);
      }
      console.log(`[${requestId}] apikey presente: ${!!supabaseAnonKey}`);
      if (supabaseAnonKey) {
        console.log(`[${requestId}] apikey prefix: ${supabaseAnonKey.substring(0, 10)}...`);
      }
      console.log(`[${requestId}] Payload:`, {
        plan_id: plan.id,
        amount: PLAN_PRICES[plan.id] || 0,
        currency: 'brl',
        user_id: userId
      });

      // Obter ou gerar token CSRF
      let csrfToken = getCSRFToken();
      if (!csrfToken) {
        csrfToken = refreshCSRFToken();
      }

      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': supabaseAnonKey, // Adicionar apikey para Edge Functions
          'X-CSRF-Token': csrfToken, // Token CSRF
        },
        body: JSON.stringify({
          plan_id: plan.id,
          amount: PLAN_PRICES[plan.id] || 0,
          currency: 'brl',
          user_id: userId,
          plan_type: plan.type || 'one-time',
          interval: plan.interval || null,
          pix_bonus: plan.pixBonus || 0,
          csrf_token: csrfToken, // Token CSRF no body também
        }),
      });

      if (!response.ok) {
        console.error(`[${requestId}] ❌ ERRO NA RESPOSTA ===`);
        console.error(`[${requestId}] Status: ${response.status} ${response.statusText}`);
        console.error(`[${requestId}] Headers da resposta:`, Object.fromEntries(response.headers.entries()));
        
        // Tentar obter detalhes do erro
        let errorMessage = `Erro ${response.status}: ${response.statusText}`;
        let errorData: any = null;
        
        try {
          const responseText = await response.text();
          console.error(`[${requestId}] Response body (texto):`, responseText);
          
          try {
            errorData = JSON.parse(responseText);
            console.error(`[${requestId}] Response body (JSON):`, errorData);
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch (parseError) {
            console.error(`[${requestId}] Não foi possível parsear JSON:`, parseError);
            errorMessage = responseText || errorMessage;
          }
        } catch (e) {
          console.error(`[${requestId}] Erro ao ler resposta:`, e);
        }
        
        // Log específico para erro 401
        if (response.status === 401) {
          console.error(`[${requestId}] ⚠️ ERRO 401 DETECTADO ===`);
          console.error(`[${requestId}] Verifique:`);
          console.error(`[${requestId}] 1. Token JWT está válido e não expirado?`);
          console.error(`[${requestId}] 2. apikey do header corresponde ao SUPABASE_ANON_KEY?`);
          console.error(`[${requestId}] 3. SUPABASE_ANON_KEY está configurado na Edge Function?`);
          console.error(`[${requestId}] 4. Token foi gerado com a mesma SUPABASE_ANON_KEY?`);
        }
        
        throw new Error(errorData?.hint ? `${errorMessage} (${errorData.hint})` : errorMessage);
      }
      
      console.log(`[${requestId}] ✓ Resposta OK recebida`);

      const data = await response.json();
      
      // Nota: A transação pendente é criada pela Edge Function usando service_role key
      // Isso garante maior segurança, evitando que usuários maliciosos criem transações falsas
      
      return { sessionId: data.sessionId, url: data.url };
    } catch (error) {
      console.error('Erro ao chamar Edge Function:', error);
      // Fallback para mock se Edge Function falhar
    }
  }

  // Fallback: Mock para desenvolvimento
  console.warn('Usando modo mock do Stripe. Configure a Edge Function ou API externa para produção.');
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ sessionId: 'mock_session_id_' + Date.now() });
    }, 1000);
  });
}

/**
 * Inicia o processo de Checkout do Stripe.
 * 
 * Fluxo:
 * 1. Cria uma sessão de checkout via Edge Function/API
 * 2. Redireciona o usuário para o checkout do Stripe
 * 3. Após o pagamento, o webhook do Stripe atualiza os créditos
 */
export async function startStripeCheckout(
  plan: PricingPlan,
  userId: string
): Promise<void> {
  try {
    // 1. Obter usuário atual para garantir autenticação
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Você precisa estar logado para fazer uma compra');
    }

    // 2. Inicializar Stripe
    const stripe = await getStripe();
    
    // Se Stripe não estiver configurado, usa mock
    if (!stripe) {
      console.log(`[MOCK] Iniciando Checkout Stripe para o plano: ${plan.name} (${plan.price})`);
      // Simula o processo de checkout
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return;
    }

    // 3. Criar sessão de checkout
    console.log(`Criando sessão de checkout para o plano: ${plan.name}`);
    const { sessionId, url } = await createCheckoutSession(plan, userId || user.id);

    // 4. Redirecionar para o checkout
    if (url) {
      // Se a API retornar uma URL direta, redireciona
      window.location.href = url;
    } else if (sessionId && sessionId.startsWith('cs_')) {
      // Usa o Stripe.js para redirecionar (apenas se sessionId for válido)
      // O método redirectToCheckout existe no Stripe.js, mas o tipo pode não estar completo
      const result = await (stripe as any).redirectToCheckout({ sessionId });
      if (result && result.error) {
        throw new Error(result.error.message || 'Erro ao redirecionar para checkout');
      }
    } else {
      // Se for mock sessionId, não redireciona
      console.warn('SessionId mock detectado. Em produção, use uma Edge Function real.');
    }
  } catch (error: any) {
    console.error('Erro no checkout do Stripe:', error);
    throw new Error(error.message || 'Falha ao iniciar pagamento. Tente novamente.');
  }
}

/**
 * Busca invoices (faturas) do usuário no Stripe
 */
export async function fetchUserInvoices(): Promise<any[]> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return [];
    }

    const supabase = getSupabaseClient();
    
    // Buscar transações completadas do usuário
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('stripe_session_id, created_at')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar transações:', error);
      return [];
    }

    if (!transactions || transactions.length === 0) {
      return [];
    }

    // Para cada transação, buscar invoice do Stripe
    // Nota: Em produção, você pode criar uma Edge Function para buscar invoices do Stripe
    // Por enquanto, retornamos dados básicos das transações
    const invoices = transactions.map((tx: any) => ({
      id: tx.stripe_session_id || `tx_${tx.id}`,
      amount: 0, // Será preenchido pela Edge Function
      currency: 'brl',
      status: 'paid',
      created: new Date(tx.created_at).getTime() / 1000,
      hosted_invoice_url: null // Será preenchido pela Edge Function
    }));

    return invoices;
  } catch (error: any) {
    console.error('Erro ao buscar invoices:', error);
    return [];
  }
}