# Templates de Email do Supabase - Imagenius

Este documento contém os templates de email personalizados para o Imagenius. Configure-os no painel do Supabase.

## Como Configurar

1. Acesse o **Supabase Dashboard**
2. Vá em **Authentication** > **Email Templates**
3. Selecione o template que deseja editar
4. Cole o conteúdo HTML/texto abaixo
5. Salve as alterações

---

## 1. Reset Password (Redefinição de Senha)

### Assunto do Email
```
Redefinir sua senha - Imagenius
```

### Template HTML

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      background-color: #f8fafc;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%);
      padding: 32px 24px;
      text-align: center;
    }
    .logo {
      font-size: 28px;
      font-weight: 900;
      color: #ffffff;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }
    .tagline {
      font-size: 10px;
      color: rgba(255, 255, 255, 0.9);
      text-transform: uppercase;
      letter-spacing: 0.2em;
      font-weight: 700;
    }
    .content {
      padding: 40px 32px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 16px;
    }
    .message {
      font-size: 15px;
      color: #475569;
      margin-bottom: 32px;
      line-height: 1.7;
    }
    .button-container {
      text-align: center;
      margin: 32px 0;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%);
      color: #ffffff;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
      transition: transform 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
    }
    .link-text {
      font-size: 13px;
      color: #64748b;
      margin-top: 24px;
      word-break: break-all;
      padding: 16px;
      background-color: #f1f5f9;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
    }
    .warning {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 16px;
      margin: 24px 0;
      border-radius: 8px;
    }
    .warning-text {
      font-size: 13px;
      color: #92400e;
      margin: 0;
    }
    .footer {
      background-color: #f8fafc;
      padding: 24px 32px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer-text {
      font-size: 12px;
      color: #64748b;
      margin: 8px 0;
    }
    .footer-link {
      color: #6366f1;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Imagenius</div>
      <div class="tagline">Generative Atelier</div>
    </div>
    
    <div class="content">
      <div class="greeting">Olá, Gênio! 👋</div>
      
      <div class="message">
        Recebemos uma solicitação para redefinir a senha da sua conta no <strong>Imagenius</strong>.
      </div>
      
      <div class="message">
        Clique no botão abaixo para criar uma nova senha. Este link é válido por <strong>1 hora</strong> e pode ser usado apenas uma vez.
      </div>
      
      <div class="button-container">
        <a href="{{ .ConfirmationURL }}" class="button">Redefinir Senha</a>
      </div>
      
      <div class="warning">
        <p class="warning-text">
          <strong>⚠️ Importante:</strong> Se você não solicitou esta redefinição, ignore este email. Sua senha permanecerá a mesma.
        </p>
      </div>
      
      <div class="message" style="font-size: 13px; color: #64748b; margin-top: 32px;">
        Se o botão não funcionar, copie e cole o link abaixo no seu navegador:
      </div>
      
      <div class="link-text">
        {{ .ConfirmationURL }}
      </div>
    </div>
    
    <div class="footer">
      <p class="footer-text">
        Este email foi enviado automaticamente. Por favor, não responda.
      </p>
      <p class="footer-text">
        Precisa de ajuda? Entre em contato através do nosso suporte.
      </p>
      <p class="footer-text" style="margin-top: 16px; font-size: 11px; color: #94a3b8;">
        © 2024 Imagenius. Todos os direitos reservados.
      </p>
    </div>
  </div>
</body>
</html>
```

### Template de Texto Simples (Fallback)

```
Olá, Gênio! 👋

Recebemos uma solicitação para redefinir a senha da sua conta no Imagenius.

Clique no link abaixo para criar uma nova senha. Este link é válido por 1 hora e pode ser usado apenas uma vez.

{{ .ConfirmationURL }}

⚠️ IMPORTANTE: Se você não solicitou esta redefinição, ignore este email. Sua senha permanecerá a mesma.

---

Este email foi enviado automaticamente. Por favor, não responda.

Precisa de ajuda? Entre em contato através do nosso suporte.

© 2024 Imagenius. Todos os direitos reservados.
```

---

## 2. Magic Link (Login sem Senha)

### Assunto do Email
```
Seu link de acesso - Imagenius
```

### Template HTML

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      background-color: #f8fafc;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%);
      padding: 32px 24px;
      text-align: center;
    }
    .logo {
      font-size: 28px;
      font-weight: 900;
      color: #ffffff;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }
    .tagline {
      font-size: 10px;
      color: rgba(255, 255, 255, 0.9);
      text-transform: uppercase;
      letter-spacing: 0.2em;
      font-weight: 700;
    }
    .content {
      padding: 40px 32px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 16px;
    }
    .message {
      font-size: 15px;
      color: #475569;
      margin-bottom: 32px;
      line-height: 1.7;
    }
    .button-container {
      text-align: center;
      margin: 32px 0;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%);
      color: #ffffff;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    }
    .warning {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 16px;
      margin: 24px 0;
      border-radius: 8px;
    }
    .warning-text {
      font-size: 13px;
      color: #92400e;
      margin: 0;
    }
    .footer {
      background-color: #f8fafc;
      padding: 24px 32px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer-text {
      font-size: 12px;
      color: #64748b;
      margin: 8px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Imagenius</div>
      <div class="tagline">Generative Atelier</div>
    </div>
    
    <div class="content">
      <div class="greeting">Olá! ✨</div>
      
      <div class="message">
        Clique no botão abaixo para fazer login na sua conta do <strong>Imagenius</strong>. Este link é válido por <strong>1 hora</strong>.
      </div>
      
      <div class="button-container">
        <a href="{{ .ConfirmationURL }}" class="button">Acessar Minha Conta</a>
      </div>
      
      <div class="warning">
        <p class="warning-text">
          <strong>⚠️ Importante:</strong> Se você não solicitou este acesso, ignore este email.
        </p>
      </div>
    </div>
    
    <div class="footer">
      <p class="footer-text">
        Este email foi enviado automaticamente. Por favor, não responda.
      </p>
      <p class="footer-text" style="margin-top: 16px; font-size: 11px; color: #94a3b8;">
        © 2024 Imagenius. Todos os direitos reservados.
      </p>
    </div>
  </div>
</body>
</html>
```

---

## 3. Confirmação de Email (Sign Up)

### Assunto do Email
```
Confirme sua conta - Imagenius
```

### Template HTML

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      background-color: #f8fafc;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%);
      padding: 32px 24px;
      text-align: center;
    }
    .logo {
      font-size: 28px;
      font-weight: 900;
      color: #ffffff;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }
    .tagline {
      font-size: 10px;
      color: rgba(255, 255, 255, 0.9);
      text-transform: uppercase;
      letter-spacing: 0.2em;
      font-weight: 700;
    }
    .content {
      padding: 40px 32px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 16px;
    }
    .message {
      font-size: 15px;
      color: #475569;
      margin-bottom: 24px;
      line-height: 1.7;
    }
    .highlight-box {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 50%, rgba(236, 72, 153, 0.1) 100%);
      border-left: 4px solid #6366f1;
      padding: 20px;
      margin: 24px 0;
      border-radius: 8px;
    }
    .highlight-text {
      font-size: 14px;
      color: #475569;
      margin: 0;
      font-weight: 600;
    }
    .button-container {
      text-align: center;
      margin: 32px 0;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%);
      color: #ffffff;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
      transition: transform 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
    }
    .link-text {
      font-size: 13px;
      color: #64748b;
      margin-top: 24px;
      word-break: break-all;
      padding: 16px;
      background-color: #f1f5f9;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
    }
    .benefits {
      background-color: #f8fafc;
      padding: 24px;
      margin: 32px 0;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }
    .benefits-title {
      font-size: 14px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 16px;
    }
    .benefit-item {
      display: flex;
      align-items: start;
      margin-bottom: 12px;
      font-size: 14px;
      color: #475569;
    }
    .benefit-icon {
      color: #6366f1;
      margin-right: 12px;
      font-size: 18px;
      flex-shrink: 0;
    }
    .footer {
      background-color: #f8fafc;
      padding: 24px 32px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer-text {
      font-size: 12px;
      color: #64748b;
      margin: 8px 0;
    }
    .footer-link {
      color: #6366f1;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Imagenius</div>
      <div class="tagline">Generative Atelier</div>
    </div>
    
    <div class="content">
      <div class="greeting">Bem-vindo ao Imagenius! 🎨✨</div>
      
      <div class="message">
        Estamos muito felizes em ter você conosco! Você deu o primeiro passo para transformar suas ideias em arte incrível.
      </div>
      
      <div class="highlight-box">
        <p class="highlight-text">
          🎯 Para começar a criar, confirme seu email clicando no botão abaixo. Este link é válido por <strong>24 horas</strong>.
        </p>
      </div>
      
      <div class="button-container">
        <a href="{{ .ConfirmationURL }}" class="button">Confirmar Email</a>
      </div>
      
      <div class="benefits">
        <div class="benefits-title">O que você pode fazer no Imagenius:</div>
        <div class="benefit-item">
          <span class="benefit-icon">🎨</span>
          <span>Criar variações de imagens mantendo a estética original</span>
        </div>
        <div class="benefit-item">
          <span class="benefit-icon">⚡</span>
          <span>Gerar múltiplas imagens em lote com um clique</span>
        </div>
        <div class="benefit-item">
          <span class="benefit-icon">🏆</span>
          <span>Desbloquear conquistas e ganhar créditos bônus</span>
        </div>
        <div class="benefit-item">
          <span class="benefit-icon">🌐</span>
          <span>Compartilhar suas criações com a comunidade</span>
        </div>
      </div>
      
      <div class="message" style="font-size: 13px; color: #64748b; margin-top: 32px;">
        Se o botão não funcionar, copie e cole o link abaixo no seu navegador:
      </div>
      
      <div class="link-text">
        {{ .ConfirmationURL }}
      </div>
      
      <div class="message" style="font-size: 13px; color: #94a3b8; margin-top: 24px; font-style: italic;">
        Se você não criou uma conta no Imagenius, pode ignorar este email com segurança.
      </div>
    </div>
    
    <div class="footer">
      <p class="footer-text">
        Este email foi enviado automaticamente. Por favor, não responda.
      </p>
      <p class="footer-text">
        Precisa de ajuda? Entre em contato através do nosso suporte.
      </p>
      <p class="footer-text" style="margin-top: 16px; font-size: 11px; color: #94a3b8;">
        © 2024 Imagenius. Todos os direitos reservados.
      </p>
    </div>
  </div>
</body>
</html>
```

### Template de Texto Simples (Fallback)

```
Bem-vindo ao Imagenius! 🎨✨

Estamos muito felizes em ter você conosco! Você deu o primeiro passo para transformar suas ideias em arte incrível.

🎯 Para começar a criar, confirme seu email clicando no link abaixo. Este link é válido por 24 horas.

{{ .ConfirmationURL }}

O que você pode fazer no Imagenius:
🎨 Criar variações de imagens mantendo a estética original
⚡ Gerar múltiplas imagens em lote com um clique
🏆 Desbloquear conquistas e ganhar créditos bônus
🌐 Compartilhar suas criações com a comunidade

Se você não criou uma conta no Imagenius, pode ignorar este email com segurança.

---

Este email foi enviado automaticamente. Por favor, não responda.

Precisa de ajuda? Entre em contato através do nosso suporte.

© 2024 Imagenius. Todos os direitos reservados.
```

---

## Variáveis Disponíveis

Os templates do Supabase suportam as seguintes variáveis:

- `{{ .ConfirmationURL }}` - URL de confirmação/reset
- `{{ .Email }}` - Email do usuário
- `{{ .Token }}` - Token de confirmação (se necessário)
- `{{ .TokenHash }}` - Hash do token (se necessário)
- `{{ .SiteURL }}` - URL do site configurado

---

## Notas Importantes

1. **Teste os templates**: Sempre teste os emails após configurá-los
2. **Responsividade**: Os templates HTML são responsivos e funcionam bem em dispositivos móveis
3. **Fallback**: O Supabase usa o template de texto simples se o HTML falhar
4. **Personalização**: Você pode ajustar cores, fontes e textos conforme necessário
5. **Segurança**: Nunca exponha tokens ou informações sensíveis nos templates

---

## Próximos Passos

Após configurar os templates:

1. Teste o fluxo de reset de senha
2. Verifique se os emails estão chegando corretamente
3. Ajuste o design se necessário
4. Configure o remetente (From Address) nas configurações de email do Supabase

