
# Schema do Supabase para o Imagenius

Execute o SQL abaixo no editor de consultas (SQL Editor) do seu projeto Supabase para configurar as tabelas de créditos e transações.

## 1. Tabela de Perfis (Usuários e Créditos)
Esta tabela armazena o saldo atual de cada usuário. Ela é vinculada automaticamente à tabela de autenticação do Supabase.

```sql
-- Criar tabela de perfis
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  email TEXT NOT NULL,
  credits INTEGER DEFAULT 5 NOT NULL CHECK (credits >= 0),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Usuários podem ver o próprio perfil" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar o próprio perfil" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Política para permitir inserção de perfis (via trigger)
CREATE POLICY "Permitir criação de perfil via trigger" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Gatilho para criar perfil automaticamente no cadastro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, credits)
  VALUES (new.id, new.email, 5); -- Inicia com 5 créditos grátis
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## 2. Tabela de Transações
Para manter um histórico de compras via Stripe.

```sql
CREATE TABLE public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  stripe_session_id TEXT UNIQUE,
  plan_id TEXT NOT NULL,
  amount_total INTEGER NOT NULL, -- em centavos
  currency TEXT DEFAULT 'brl',
  status TEXT NOT NULL, -- 'pending', 'completed', 'failed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas transações" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Política para permitir que usuários criem suas próprias transações pendentes
-- IMPORTANTE: Apenas transações com status 'pending' podem ser criadas pelo usuário
-- O webhook do Stripe (usando service_role) atualiza o status para 'completed'
CREATE POLICY "Usuários podem criar transações pendentes" ON public.transactions
  FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id 
    AND status = 'pending'
    AND stripe_session_id IS NOT NULL
  );

-- Nota sobre UPDATE:
-- Usuários NÃO podem atualizar transações (apenas o webhook pode)
-- Isso garante que apenas transações reais do Stripe sejam marcadas como 'completed'
-- O webhook usa service_role key para bypass RLS e atualizar o status
```

## 3. Configuração do Cliente Supabase no Frontend

Para usar a autenticação real, você precisa:

1. **Instalar o cliente Supabase:**
   ```bash
   npm install @supabase/supabase-js
   ```

2. **Criar arquivo `.env` com suas credenciais:**
   ```
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua_chave_anon_aqui
   ```

3. **Atualizar `services/supabaseService.ts`:**
   ```typescript
   import { createClient } from '@supabase/supabase-js';
   
   const supabase = createClient(
     import.meta.env.VITE_SUPABASE_URL,
     import.meta.env.VITE_SUPABASE_ANON_KEY
   );
   
   // Substituir as funções mock por chamadas reais:
   // await supabase.auth.signInWithPassword({ email, password })
   // await supabase.auth.signUp({ email, password })
   // await supabase.auth.signOut()
   ```

## 4. Configuração do Stripe no Frontend

Para usar o Stripe real, você precisa:

1. **Instalar o SDK do Stripe:**
   ```bash
   npm install @stripe/stripe-js
   ```

2. **Criar arquivo `.env` com sua chave pública do Stripe:**
   ```
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_sua_chave_publica_aqui
   ```

3. **O serviço já está configurado em `services/stripeService.ts`** e funciona com:
   - Modo real: quando `VITE_STRIPE_PUBLISHABLE_KEY` está configurada
   - Modo mock: quando a chave não está configurada (para desenvolvimento)

## 5. Edge Function para Criar Sessão de Checkout

Crie uma Edge Function no Supabase chamada `create-checkout-session`:

1. **No painel do Supabase, vá em Edge Functions > Create Function**
2. **Nome:** `create-checkout-session`
3. **Código:**

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const PLAN_CREDITS: Record<string, number> = {
  'starter': 20,
  'genius': 100,
  'master': 300,
};

const PLAN_PRICES: Record<string, number> = {
  'starter': 990,   // R$ 9,90 em centavos
  'genius': 2990,   // R$ 29,90 em centavos
  'master': 6990,  // R$ 69,90 em centavos
};

// Headers CORS
// Em produção, use uma URL específica ao invés de "*" para maior segurança
const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") || "*";
const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Tratar requisição OPTIONS (preflight)
  if (req.method === "OPTIONS") {
    console.log("[CORS] Preflight request recebido");
    return new Response("ok", { headers: corsHeaders });
  }

  // Log inicial da requisição
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] === NOVA REQUISIÇÃO ===`);
  console.log(`[${requestId}] Método: ${req.method}`);
  console.log(`[${requestId}] URL: ${req.url}`);
  
  try {
    // Verificar autenticação
    const authHeader = req.headers.get("Authorization");
    const apikey = req.headers.get("apikey");
    const contentType = req.headers.get("Content-Type");
    
    // Log detalhado dos headers
    console.log(`[${requestId}] === HEADERS ===`);
    console.log(`[${requestId}] Authorization: ${authHeader ? "presente" : "ausente"}`);
    if (authHeader) {
      const tokenPrefix = authHeader.startsWith("Bearer ") ? authHeader.substring(7, 20) : authHeader.substring(0, 13);
      console.log(`[${requestId}] Token prefix: ${tokenPrefix}...`);
      console.log(`[${requestId}] Token length: ${authHeader.length} caracteres`);
    }
    console.log(`[${requestId}] apikey header: ${apikey ? "presente" : "ausente"}`);
    if (apikey) {
      console.log(`[${requestId}] apikey prefix: ${apikey.substring(0, 10)}...`);
      console.log(`[${requestId}] apikey length: ${apikey.length} caracteres`);
    }
    console.log(`[${requestId}] Content-Type: ${contentType || "não fornecido"}`);
    
    // Log de todas as variáveis de ambiente (sem expor valores completos)
    console.log(`[${requestId}] === VARIÁVEIS DE AMBIENTE ===`);
    console.log(`[${requestId}] SUPABASE_URL: ${Deno.env.get("SUPABASE_URL") ? "configurado" : "NÃO CONFIGURADO"}`);
    console.log(`[${requestId}] SUPABASE_ANON_KEY: ${Deno.env.get("SUPABASE_ANON_KEY") ? "configurado (" + Deno.env.get("SUPABASE_ANON_KEY")?.substring(0, 10) + "...)" : "NÃO CONFIGURADO"}`);
    console.log(`[${requestId}] STRIPE_SECRET_KEY: ${Deno.env.get("STRIPE_SECRET_KEY") ? "configurado" : "NÃO CONFIGURADO"}`);
    console.log(`[${requestId}] SITE_URL: ${Deno.env.get("SITE_URL") || "não configurado"}`);
    
    // Edge Functions do Supabase podem usar apikey ou Authorization
    if (!authHeader && !apikey) {
      console.error(`[${requestId}] ❌ ERRO: Nenhum token de autenticação fornecido`);
      return new Response(
        JSON.stringify({ error: "Não autorizado - Token de autenticação não fornecido" }),
        { 
          status: 401, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          } 
        }
      );
    }

    // Validar token JWT usando Supabase
    // O token vem no formato: "Bearer <jwt_token>"
    let user = null;
    
    if (authHeader) {
      console.log(`[${requestId}] === VALIDAÇÃO DE TOKEN ===`);
      
      // Verificar se o header tem o formato correto
      if (!authHeader.startsWith("Bearer ")) {
        console.error(`[${requestId}] ❌ ERRO: Formato de Authorization header inválido`);
        console.error(`[${requestId}] Header recebido: ${authHeader.substring(0, 50)}...`);
        return new Response(
          JSON.stringify({ error: "Formato de Authorization header inválido. Deve ser: Bearer <token>" }),
          { 
            status: 401, 
            headers: { 
              "Content-Type": "application/json",
              ...corsHeaders
            } 
          }
        );
      }

      // Obter SUPABASE_URL e SUPABASE_ANON_KEY das variáveis de ambiente
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
      
      console.log(`[${requestId}] Verificando configuração do Supabase...`);
      console.log(`[${requestId}] SUPABASE_URL: ${supabaseUrl ? "✓ configurado" : "✗ NÃO CONFIGURADO"}`);
      console.log(`[${requestId}] SUPABASE_ANON_KEY: ${supabaseAnonKey ? "✓ configurado (" + supabaseAnonKey.substring(0, 10) + "...)" : "✗ NÃO CONFIGURADO"}`);
      
      if (!supabaseUrl || !supabaseAnonKey) {
        console.error(`[${requestId}] ❌ ERRO: Configuração do Supabase incompleta`);
        return new Response(
          JSON.stringify({ error: "Configuração do Supabase incompleta" }),
          { 
            status: 500, 
            headers: { 
              "Content-Type": "application/json",
              ...corsHeaders
            } 
          }
        );
      }
      
      // Comparar apikey do header com SUPABASE_ANON_KEY
      if (apikey) {
        const apikeyMatch = apikey === supabaseAnonKey;
        console.log(`[${requestId}] Comparação apikey: ${apikeyMatch ? "✓ CORRESPONDE" : "✗ NÃO CORRESPONDE"}`);
        if (!apikeyMatch) {
          console.warn(`[${requestId}] ⚠️ ATENÇÃO: apikey do header não corresponde ao SUPABASE_ANON_KEY`);
          console.log(`[${requestId}] Header apikey prefix: ${apikey.substring(0, 10)}...`);
          console.log(`[${requestId}] Env apikey prefix: ${supabaseAnonKey.substring(0, 10)}...`);
        }
      }

      // Criar cliente Supabase com o token
      // IMPORTANTE: Usar o apikey do header se fornecido, senão usar da env var
      // O apikey do header deve ser o mesmo que VITE_SUPABASE_ANON_KEY do frontend
      const finalApikey = apikey || supabaseAnonKey;
      
      console.log(`[${requestId}] Criando cliente Supabase...`);
      console.log(`[${requestId}] apikey source: ${apikey ? "header" : "env var"}`);
      console.log(`[${requestId}] finalApikey prefix: ${finalApikey.substring(0, 10)}...`);
      
      const supabaseAuth = createClient(
        supabaseUrl,
        finalApikey,
        {
          global: {
            headers: {
              Authorization: authHeader,
              apikey: finalApikey,
            },
          },
        }
      );

      console.log(`[${requestId}] Cliente Supabase criado. Validando token...`);
      
      // Validar o token e obter o usuário
      // IMPORTANTE: O getUser() valida o JWT token automaticamente
      const startTime = Date.now();
      const { data: { user: authUser }, error: authError } = await supabaseAuth.auth.getUser();
      const validationTime = Date.now() - startTime;
      
      console.log(`[${requestId}] Validação concluída em ${validationTime}ms`);
      
      if (authError) {
        console.error(`[${requestId}] ❌ ERRO DE AUTENTICAÇÃO ===`);
        console.error(`[${requestId}] Mensagem: ${authError.message}`);
        console.error(`[${requestId}] Status: ${authError.status || "não fornecido"}`);
        console.error(`[${requestId}] Nome: ${authError.name || "não fornecido"}`);
        console.error(`[${requestId}] Token prefix: ${authHeader.substring(7, 30)}...`);
        console.error(`[${requestId}] apikey match: ${apikey === supabaseAnonKey ? "✓ SIM" : "✗ NÃO"}`);
        
        if (apikey && apikey !== supabaseAnonKey) {
          console.error(`[${requestId}] ⚠️ PROBLEMA IDENTIFICADO: apikey do header não corresponde!`);
          console.error(`[${requestId}] Header apikey: ${apikey.substring(0, 20)}...`);
          console.error(`[${requestId}] Env apikey: ${supabaseAnonKey.substring(0, 20)}...`);
        }
        
        // Se o erro for "Invalid JWT", pode ser que o apikey não corresponde
        if (authError.message.includes("JWT") || authError.message.includes("token") || authError.message.includes("Invalid")) {
          return new Response(
            JSON.stringify({ 
              error: `Token inválido: ${authError.message}`,
              hint: "Verifique se o apikey do header corresponde ao SUPABASE_ANON_KEY",
              status: authError.status || 401,
              requestId: requestId // Para rastreamento
            }),
            { 
              status: 401, 
              headers: { 
                "Content-Type": "application/json",
                ...corsHeaders
              } 
            }
          );
        }
        
        return new Response(
          JSON.stringify({ 
            error: `Erro de autenticação: ${authError.message}`,
            status: authError.status || 401,
            requestId: requestId
          }),
          { 
            status: 401, 
            headers: { 
              "Content-Type": "application/json",
              ...corsHeaders
            } 
          }
        );
      }
      
      if (!authUser) {
        console.error(`[${requestId}] ❌ ERRO: Usuário não encontrado no token`);
        return new Response(
          JSON.stringify({ error: "Usuário não encontrado no token", requestId }),
          { 
            status: 401, 
            headers: { 
              "Content-Type": "application/json",
              ...corsHeaders
            } 
          }
        );
      }
      
      user = authUser;
      console.log(`[${requestId}] ✓ Usuário autenticado: ${user.id}`);
      console.log(`[${requestId}] Email: ${user.email || "não fornecido"}`);
    } else if (!apikey) {
      // Se não tiver nem Authorization nem apikey, negar acesso
      return new Response(
        JSON.stringify({ error: "Autenticação necessária. Forneça Authorization header ou apikey." }),
        { 
          status: 401, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          } 
        }
      );
    }

    // Obter dados do plano
    console.log(`[${requestId}] === PROCESSANDO BODY ===`);
    const body = await req.json();
    console.log(`[${requestId}] Body recebido:`, {
      plan_id: body.plan_id,
      amount: body.amount,
      currency: body.currency,
      user_id: body.user_id
    });
    
    const { plan_id, amount, currency, user_id } = body;
    
    // Validar que user_id corresponde ao usuário autenticado
    console.log(`[${requestId}] === VALIDAÇÃO DE DADOS ===`);
    if (user && user_id !== user.id) {
      console.error(`[${requestId}] ❌ ERRO: user_id não corresponde`);
      console.error(`[${requestId}] user_id do body: ${user_id}`);
      console.error(`[${requestId}] user.id autenticado: ${user.id}`);
      return new Response(
        JSON.stringify({ error: "user_id não corresponde ao usuário autenticado", requestId }),
        { 
          status: 403, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          } 
        }
      );
    }
    
    // Se não tiver usuário autenticado mas tiver user_id no body, usar ele
    // (caso esteja usando apikey para autenticação)
    const finalUserId = user ? user.id : user_id;
    
    if (!finalUserId) {
      console.error(`[${requestId}] ❌ ERRO: user_id é obrigatório`);
      return new Response(
        JSON.stringify({ error: "user_id é obrigatório", requestId }),
        { 
          status: 400, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          } 
        }
      );
    }
    
    console.log(`[${requestId}] finalUserId: ${finalUserId}`);
    
    if (!plan_id || !PLAN_CREDITS[plan_id]) {
      console.error(`[${requestId}] ❌ ERRO: Plano inválido: ${plan_id}`);
      console.log(`[${requestId}] Planos disponíveis:`, Object.keys(PLAN_CREDITS));
      return new Response(
        JSON.stringify({ error: `Plano inválido: ${plan_id}`, requestId }),
        { 
          status: 400, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          } 
        }
      );
    }
    
    console.log(`[${requestId}] ✓ Plano válido: ${plan_id} (${PLAN_CREDITS[plan_id]} créditos)`);

    // amount vem em centavos (ex: 6990 = R$ 69,90)
    const amountInCents = amount || PLAN_PRICES[plan_id];
    console.log(`[${requestId}] === CRIANDO SESSÃO STRIPE ===`);
    console.log(`[${requestId}] Amount: ${amountInCents} centavos (R$ ${(amountInCents / 100).toFixed(2)})`);
    console.log(`[${requestId}] Currency: ${currency || "brl"}`);
    console.log(`[${requestId}] Plan: ${plan_id}`);
    
    // Criar sessão de checkout no Stripe
    const stripeStartTime = Date.now();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: currency || "brl",
            product_data: {
              name: `Plano ${plan_id} - ${PLAN_CREDITS[plan_id]} créditos`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${Deno.env.get("SITE_URL") || "http://localhost:3000"}?checkout=success`,
      cancel_url: `${Deno.env.get("SITE_URL") || "http://localhost:3000"}?checkout=cancel`,
      client_reference_id: finalUserId,
      metadata: {
        plan_id,
        credits: PLAN_CREDITS[plan_id].toString(),
        user_id: finalUserId,
      },
    });

    const stripeTime = Date.now() - stripeStartTime;
    console.log(`[${requestId}] ✓ Sessão Stripe criada em ${stripeTime}ms`);
    console.log(`[${requestId}] Session ID: ${session.id}`);
    console.log(`[${requestId}] Session URL: ${session.url ? "presente" : "ausente"}`);

    // NOTA: Não criamos a transação aqui - o frontend criará via RLS após obter o sessionId
    // Isso resolve problemas de autenticação (401) e simplifica o fluxo
    // O webhook do Stripe ainda atualizará o status usando service_role key (mantém segurança)

    console.log(`[${requestId}] === SUCESSO ===`);
    console.log(`[${requestId}] Retornando resposta com sessionId`);
    
    return new Response(
      JSON.stringify({ 
        sessionId: session.id, 
        url: session.url,
        // Retornar dados necessários para criar transação no frontend
        plan_id,
        amount: amountInCents,
        currency: currency || "brl",
        requestId: requestId // Para rastreamento
      }),
      { 
        status: 200, 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        } 
      }
    );
  } catch (error) {
    console.error(`[${requestId}] ❌❌❌ ERRO CRÍTICO ❌❌❌`);
    console.error(`[${requestId}] Tipo: ${error.constructor.name}`);
    console.error(`[${requestId}] Mensagem: ${error.message}`);
    console.error(`[${requestId}] Stack:`, error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        requestId: requestId,
        type: error.constructor.name
      }),
      { 
        status: 500, 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        } 
      }
    );
  }
});
```

4. **Configurar variáveis de ambiente na Edge Function:**

   Existem duas formas de configurar variáveis de ambiente no Supabase:

   **Opção A: Via Painel do Supabase (Recomendado)**
   
   1. No painel do Supabase, vá em **Edge Functions** (menu lateral)
   2. Clique na função `create-checkout-session` que você acabou de criar
   3. Vá na aba **Settings** (Configurações)
   4. Role até a seção **Environment Variables** (Variáveis de Ambiente)
   5. Clique em **Add new variable** (Adicionar nova variável)
   6. Adicione as seguintes variáveis:
   
      | Nome da Variável | Valor | Descrição |
      |------------------|-------|-----------|
      | `STRIPE_SECRET_KEY` | `sk_test_...` ou `sk_live_...` | Chave secreta do Stripe (obtenha em [Stripe Dashboard > Developers > API keys](https://dashboard.stripe.com/apikeys)) |
      | `SITE_URL` | `https://seu-site.com` ou `http://localhost:3000` | URL do seu site para redirecionamento após checkout |
      | `SUPABASE_URL` | `https://seu-projeto.supabase.co` | URL do seu projeto Supabase (geralmente já está disponível automaticamente) |
      | `SUPABASE_ANON_KEY` | `sua_chave_anon` | Chave anônima do Supabase (para autenticação do usuário) |
      | `SUPABASE_SERVICE_ROLE_KEY` | `sua_chave_service_role` | Chave de service role (obtenha em **Settings > API > service_role key**). Usada para criar transações, bypassando RLS |
      | `ALLOWED_ORIGIN` | `https://imagenius-theta.vercel.app` (opcional) | URL do seu frontend para CORS. Se não configurado, usa `*` (menos seguro, mas funciona para desenvolvimento) |
   
   7. Clique em **Save** (Salvar) para cada variável
   
   **Nota sobre CORS:** 
   - Para desenvolvimento, você pode deixar `ALLOWED_ORIGIN` sem configurar (usa `*`)
   - Para produção, configure com a URL exata do seu frontend (ex: `https://imagenius-theta.vercel.app`)
   - Isso aumenta a segurança, permitindo apenas requisições do seu domínio
   
   **Opção B: Via CLI do Supabase (Avançado)**
   
   Se você estiver usando o Supabase CLI localmente:
   
   ```bash
   # Instalar Supabase CLI (se ainda não tiver)
   npm install -g supabase
   
   # Fazer login
   supabase login
   
   # Linkar ao projeto
   supabase link --project-ref seu-project-ref
   
   # Configurar variáveis de ambiente
   supabase secrets set STRIPE_SECRET_KEY=sk_test_sua_chave_aqui
   supabase secrets set SITE_URL=https://seu-site.com
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_aqui
   ```
   
   **Nota:** As variáveis `SUPABASE_URL` e `SUPABASE_ANON_KEY` geralmente já estão disponíveis automaticamente nas Edge Functions, mas você pode adicioná-las manualmente se necessário. A `SUPABASE_SERVICE_ROLE_KEY` é necessária para criar transações bypassando RLS.
   
   **Importante:** 
   - Use `sk_test_...` para ambiente de desenvolvimento/teste
   - Use `sk_live_...` apenas em produção
   - Nunca compartilhe ou commite suas chaves secretas no código

## 6. Webhook do Stripe para Atualizar Créditos

Crie uma Edge Function chamada `stripe-webhook` para processar eventos do Stripe:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const PLAN_CREDITS: Record<string, number> = {
  'starter': 20,
  'genius': 100,
  'master': 300,
};

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response(
      JSON.stringify({ error: "Assinatura não encontrada" }),
      { status: 400 }
    );
  }

  const body = await req.text();
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret || "");
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Webhook Error: ${err.message}` }),
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const planId = session.metadata?.plan_id;
    const userId = session.metadata?.user_id || session.client_reference_id;
    const credits = planId ? PLAN_CREDITS[planId] : 0;

    if (!userId || !credits) {
      return new Response(
        JSON.stringify({ error: "Dados inválidos" }),
        { status: 400 }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "" // Use service role key para bypass RLS
    );

    // Atualizar créditos do usuário
    const { data: profile } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", userId)
      .single();

    await supabase
      .from("profiles")
      .update({ credits: (profile?.credits || 0) + credits })
      .eq("id", userId);

    // Atualizar status da transação
    await supabase
      .from("transactions")
      .update({ status: "completed" })
      .eq("stripe_session_id", session.id);
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});
```

**Configurar Webhook no Stripe:**

1. No painel do Stripe, vá em **Desenvolvedores > Webhooks**
2. Clique em **Add endpoint** (Adicionar endpoint)
3. Cole a URL da sua Edge Function: `https://seu-projeto.supabase.co/functions/v1/stripe-webhook`
   - Substitua `seu-projeto` pelo ID do seu projeto Supabase
   - Você encontra o ID na URL do seu projeto: `https://seu-projeto.supabase.co`
4. Selecione o evento: `checkout.session.completed`
5. Clique em **Add endpoint** (Adicionar endpoint)
6. Após criar o webhook, clique nele para ver os detalhes
7. Na seção **Signing secret**, clique em **Reveal** (Revelar) ou **Click to reveal** (Clique para revelar)
8. Copie o **Signing secret** (começa com `whsec_...`)

**Adicionar `STRIPE_WEBHOOK_SECRET` na Edge Function:**

1. No painel do Supabase, vá em **Edge Functions**
2. Clique na função `stripe-webhook`
3. Vá na aba **Settings** (Configurações)
4. Na seção **Environment Variables**, clique em **Add new variable**
5. Adicione:
   - **Nome:** `STRIPE_WEBHOOK_SECRET`
   - **Valor:** Cole o Signing secret que você copiou do Stripe (começa com `whsec_...`)
6. Clique em **Save** (Salvar)

**Variáveis de ambiente necessárias para `stripe-webhook`:**
- `STRIPE_SECRET_KEY`: Chave secreta do Stripe (mesma da função anterior)
- `STRIPE_WEBHOOK_SECRET`: Signing secret do webhook (obtido no passo acima)
- `SUPABASE_URL`: URL do projeto (geralmente já disponível)
- `SUPABASE_SERVICE_ROLE_KEY`: Chave de service role (obtenha em **Settings > API > service_role key**)
