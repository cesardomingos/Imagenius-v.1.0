# Configuração de Assinaturas e Bônus PIX no Stripe

Este documento explica como configurar as assinaturas mensais/anuais e os bônus de créditos para pagamentos via PIX.

## 📋 Resumo das Funcionalidades

### Planos de Assinatura
- **Assinatura Genius Mensal**: R$ 19,90/mês - 200 imagens/mês
- **Assinatura Genius Anual**: R$ 14,90/mês (R$ 178,80/ano) - 200 imagens/mês

### Planos Avulsos com Bônus PIX
- **Aprendiz**: R$ 11,90 - 20 créditos (+5 bônus PIX = 25 total)
- **Gênio**: R$ 19,90 - 100 créditos (+20 bônus PIX = 120 total)
- **Imortal**: R$ 59,90 - 400 créditos (+100 bônus PIX = 500 total)

## 🔧 Configuração no Stripe

### 1. Habilitar PIX no Stripe

1. Acesse o Dashboard do Stripe
2. Vá em **Settings > Payment methods**
3. Ative o método de pagamento **PIX**
4. Configure as opções de PIX conforme necessário

### 2. Configurar Webhook

1. No Dashboard do Stripe, vá em **Developers > Webhooks**
2. Clique em **Add endpoint**
3. Configure:
   - **Endpoint URL**: `https://seu-projeto.supabase.co/functions/v1/stripe-webhook`
   - **Events to send**: Selecione:
     - `checkout.session.completed`
     - `invoice.payment_succeeded`
     - `customer.subscription.deleted`
4. Copie o **Signing secret** e adicione como variável de ambiente no Supabase:
   - Nome: `STRIPE_WEBHOOK_SECRET`
   - Valor: `whsec_...` (o secret copiado)

## 🚀 Deploy das Edge Functions

### 1. Deploy da função `create-checkout-session`

```bash
# No diretório do projeto
supabase functions deploy create-checkout-session
```

### 2. Deploy da função `stripe-webhook`

```bash
supabase functions deploy stripe-webhook
```

### 3. Variáveis de Ambiente Necessárias

Configure as seguintes variáveis de ambiente no Supabase Dashboard (Settings > Edge Functions):

- `STRIPE_SECRET_KEY`: Sua chave secreta do Stripe (sk_test_... ou sk_live_...)
- `STRIPE_WEBHOOK_SECRET`: O signing secret do webhook (whsec_...)
- `SUPABASE_URL`: URL do seu projeto Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key do Supabase
- `SITE_URL`: URL do seu site (ex: https://seusite.com)

## 📊 Como Funciona

### Pagamentos Únicos (Avulsos)

1. Usuário seleciona um plano avulso
2. Edge function cria sessão de checkout com PIX habilitado
3. Usuário paga via cartão ou PIX
4. Webhook processa `checkout.session.completed`
5. Créditos são adicionados:
   - Base do plano + bônus PIX (se pagou via PIX)

### Assinaturas

1. Usuário seleciona assinatura mensal ou anual
2. Edge function cria sessão de checkout em modo `subscription`
3. Usuário paga (apenas cartão, PIX não disponível para assinaturas)
4. Webhook processa `checkout.session.completed` (primeira cobrança)
5. Créditos mensais são adicionados (200)
6. A cada renovação, webhook processa `invoice.payment_succeeded`
7. Créditos mensais são adicionados novamente

## 🔍 Verificação

### Testar Pagamento Único com PIX

1. Selecione um plano avulso
2. No checkout do Stripe, escolha PIX
3. Complete o pagamento
4. Verifique se os créditos foram adicionados corretamente (base + bônus)

### Testar Assinatura

1. Selecione uma assinatura (mensal ou anual)
2. Complete o checkout
3. Verifique se 200 créditos foram adicionados
4. Aguarde a próxima cobrança (ou use o Stripe CLI para simular)
5. Verifique se mais 200 créditos foram adicionados na renovação

## 📝 Notas Importantes

1. **PIX apenas para pagamentos únicos**: Assinaturas não suportam PIX no Stripe
2. **Bônus PIX**: Apenas aplicado quando o pagamento é realmente via PIX
3. **Renovações de assinatura**: Processadas automaticamente via `invoice.payment_succeeded`
4. **Cancelamento**: Quando uma assinatura é cancelada, o evento `customer.subscription.deleted` é disparado

## 🐛 Troubleshooting

### Webhook não está recebendo eventos

1. Verifique se o endpoint está correto no Stripe
2. Verifique se `STRIPE_WEBHOOK_SECRET` está configurado corretamente
3. Use o Stripe CLI para testar localmente:
   ```bash
   stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
   ```

### Créditos não estão sendo adicionados

1. Verifique os logs da edge function no Supabase Dashboard
2. Verifique se a transação foi criada na tabela `transactions`
3. Verifique se o perfil do usuário foi atualizado na tabela `profiles`

### PIX não aparece como opção

1. Verifique se PIX está habilitado no Stripe Dashboard
2. Verifique se o modo da sessão está como `payment` (não `subscription`)
3. Verifique se a conta Stripe está no Brasil (PIX só funciona no Brasil)

