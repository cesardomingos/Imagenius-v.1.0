# IDs dos Planos vs Produtos do Stripe

## 🔍 Como Funciona Atualmente

Atualmente, o código está usando **`price_data`** para criar preços dinamicamente no Stripe. Isso significa:

- ✅ **NÃO precisa** de produtos pré-cadastrados no Stripe
- ✅ Os IDs no frontend (`starter`, `genius`, `master`) são apenas identificadores internos
- ✅ O Stripe cria o produto e preço automaticamente na sessão de checkout

### Código Atual (Edge Function):
```typescript
line_items: [
  {
    price_data: {
      currency: "brl",
      product_data: {
        name: `Plano ${plan_id} - ${PLAN_CREDITS[plan_id]} créditos`,
      },
      unit_amount: amountInCents,
    },
    quantity: 1,
  },
],
```

## 🤔 Você Precisa Usar Produtos Pré-cadastrados?

### **Opção 1: Continuar com Preços Dinâmicos (Atual)** ✅

**Vantagens:**
- ✅ Não precisa gerenciar produtos no Stripe
- ✅ Mais flexível (mudanças de preço sem alterar Stripe)
- ✅ Funciona perfeitamente assim

**Desvantagens:**
- ⚠️ Produtos são criados a cada checkout (mas isso é OK)
- ⚠️ Não aparece no catálogo do Stripe Dashboard

**Conclusão:** Se você não tem produtos cadastrados no Stripe, pode continuar assim. Os IDs do frontend (`starter`, `genius`, `master`) são apenas para sua aplicação.

### **Opção 2: Usar Produtos Pré-cadastrados no Stripe** 🔄

Se você **já tem produtos cadastrados** no Stripe e quer usar eles:

**Vantagens:**
- ✅ Produtos aparecem no catálogo do Stripe
- ✅ Melhor organização no Stripe Dashboard
- ✅ Pode reutilizar produtos existentes

**Desvantagens:**
- ⚠️ Precisa manter sincronização entre código e Stripe
- ⚠️ Mudanças de preço precisam ser feitas no Stripe

**Como implementar:**
1. No Stripe Dashboard, crie produtos com Prices
2. Copie os **Price IDs** (começam com `price_...`)
3. Mapeie os IDs do frontend para os Price IDs do Stripe
4. Modifique a Edge Function para usar `price` ao invés de `price_data`

## 📋 Resposta Direta

**NÃO, os IDs não precisam ser os mesmos** se você estiver usando `price_data` (criação dinâmica).

Os IDs no frontend (`starter`, `genius`, `master`) são apenas para:
- Identificar qual plano o usuário escolheu
- Mapear para créditos e preços no seu código
- Enviar no `metadata` do Stripe para o webhook processar

**MAS**, se você quiser usar produtos pré-cadastrados no Stripe, aí sim precisa mapear os IDs.

## 🎯 O Que Você Deve Fazer?

### **Se NÃO tem produtos no Stripe:**
- ✅ Continue como está (usando `price_data`)
- ✅ Os IDs do frontend são apenas internos
- ✅ Não precisa fazer nada

### **Se TEM produtos no Stripe e quer usar eles:**
1. Me diga os **Price IDs** dos seus produtos no Stripe
2. Eu atualizo o código para usar esses produtos
3. Mapeio os IDs do frontend para os Price IDs do Stripe

## 🔍 Como Verificar se Tem Produtos no Stripe

1. **Stripe Dashboard** → **Products**
2. Veja se há produtos cadastrados
3. Se houver, cada produto tem um ou mais **Prices** (IDs começam com `price_...`)

## 💡 Recomendação

Se você **não tem produtos cadastrados** e está funcionando bem, **continue como está**. A abordagem atual é válida e funciona perfeitamente.

Se você **tem produtos cadastrados** e quer usar eles para melhor organização, posso atualizar o código para usar os Price IDs do Stripe.

