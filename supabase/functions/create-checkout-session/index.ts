import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

/**
 * Obtém headers CORS baseado na origem da requisição
 * Valida contra lista de origens permitidas da variável de ambiente
 */
function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigins = Deno.env.get("ALLOWED_ORIGINS")?.split(",").map(o => o.trim()) || [];
  
  // Se não houver origens configuradas, permitir todas (desenvolvimento)
  // Em produção, sempre configurar ALLOWED_ORIGINS
  const isAllowed = allowedOrigins.length === 0 || (origin && allowedOrigins.includes(origin));
  const allowedOrigin = isAllowed && origin ? origin : (allowedOrigins[0] || "*");
  
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Credentials": isAllowed && origin ? "true" : "false",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };
}

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
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  
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

