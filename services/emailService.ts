/**
 * Serviço para envio de emails via Supabase Edge Functions
 */

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  type: 'welcome' | 'low-credits' | 'purchase-success' | 'achievement' | 'referral';
  metadata?: Record<string, any>;
}

/**
 * Envia um email através da Edge Function
 */
export async function sendEmail(params: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      console.error('[EmailService] VITE_SUPABASE_URL não configurado');
      return { success: false, error: 'Configuração faltando' };
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
        type: params.type,
        metadata: params.metadata,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[EmailService] Erro ao enviar email:', error);
      return { success: false, error };
    }

    const data = await response.json();
    return { success: true };
  } catch (error: any) {
    console.error('[EmailService] Erro inesperado:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Templates de email
 */
export const emailTemplates = {
  welcome: (userName: string = 'Gênio', credits: number = 5) => ({
    subject: 'Bem-vindo ao Imagenius! 🎨',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%); padding: 32px 24px; text-align: center; }
          .logo { font-size: 28px; font-weight: 900; color: #ffffff; margin-bottom: 8px; }
          .content { padding: 40px 32px; }
          .greeting { font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 16px; }
          .message { font-size: 15px; color: #475569; margin-bottom: 24px; line-height: 1.7; }
          .button { display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 14px; text-transform: uppercase; }
          .footer { background-color: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Imagenius</div>
          </div>
          <div class="content">
            <div class="greeting">Olá, ${userName}! 👋</div>
            <div class="message">
              Bem-vindo ao <strong>Imagenius</strong>! Estamos muito felizes em ter você conosco.
            </div>
            <div class="message">
              Você recebeu <strong>${credits} créditos</strong> para começar a criar imagens incríveis!
            </div>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${window.location.origin}" class="button">Começar a Criar</a>
            </div>
          </div>
          <div class="footer">
            <p style="font-size: 12px; color: #64748b;">© 2024 Imagenius. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Olá, ${userName}!\n\nBem-vindo ao Imagenius! Você recebeu ${credits} créditos para começar.\n\nAcesse: ${window.location.origin}`,
  }),

  lowCredits: (currentCredits: number) => ({
    subject: 'Seus créditos estão acabando! ⚠️',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); padding: 32px 24px; text-align: center; }
          .logo { font-size: 28px; font-weight: 900; color: #ffffff; margin-bottom: 8px; }
          .content { padding: 40px 32px; }
          .greeting { font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 16px; }
          .message { font-size: 15px; color: #475569; margin-bottom: 24px; line-height: 1.7; }
          .warning { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 8px; }
          .button { display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 14px; text-transform: uppercase; }
          .footer { background-color: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">⚠️ Imagenius</div>
          </div>
          <div class="content">
            <div class="greeting">Atenção!</div>
            <div class="message">
              Você tem apenas <strong>${currentCredits} crédito${currentCredits !== 1 ? 's' : ''}</strong> restante${currentCredits !== 1 ? 's' : ''}!
            </div>
            <div class="warning">
              <p style="margin: 0; font-size: 14px; color: #92400e;">
                <strong>Não perca a oportunidade de continuar criando!</strong> Recarregue seus créditos agora.
              </p>
            </div>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${window.location.origin}?action=buy-credits" class="button">Comprar Créditos</a>
            </div>
          </div>
          <div class="footer">
            <p style="font-size: 12px; color: #64748b;">© 2024 Imagenius. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Atenção! Você tem apenas ${currentCredits} crédito(s) restante(s). Recarregue agora: ${window.location.origin}?action=buy-credits`,
  }),

  purchaseSuccess: (creditsAdded: number, totalCredits: number) => ({
    subject: 'Compra confirmada! Seus créditos foram adicionados 🎉',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px 24px; text-align: center; }
          .logo { font-size: 28px; font-weight: 900; color: #ffffff; margin-bottom: 8px; }
          .content { padding: 40px 32px; }
          .greeting { font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 16px; }
          .message { font-size: 15px; color: #475569; margin-bottom: 24px; line-height: 1.7; }
          .success-box { background-color: #d1fae5; border-left: 4px solid #10b981; padding: 20px; margin: 24px 0; border-radius: 8px; }
          .button { display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 14px; text-transform: uppercase; }
          .footer { background-color: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🎉 Imagenius</div>
          </div>
          <div class="content">
            <div class="greeting">Compra Confirmada!</div>
            <div class="message">
              Sua compra foi processada com sucesso!
            </div>
            <div class="success-box">
              <p style="margin: 0; font-size: 16px; color: #065f46; font-weight: 700;">
                +${creditsAdded} créditos adicionados!<br>
                <span style="font-size: 14px; font-weight: 400;">Total: ${totalCredits} créditos</span>
              </p>
            </div>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${window.location.origin}" class="button">Começar a Criar</a>
            </div>
          </div>
          <div class="footer">
            <p style="font-size: 12px; color: #64748b;">© 2024 Imagenius. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Compra confirmada! +${creditsAdded} créditos adicionados. Total: ${totalCredits} créditos. Acesse: ${window.location.origin}`,
  }),
};

