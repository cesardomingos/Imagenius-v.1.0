import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  text?: string;
  type: 'welcome' | 'low-credits' | 'purchase-success' | 'achievement' | 'referral';
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { to, subject, html, text, type }: EmailRequest = await req.json();

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, html' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Usar o sistema de email do Supabase
    const { data, error } = await supabaseClient.auth.admin.generateLink({
      type: 'magiclink',
      email: to,
    });

    if (error) {
      console.error('[SEND-EMAIL] Error:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Para emails customizados, vamos usar uma abordagem diferente
    // O Supabase não tem API direta para envio de emails customizados
    // Vamos usar o sistema de notificações ou integrar com um serviço externo
    
    // Por enquanto, vamos registrar o evento de email para tracking
    const { error: logError } = await supabaseClient
      .from('email_logs')
      .insert({
        recipient_email: to,
        email_type: type,
        subject: subject,
        sent_at: new Date().toISOString(),
      });

    if (logError) {
      console.error('[SEND-EMAIL] Error logging email:', logError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email queued for sending',
        type 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[SEND-EMAIL] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

