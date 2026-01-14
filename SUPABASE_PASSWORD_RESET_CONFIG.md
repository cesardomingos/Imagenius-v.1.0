# Configuração de Redefinição de Senha no Supabase

Este guia explica como configurar o sistema de redefinição de senha no Supabase para que os emails sejam enviados corretamente.

## 1. Configurar URL de Redirecionamento

### No Dashboard do Supabase:

1. Acesse seu projeto no [Supabase Dashboard](https://app.supabase.com)
2. Vá em **Authentication** → **URL Configuration**
3. Adicione sua URL de redirecionamento na lista **Redirect URLs**:
   ```
   http://localhost:5173/reset-password
   https://seudominio.com/reset-password
   ```
   (Substitua pela URL real da sua aplicação)

4. Adicione também na lista **Site URL**:
   ```
   http://localhost:5173
   https://seudominio.com
   ```

## 2. Configurar Templates de Email

### No Dashboard do Supabase:

1. Vá em **Authentication** → **Email Templates**
2. Selecione o template **Reset Password**
3. Personalize o template conforme necessário

### Template Padrão Sugerido:

**Subject:**
```
Redefinir sua senha - Imagenius
```

**Body (HTML):**
```html
<h2>Redefinir Senha</h2>
<p>Clique no link abaixo para redefinir sua senha:</p>
<p><a href="{{ .ConfirmationURL }}">Redefinir Senha</a></p>
<p>Se você não solicitou esta redefinição, ignore este email.</p>
<p>Este link expira em 1 hora.</p>
```

**Body (Text):**
```
Redefinir Senha

Clique no link abaixo para redefinir sua senha:
{{ .ConfirmationURL }}

Se você não solicitou esta redefinição, ignore este email.
Este link expira em 1 hora.
```

## 3. Configurar Provedor de Email

### Opção 1: Usar Email do Supabase (Desenvolvimento)

Para desenvolvimento, o Supabase envia emails automaticamente, mas eles podem ir para a pasta de spam.

### Opção 2: Configurar SMTP Personalizado (Produção)

1. Vá em **Project Settings** → **Auth** → **SMTP Settings**
2. Configure seu provedor SMTP:
   - **Host**: smtp.gmail.com (para Gmail) ou seu provedor
   - **Port**: 587 (TLS) ou 465 (SSL)
   - **Username**: seu email
   - **Password**: senha de aplicativo (não use a senha normal)
   - **Sender email**: email que aparecerá como remetente
   - **Sender name**: Nome do remetente (ex: "Imagenius")

### Exemplo para Gmail:

1. Ative a verificação em duas etapas na sua conta Google
2. Gere uma "Senha de app" em: https://myaccount.google.com/apppasswords
3. Use essa senha no campo **Password** do Supabase

### Exemplo para SendGrid:

1. Crie uma conta no SendGrid
2. Crie uma API Key
3. Configure:
   - **Host**: smtp.sendgrid.net
   - **Port**: 587
   - **Username**: apikey
   - **Password**: sua API key do SendGrid

## 4. Criar Página de Redefinição de Senha

Crie uma página na sua aplicação para processar o link de redefinição:

**Arquivo: `components/ResetPassword.tsx`** (já criado abaixo)

```tsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { updatePassword } from '../services/supabaseService';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Verificar se há token de redefinição na URL
    const accessToken = searchParams.get('access_token');
    const type = searchParams.get('type');
    
    if (!accessToken || type !== 'recovery') {
      setError('Link inválido ou expirado');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      const result = await updatePassword(password);
      
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        setError(result.error || 'Erro ao redefinir senha');
      }
    } catch (err: any) {
      setError('Erro ao redefinir senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Senha Redefinida!</h2>
          <p className="text-slate-600 mb-6">Sua senha foi redefinida com sucesso. Você será redirecionado para o login.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full">
        <h2 className="text-3xl font-black text-slate-900 mb-2">Redefinir Senha</h2>
        <p className="text-slate-600 mb-6">Digite sua nova senha abaixo.</p>

        {error && (
          <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl mb-4">
            <p className="text-sm font-bold text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Nova Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Confirmar Nova Senha
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Redefinindo...' : 'Redefinir Senha'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
```

## 5. Adicionar Rota (se usar React Router)

Se sua aplicação usa React Router, adicione a rota:

```tsx
import ResetPassword from './components/ResetPassword';

// No seu router:
<Route path="/reset-password" element={<ResetPassword />} />
```

## 6. Testar a Funcionalidade

1. Acesse a página de login
2. Clique em "Esqueceu a senha?"
3. Digite seu email
4. Verifique sua caixa de entrada (e spam)
5. Clique no link do email
6. Redefina sua senha

## 7. Troubleshooting

### Emails não estão chegando:

1. **Verifique a pasta de spam**
2. **Confirme a configuração SMTP** (se usando SMTP personalizado)
3. **Verifique os logs do Supabase**: Authentication → Logs
4. **Confirme que a URL de redirecionamento está correta**

### Link expira muito rápido:

1. Vá em **Project Settings** → **Auth**
2. Ajuste o **JWT expiry** (padrão é 1 hora)

### Erro "Invalid token":

1. O link pode ter expirado (tente solicitar novamente)
2. Verifique se a URL de redirecionamento está configurada corretamente
3. Certifique-se de que está usando HTTPS em produção

## 8. Segurança

- Links de redefinição expiram após 1 hora (padrão)
- Use HTTPS em produção
- Valide a senha no frontend e backend
- Considere adicionar rate limiting para prevenir spam

## Notas Importantes

- Em desenvolvimento, os emails podem demorar alguns minutos
- Em produção, configure um provedor SMTP confiável
- Teste sempre em ambiente de desenvolvimento antes de ir para produção
- Mantenha as URLs de redirecionamento atualizadas

