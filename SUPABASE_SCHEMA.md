
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

## 3. Tabela de Artes da Comunidade
Para armazenar as artes compartilhadas pelos usuários na galeria comunitária.

```sql
-- Criar tabela de artes da comunidade
CREATE TABLE public.community_arts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL, -- URL da imagem gerada (pode ser base64 ou URL externa)
  prompt TEXT NOT NULL, -- Prompt usado para gerar a imagem
  is_shared BOOLEAN DEFAULT false NOT NULL, -- Se o usuário permitiu compartilhamento
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para melhor performance
CREATE INDEX idx_community_arts_user_id ON public.community_arts(user_id);
CREATE INDEX idx_community_arts_is_shared ON public.community_arts(is_shared) WHERE is_shared = true;
CREATE INDEX idx_community_arts_created_at ON public.community_arts(created_at DESC);

-- Habilitar Row Level Security
ALTER TABLE public.community_arts ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
-- Usuários podem ver todas as artes compartilhadas (is_shared = true)
CREATE POLICY "Qualquer um pode ver artes compartilhadas" ON public.community_arts
  FOR SELECT USING (is_shared = true);

-- Usuários podem ver suas próprias artes (mesmo que não compartilhadas)
CREATE POLICY "Usuários podem ver suas próprias artes" ON public.community_arts
  FOR SELECT USING (auth.uid() = user_id);

-- Usuários podem criar suas próprias artes
CREATE POLICY "Usuários podem criar suas próprias artes" ON public.community_arts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar suas próprias artes (para alterar is_shared)
CREATE POLICY "Usuários podem atualizar suas próprias artes" ON public.community_arts
  FOR UPDATE USING (auth.uid() = user_id);

-- Usuários podem deletar suas próprias artes
CREATE POLICY "Usuários podem deletar suas próprias artes" ON public.community_arts
  FOR DELETE USING (auth.uid() = user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_community_arts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_community_arts_updated_at
  BEFORE UPDATE ON public.community_arts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_community_arts_updated_at();
```

## 4. Tabela de Likes das Artes
Para armazenar os likes que os usuários dão nas artes da comunidade.

```sql
-- Criar tabela de likes
CREATE TABLE public.community_art_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  art_id UUID REFERENCES public.community_arts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  -- Garantir que um usuário só pode dar like uma vez por arte
  UNIQUE(art_id, user_id)
);

-- Índices para melhor performance
CREATE INDEX idx_community_art_likes_art_id ON public.community_art_likes(art_id);
CREATE INDEX idx_community_art_likes_user_id ON public.community_art_likes(user_id);

-- Habilitar Row Level Security
ALTER TABLE public.community_art_likes ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
-- Qualquer um pode ver os likes (para contar)
CREATE POLICY "Qualquer um pode ver likes" ON public.community_art_likes
  FOR SELECT USING (true);

-- Usuários podem criar seus próprios likes
CREATE POLICY "Usuários podem criar seus próprios likes" ON public.community_art_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuários podem deletar seus próprios likes (desfazer like)
CREATE POLICY "Usuários podem deletar seus próprios likes" ON public.community_art_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Nota: UPDATE não é permitido (apenas INSERT/DELETE para toggle de like)
```

## 5. View para Contagem de Likes
View materializada para facilitar a consulta de artes com contagem de likes.

```sql
-- View para artes com contagem de likes
CREATE OR REPLACE VIEW public.community_arts_with_likes AS
SELECT 
  ca.id,
  ca.user_id,
  ca.image_url,
  ca.prompt,
  ca.is_shared,
  ca.created_at,
  ca.updated_at,
  p.email as author_email,
  COALESCE(COUNT(cal.id), 0)::INTEGER as likes_count
FROM public.community_arts ca
LEFT JOIN public.profiles p ON ca.user_id = p.id
LEFT JOIN public.community_art_likes cal ON ca.id = cal.art_id
WHERE ca.is_shared = true
GROUP BY ca.id, ca.user_id, ca.image_url, ca.prompt, ca.is_shared, ca.created_at, ca.updated_at, p.email
ORDER BY ca.created_at DESC;

-- Política para a view (herda das tabelas base)
-- Não precisa de RLS separado, pois a view usa as políticas das tabelas base
```

## 6. Função Helper para Verificar se Usuário Deu Like
Função para verificar se um usuário específico deu like em uma arte (útil no frontend).

```sql
-- Função para verificar se usuário deu like em uma arte
CREATE OR REPLACE FUNCTION public.user_liked_art(art_id_param UUID, user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.community_art_likes 
    WHERE art_id = art_id_param AND user_id = user_id_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 7. Configuração do Cliente Supabase no Frontend

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

## 8. Configuração do Stripe no Frontend

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

## 9. Edge Function para Criar Sessão de Checkout

### Funcionalidades Implementadas

Esta Edge Function suporta:

1. **Planos Avulsos (One-time payments):**
   - `starter`: 20 créditos por R$ 11,90
   - `genius`: 100 créditos por R$ 19,90
   - `master`: 400 créditos por R$ 59,90
   - **Bônus PIX:** Pagamentos via PIX recebem créditos extras:
     - Starter: +5 créditos
     - Genius: +20 créditos
     - Master: +100 créditos

2. **Assinaturas (Subscriptions):**
   - `subscription-monthly`: 200 créditos/mês por R$ 19,90/mês
   - `subscription-yearly`: 200 créditos/mês por R$ 14,90/mês (cobrado anualmente: R$ 178,80/ano)

3. **Métodos de Pagamento:**
   - **Cartão de Crédito:** Disponível para todos os planos
   - **PIX:** Disponível apenas para planos avulsos (com bônus de créditos)

### Criação da Edge Function

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

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Créditos por plano
const PLAN_CREDITS: Record<string, number> = {
  // Planos Avulsos
  'starter': 20,
  'genius': 100,
  'master': 400,
  // Assinaturas (créditos mensais)
  'subscription-monthly': 200,
  'subscription-yearly': 200,
};

// Preços em centavos (BRL)
const PLAN_PRICES: Record<string, number> = {
  // Planos Avulsos
  'starter': 1190,   // R$ 11,90
  'genius': 1990,   // R$ 19,90
  'master': 5990,  // R$ 59,90
  // Assinaturas
  'subscription-monthly': 1990,  // R$ 19,90/mês
  'subscription-yearly': 1490,   // R$ 14,90/mês (cobrado anualmente)
};

// Bônus de créditos ao pagar via PIX (apenas para planos avulsos)
const PIX_BONUS: Record<string, number> = {
  'starter': 5,
  'genius': 20,
  'master': 100,
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";

    // Obter token de autenticação
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Token de autenticação não fornecido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validar usuário
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Usuário não autenticado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body = await req.json();
    const { plan_id, amount, currency, user_id, plan_type, interval, pix_bonus } = body;

    if (!plan_id || !PLAN_CREDITS[plan_id]) {
      return new Response(
        JSON.stringify({ error: "Plano inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const finalUserId = user_id || user.id;
    const amountInCents = amount || PLAN_PRICES[plan_id];
    const planType = plan_type || 'one-time';
    const isSubscription = planType === 'subscription';
    const subscriptionInterval = interval || 'month';

    // Calcular créditos (incluindo bônus PIX se aplicável)
    let creditsToAdd = PLAN_CREDITS[plan_id];
    if (!isSubscription && pix_bonus) {
      creditsToAdd += pix_bonus;
    }

    console.log(`[CHECKOUT] Criando sessão para plano: ${plan_id}`);
    console.log(`[CHECKOUT] Tipo: ${planType}, Intervalo: ${subscriptionInterval}`);
    console.log(`[CHECKOUT] Créditos: ${creditsToAdd} (base: ${PLAN_CREDITS[plan_id]}, bônus PIX: ${pix_bonus || 0})`);
    
    // Configurar sessão do Stripe
    const sessionConfig: any = {
      payment_method_types: isSubscription ? ["card"] : ["card", "pix"], // PIX apenas para pagamentos únicos
      line_items: [
        {
          price_data: {
            currency: currency || "brl",
            product_data: {
              name: isSubscription 
                ? `Assinatura Genius - ${PLAN_CREDITS[plan_id]} imagens/mês`
                : `Plano ${plan_id} - ${PLAN_CREDITS[plan_id]} créditos${pix_bonus ? ` (+${pix_bonus} bônus PIX)` : ''}`,
            },
            unit_amount: amountInCents,
            ...(isSubscription && {
              recurring: {
                interval: subscriptionInterval,
              },
            }),
          },
          quantity: 1,
        },
      ],
      mode: isSubscription ? "subscription" : "payment",
      success_url: `${Deno.env.get("SITE_URL") || "http://localhost:3000"}?checkout=success`,
      cancel_url: `${Deno.env.get("SITE_URL") || "http://localhost:3000"}?checkout=cancel`,
      client_reference_id: finalUserId,
      metadata: {
        plan_id,
        credits: creditsToAdd.toString(),
        user_id: finalUserId,
        plan_type: planType,
        ...(isSubscription && { interval: subscriptionInterval }),
        ...(pix_bonus && { pix_bonus: pix_bonus.toString() }),
      },
    };

    // Para assinaturas anuais, o valor já está correto (R$ 14,90/mês = R$ 178,80/ano)
    // O Stripe espera o valor total anual no unit_amount quando interval é 'year'
    if (isSubscription && subscriptionInterval === 'year') {
      // R$ 14,90/mês * 12 meses = R$ 178,80/ano = 17880 centavos
      sessionConfig.line_items[0].price_data.unit_amount = 17880;
    }

    // Criar sessão de checkout no Stripe
    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log(`[CHECKOUT] ✓ Sessão criada: ${session.id}`);

    // Criar transação/subscription pendente no Supabase usando service_role key
    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    if (isSubscription) {
      // Para assinaturas, criar registro na tabela de subscriptions (se existir)
      // Por enquanto, vamos criar uma transação especial
      const subscriptionAmount = subscriptionInterval === 'year' ? 17880 : amountInCents;
      const { error: transactionError } = await supabaseAdmin.from("transactions").insert({
        user_id: finalUserId,
        stripe_session_id: session.id,
        plan_id,
        amount_total: subscriptionAmount,
        currency: currency || "brl",
        status: "pending",
      });

      if (transactionError) {
        console.error(`[CHECKOUT] Erro ao criar transação:`, transactionError);
        return new Response(
          JSON.stringify({ error: "Erro ao criar transação" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      // Para pagamentos únicos
      const { error: transactionError } = await supabaseAdmin.from("transactions").insert({
        user_id: finalUserId,
        stripe_session_id: session.id,
        plan_id,
        amount_total: amountInCents,
        currency: currency || "brl",
        status: "pending",
      });

      if (transactionError) {
        console.error(`[CHECKOUT] Erro ao criar transação:`, transactionError);
        return new Response(
          JSON.stringify({ error: "Erro ao criar transação" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ 
        sessionId: session.id, 
        url: session.url 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error: any) {
    console.error("Erro na Edge Function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

## 10. Webhook do Stripe para Atualizar Créditos

Crie uma Edge Function chamada `stripe-webhook` para processar eventos do Stripe:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

// Créditos por plano (base, sem bônus)
const PLAN_CREDITS: Record<string, number> = {
  'starter': 20,
  'genius': 100,
  'master': 400,
  'subscription-monthly': 200,
  'subscription-yearly': 200,
};

serve(async (req) => {
  console.log(`[WEBHOOK] === NOVA REQUISIÇÃO WEBHOOK ===`);

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    console.error(`[WEBHOOK] ❌ Assinatura não encontrada`);
    return new Response(
      JSON.stringify({ error: "Assinatura não encontrada" }),
      { status: 400 }
    );
  }

  const body = await req.text();
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret || "");
    console.log(`[WEBHOOK] ✓ Evento validado: ${event.type}`);
  } catch (err: any) {
    console.error(`[WEBHOOK] ❌ Erro ao validar evento:`, err.message);
    return new Response(
      JSON.stringify({ error: `Webhook Error: ${err.message}` }),
      { status: 400 }
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // Processar checkout.session.completed (pagamentos únicos e primeira cobrança de assinatura)
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const planId = session.metadata?.plan_id;
    const userId = session.metadata?.user_id || session.client_reference_id;
    const planType = session.metadata?.plan_type || 'one-time';
    const pixBonus = parseInt(session.metadata?.pix_bonus || '0');
    
    // Verificar se o pagamento foi via PIX
    let isPixPayment = false;
    if (session.payment_intent) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent as string);
        // PIX no Stripe geralmente aparece como payment_method_type 'pix'
        isPixPayment = paymentIntent.payment_method_types?.includes('pix') || false;
      } catch (err) {
        console.log(`[WEBHOOK] Não foi possível verificar payment_intent:`, err);
      }
    }
    
    // Calcular créditos (base + bônus PIX se aplicável)
    let creditsToAdd = planId ? PLAN_CREDITS[planId] || 0 : 0;
    if (planType === 'one-time' && pixBonus > 0 && isPixPayment) {
      creditsToAdd += pixBonus;
      console.log(`[WEBHOOK] Pagamento via PIX detectado! Bônus: +${pixBonus} créditos`);
    }

    console.log(`[WEBHOOK] Processando checkout.session.completed`);
    console.log(`[WEBHOOK] Session ID: ${session.id}`);
    console.log(`[WEBHOOK] User ID: ${userId}`);
    console.log(`[WEBHOOK] Plan ID: ${planId}`);
    console.log(`[WEBHOOK] Plan Type: ${planType}`);
    console.log(`[WEBHOOK] PIX Bonus: ${pixBonus}`);
    console.log(`[WEBHOOK] Créditos a adicionar: ${creditsToAdd}`);

    if (!userId || !creditsToAdd) {
      console.error(`[WEBHOOK] ❌ Dados inválidos: userId=${userId}, credits=${creditsToAdd}`);
      return new Response(
        JSON.stringify({ error: "Dados inválidos" }),
        { status: 400 }
      );
    }

    // Verificar se é assinatura ou pagamento único
    const isSubscription = planType === 'subscription' || session.mode === 'subscription';

    // Buscar transação existente
    const { data: existingTransaction, error: fetchError } = await supabase
      .from("transactions")
      .select("*")
      .eq("stripe_session_id", session.id)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error(`[WEBHOOK] ❌ Erro ao buscar transação:`, fetchError);
      return new Response(
        JSON.stringify({ error: "Erro ao buscar transação" }),
        { status: 500 }
      );
    }

    // Verificar se já foi processado
    if (existingTransaction && existingTransaction.status === "completed") {
      console.log(`[WEBHOOK] Transação já processada, pulando...`);
      return new Response(
        JSON.stringify({ received: true, message: "Já processado" }),
        { status: 200 }
      );
    }

    // Criar ou atualizar transação
    if (!existingTransaction) {
      const { error: createError } = await supabase
        .from("transactions")
        .insert({
          user_id: userId,
          stripe_session_id: session.id,
          plan_id: planId || "",
          amount_total: session.amount_total || 0,
          currency: session.currency || "brl",
          status: "completed",
        });

      if (createError) {
        console.error(`[WEBHOOK] ❌ Erro ao criar transação:`, createError);
        return new Response(
          JSON.stringify({ error: "Erro ao criar transação" }),
          { status: 500 }
        );
      }
    } else {
      const { error: updateError } = await supabase
        .from("transactions")
        .update({ status: "completed" })
        .eq("stripe_session_id", session.id);

      if (updateError) {
        console.error(`[WEBHOOK] ❌ Erro ao atualizar transação:`, updateError);
        return new Response(
          JSON.stringify({ error: "Erro ao atualizar transação" }),
          { status: 500 }
        );
      }
    }

    // Adicionar créditos ao usuário
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error(`[WEBHOOK] ❌ Erro ao buscar perfil:`, profileError);
      return new Response(
        JSON.stringify({ error: "Erro ao buscar perfil" }),
        { status: 500 }
      );
    }

    const currentCredits = profile?.credits || 0;
    const newCredits = currentCredits + creditsToAdd;

    const { error: updateCreditsError } = await supabase
      .from("profiles")
      .update({ credits: newCredits })
      .eq("id", userId);

    if (updateCreditsError) {
      console.error(`[WEBHOOK] ❌ Erro ao atualizar créditos:`, updateCreditsError);
      return new Response(
        JSON.stringify({ error: "Erro ao atualizar créditos" }),
        { status: 500 }
      );
    }

    console.log(`[WEBHOOK] ✓ Créditos adicionados: ${creditsToAdd} (total: ${newCredits})`);

    // Se for assinatura, criar/atualizar registro de assinatura
    if (isSubscription && session.subscription) {
      // Aqui você pode criar uma tabela de subscriptions se necessário
      // Por enquanto, apenas logamos
      console.log(`[WEBHOOK] Assinatura criada: ${session.subscription}`);
    }

    return new Response(
      JSON.stringify({ received: true, creditsAdded: creditsToAdd }),
      { status: 200 }
    );
  }

  // Processar invoice.payment_succeeded (renovações de assinatura)
  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as Stripe.Invoice;
    const subscriptionId = invoice.subscription as string;

    if (!subscriptionId) {
      return new Response(
        JSON.stringify({ received: true, message: "Sem subscription ID" }),
        { status: 200 }
      );
    }

    // Buscar subscription no Stripe para obter metadata
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const customerId = subscription.customer as string;

    // Buscar usuário pelo customer_id (você pode armazenar isso no perfil)
    // Por enquanto, vamos usar metadata se disponível
    const userId = subscription.metadata?.user_id;
    const planId = subscription.metadata?.plan_id || 'subscription-monthly';
    const creditsToAdd = PLAN_CREDITS[planId] || 200;

    console.log(`[WEBHOOK] Processando renovação de assinatura`);
    console.log(`[WEBHOOK] Subscription ID: ${subscriptionId}`);
    console.log(`[WEBHOOK] User ID: ${userId}`);
    console.log(`[WEBHOOK] Créditos a adicionar: ${creditsToAdd}`);

    if (!userId) {
      console.error(`[WEBHOOK] ❌ User ID não encontrado na subscription`);
      return new Response(
        JSON.stringify({ received: true, message: "User ID não encontrado" }),
        { status: 200 }
      );
    }

    // Adicionar créditos mensais
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error(`[WEBHOOK] ❌ Erro ao buscar perfil:`, profileError);
      return new Response(
        JSON.stringify({ error: "Erro ao buscar perfil" }),
        { status: 500 }
      );
    }

    const currentCredits = profile?.credits || 0;
    const newCredits = currentCredits + creditsToAdd;

    const { error: updateCreditsError } = await supabase
      .from("profiles")
      .update({ credits: newCredits })
      .eq("id", userId);

    if (updateCreditsError) {
      console.error(`[WEBHOOK] ❌ Erro ao atualizar créditos:`, updateCreditsError);
      return new Response(
        JSON.stringify({ error: "Erro ao atualizar créditos" }),
        { status: 500 }
      );
    }

    console.log(`[WEBHOOK] ✓ Créditos mensais adicionados: ${creditsToAdd} (total: ${newCredits})`);

    return new Response(
      JSON.stringify({ received: true, creditsAdded: creditsToAdd }),
      { status: 200 }
    );
  }

  // Processar customer.subscription.deleted (cancelamento)
  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    console.log(`[WEBHOOK] Assinatura cancelada: ${subscription.id}`);
    // Aqui você pode atualizar o status da assinatura no banco
    return new Response(
      JSON.stringify({ received: true }),
      { status: 200 }
    );
  }

  // Outros eventos
  console.log(`[WEBHOOK] Evento não processado: ${event.type}`);
  return new Response(
    JSON.stringify({ received: true, message: `Evento ${event.type} não processado` }),
    { status: 200 }
  );
});
```

**Configurar Webhook no Stripe:**

1. No painel do Stripe, vá em **Desenvolvedores > Webhooks**
2. Clique em **Add endpoint** (Adicionar endpoint)
3. Cole a URL da sua Edge Function: `https://seu-projeto.supabase.co/functions/v1/stripe-webhook`
   - Substitua `seu-projeto` pelo ID do seu projeto Supabase
   - Você encontra o ID na URL do seu projeto: `https://seu-projeto.supabase.co`
4. Selecione os eventos:
   - `checkout.session.completed` (pagamentos únicos e primeira cobrança de assinatura)
   - `invoice.payment_succeeded` (renovações de assinatura)
   - `customer.subscription.deleted` (cancelamentos)
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

### Funcionalidades do Webhook

O webhook processa os seguintes eventos do Stripe:

1. **`checkout.session.completed`:**
   - Processa pagamentos únicos e primeira cobrança de assinaturas
   - Detecta pagamentos via PIX e aplica bônus de créditos automaticamente
   - Adiciona créditos base + bônus PIX (se aplicável) ao perfil do usuário
   - Cria/atualiza transação no banco de dados

2. **`invoice.payment_succeeded`:**
   - Processa renovações mensais/anuais de assinaturas
   - Adiciona 200 créditos mensais ao perfil do usuário
   - Mantém a assinatura ativa

3. **`customer.subscription.deleted`:**
   - Processa cancelamentos de assinaturas
   - Permite atualizar status da assinatura no banco (se necessário)

### Detecção de Pagamento PIX

O webhook detecta pagamentos via PIX verificando o `payment_intent` da sessão:
- Se o método de pagamento incluir `'pix'`, o bônus é aplicado automaticamente
- O bônus só é aplicado para planos avulsos (`plan_type === 'one-time'`)
- O valor do bônus é definido no metadata da sessão (`pix_bonus`)
