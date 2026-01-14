# Guia de Debug - Edge Function create-checkout-session

Este guia explica como usar os logs detalhados adicionados para debugar o erro 401.

## 📋 Logs Implementados

### **1. Logs no Frontend (`services/stripeService.ts`)**

Os logs do frontend aparecem no **Console do Navegador** (F12 → Console):

```
[frontend-1234567890] === ENVIANDO PARA EDGE FUNCTION ===
[frontend-1234567890] URL: https://xxx.supabase.co/functions/v1/create-checkout-session
[frontend-1234567890] Token presente: true
[frontend-1234567890] Token length: 250 caracteres
[frontend-1234567890] Token prefix: eyJhbGciOiJIUzI1NiIs...
[frontend-1234567890] Token expira em: 2024-01-01T12:00:00.000Z
[frontend-1234567890] apikey presente: true
[frontend-1234567890] apikey prefix: eyJhbGciOiJ...
[frontend-1234567890] Payload: { plan_id: 'genius', amount: 2990, currency: 'brl', user_id: 'xxx' }
```

**Em caso de erro 401:**
```
[frontend-1234567890] ❌ ERRO NA RESPOSTA ===
[frontend-1234567890] Status: 401 Unauthorized
[frontend-1234567890] ⚠️ ERRO 401 DETECTADO ===
[frontend-1234567890] Verifique:
[frontend-1234567890] 1. Token JWT está válido e não expirado?
[frontend-1234567890] 2. apikey do header corresponde ao SUPABASE_ANON_KEY?
[frontend-1234567890] 3. SUPABASE_ANON_KEY está configurado na Edge Function?
[frontend-1234567890] 4. Token foi gerado com a mesma SUPABASE_ANON_KEY?
```

### **2. Logs na Edge Function (`SUPABASE_SCHEMA.md`)**

Os logs da Edge Function aparecem no **Dashboard do Supabase**:
- Vá em **Edge Functions** → `create-checkout-session` → **Logs**

Cada requisição recebe um `requestId` único para rastreamento:

```
[abc-123-def] === NOVA REQUISIÇÃO ===
[abc-123-def] Método: POST
[abc-123-def] URL: https://xxx.supabase.co/functions/v1/create-checkout-session

[abc-123-def] === HEADERS ===
[abc-123-def] Authorization: presente
[abc-123-def] Token prefix: eyJhbGciOiJIUzI1NiIs...
[abc-123-def] Token length: 250 caracteres
[abc-123-def] apikey header: presente
[abc-123-def] apikey prefix: eyJhbGciOiJ...
[abc-123-def] apikey length: 200 caracteres
[abc-123-def] Content-Type: application/json

[abc-123-def] === VARIÁVEIS DE AMBIENTE ===
[abc-123-def] SUPABASE_URL: configurado
[abc-123-def] SUPABASE_ANON_KEY: configurado (eyJhbGciOiJ...)
[abc-123-def] STRIPE_SECRET_KEY: configurado
[abc-123-def] SITE_URL: https://seu-site.com

[abc-123-def] === VALIDAÇÃO DE TOKEN ===
[abc-123-def] Comparação apikey: ✓ CORRESPONDE
[abc-123-def] Criando cliente Supabase...
[abc-123-def] apikey source: header
[abc-123-def] finalApikey prefix: eyJhbGciOiJ...
[abc-123-def] Cliente Supabase criado. Validando token...
[abc-123-def] Validação concluída em 150ms
```

**Em caso de erro:**
```
[abc-123-def] ❌ ERRO DE AUTENTICAÇÃO ===
[abc-123-def] Mensagem: Invalid JWT
[abc-123-def] Status: 401
[abc-123-def] Nome: AuthError
[abc-123-def] Token prefix: eyJhbGciOiJIUzI1NiIs...
[abc-123-def] apikey match: ✗ NÃO
[abc-123-def] ⚠️ PROBLEMA IDENTIFICADO: apikey do header não corresponde!
[abc-123-def] Header apikey: eyJhbGciOiJIUzI1NiIs...
[abc-123-def] Env apikey: eyJhbGciOiJSUzI1NiIs...
```

## 🔍 Como Debugar o Erro 401

### **Passo 1: Verificar Logs do Frontend**

1. Abra o **Console do Navegador** (F12)
2. Tente fazer uma compra
3. Procure por logs com `[frontend-...]`
4. Verifique:
   - ✅ Token está presente?
   - ✅ Token não está expirado?
   - ✅ `apikey` está presente?
   - ✅ Payload está correto?

### **Passo 2: Verificar Logs da Edge Function**

1. Acesse o **Supabase Dashboard**
2. Vá em **Edge Functions** → `create-checkout-session`
3. Clique em **Logs**
4. Procure pelo `requestId` (está na resposta de erro do frontend)
5. Verifique:
   - ✅ Headers foram recebidos?
   - ✅ Variáveis de ambiente estão configuradas?
   - ✅ `apikey` do header corresponde ao `SUPABASE_ANON_KEY`?
   - ✅ Qual é a mensagem de erro exata?

### **Passo 3: Verificar Configuração**

#### **Frontend (`.env`):**
```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...  # ← Deve ser o mesmo da Edge Function
```

#### **Edge Function (Supabase Dashboard):**
1. Vá em **Edge Functions** → `create-checkout-session` → **Settings**
2. Verifique se `SUPABASE_ANON_KEY` está configurado
3. **IMPORTANTE:** Deve ser o **mesmo valor** de `VITE_SUPABASE_ANON_KEY` do frontend

### **Passo 4: Problemas Comuns**

#### **Problema 1: "apikey não corresponde"**
```
[requestId] apikey match: ✗ NÃO
[requestId] ⚠️ PROBLEMA IDENTIFICADO: apikey do header não corresponde!
```

**Solução:**
- Verifique se `VITE_SUPABASE_ANON_KEY` no frontend é igual a `SUPABASE_ANON_KEY` na Edge Function
- Ambos devem ser a **chave anon** do seu projeto Supabase
- Encontre a chave em: **Supabase Dashboard** → **Settings** → **API** → **anon public**

#### **Problema 2: "Token inválido" ou "Invalid JWT"**
```
[requestId] Mensagem: Invalid JWT
```

**Soluções:**
1. **Token expirado:** Faça logout e login novamente
2. **Token gerado com chave diferente:** Certifique-se de que o token foi gerado com a mesma `SUPABASE_ANON_KEY`
3. **Token corrompido:** Verifique se o token está sendo enviado corretamente (sem espaços extras, etc.)

#### **Problema 3: "SUPABASE_ANON_KEY não configurado"**
```
[requestId] SUPABASE_ANON_KEY: NÃO CONFIGURADO
```

**Solução:**
- Configure a variável de ambiente na Edge Function:
  - **Supabase Dashboard** → **Edge Functions** → `create-checkout-session` → **Settings**
  - Adicione: `SUPABASE_ANON_KEY` = `sua_chave_anon_aqui`

#### **Problema 4: "user_id não corresponde"**
```
[requestId] ❌ ERRO: user_id não corresponde
[requestId] user_id do body: xxx
[requestId] user.id autenticado: yyy
```

**Solução:**
- O `user_id` no payload deve corresponder ao `user.id` do token JWT
- Verifique se está passando o `user_id` correto no frontend

## 📊 Exemplo de Logs de Sucesso

### **Frontend:**
```
[frontend-1234567890] === ENVIANDO PARA EDGE FUNCTION ===
[frontend-1234567890] URL: https://xxx.supabase.co/functions/v1/create-checkout-session
[frontend-1234567890] Token presente: true
[frontend-1234567890] Token length: 250 caracteres
[frontend-1234567890] apikey presente: true
[frontend-1234567890] ✓ Resposta OK recebida
```

### **Edge Function:**
```
[abc-123-def] === NOVA REQUISIÇÃO ===
[abc-123-def] === HEADERS ===
[abc-123-def] Authorization: presente
[abc-123-def] apikey header: presente
[abc-123-def] === VARIÁVEIS DE AMBIENTE ===
[abc-123-def] SUPABASE_ANON_KEY: configurado
[abc-123-def] === VALIDAÇÃO DE TOKEN ===
[abc-123-def] Comparação apikey: ✓ CORRESPONDE
[abc-123-def] ✓ Usuário autenticado: xxx-xxx-xxx
[abc-123-def] === PROCESSANDO BODY ===
[abc-123-def] ✓ Plano válido: genius (100 créditos)
[abc-123-def] === CRIANDO SESSÃO STRIPE ===
[abc-123-def] ✓ Sessão Stripe criada em 200ms
[abc-123-def] === SUCESSO ===
```

## 🎯 Próximos Passos

1. **Teste novamente** com os logs ativados
2. **Copie os logs** (tanto do frontend quanto da Edge Function)
3. **Compare** os valores de `apikey` e `token`
4. **Verifique** se as variáveis de ambiente estão corretas
5. **Compartilhe os logs** se ainda houver problemas

## 🔒 Segurança

⚠️ **IMPORTANTE:** 
- Os logs mostram apenas **prefixos** dos tokens/chaves (primeiros 10-20 caracteres)
- **Nunca** compartilhe logs completos com tokens/chaves completos
- Remova logs sensíveis antes de compartilhar

