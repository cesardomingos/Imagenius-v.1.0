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

