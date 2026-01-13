
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { PricingPlan } from "../types";
import { getCurrentUser } from './supabaseService';
import { createClient } from '@supabase/supabase-js';

// Mapeamento de planos para valores em centavos (BRL)
const PLAN_PRICES: Record<string, number> = {
  'starter': 1990,   // R$ 19,90
  'genius': 6990,   // R$ 69,90
  'master': 14990,  // R$ 149,90
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

      // Obter token de acesso do Supabase
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase não configurado');
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Sessão não encontrada');
      }

      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          plan_id: plan.id,
          amount: PLAN_PRICES[plan.id] || 0,
          currency: 'brl',
          user_id: userId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro ao criar sessão: ${response.statusText}`);
      }

      const data = await response.json();
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
