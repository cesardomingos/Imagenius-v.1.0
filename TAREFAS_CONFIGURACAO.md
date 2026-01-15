# 📋 Tarefas de Configuração - Funcionalidades Recentes

Este documento lista todas as tarefas que você precisa executar **fora do código** para deixar as funcionalidades recentemente desenvolvidas funcionando perfeitamente.

---

## 🎨 1. Seção de Blog/Conteúdo

### ✅ Tarefas:
- [ ] **Revisar e personalizar conteúdo dos posts**
  - Arquivo: `components/BlogContentSection.tsx`
  - Editar os 6 posts de exemplo com conteúdo real
  - Adicionar links reais para artigos (se tiver blog)
  - Atualizar tags e categorias conforme necessário

- [ ] **Adicionar imagens de preview (opcional)**
  - Se quiser adicionar imagens aos cards de blog
  - Adicionar campo `imageUrl` nos posts
  - Fazer upload das imagens para `/public/blog/`

- [ ] **Configurar ação do botão "Ver Todos os Casos de Uso"**
  - Atualmente o botão não tem ação definida
  - Decidir se deve abrir modal, redirecionar para página, etc.

---

## 🎯 2. Tour Interativo (react-joyride)

### ✅ Tarefas:
- [ ] **Testar o tour em diferentes dispositivos**
  - Mobile (iOS e Android)
  - Desktop (Chrome, Firefox, Safari, Edge)
  - Verificar se os elementos `data-tour` estão visíveis

- [ ] **Ajustar posicionamento dos tooltips (se necessário)**
  - Arquivo: `components/InteractiveTour.tsx`
  - Ajustar `placement` dos steps se algum tooltip ficar mal posicionado
  - Testar em diferentes tamanhos de tela

- [ ] **Personalizar mensagens do tour**
  - Revisar textos dos steps em `InteractiveTour.tsx`
  - Garantir que as instruções estão claras e objetivas
  - Adicionar mais steps se necessário

- [ ] **Verificar localStorage**
  - Confirmar que `imagenius_tour_completed` está sendo salvo corretamente
  - Testar reset do tour (limpar localStorage)

---

## 📱 3. Service Worker e PWA

### ✅ Tarefas:
- [ ] **Testar Service Worker em produção**
  - Fazer deploy e verificar se `/sw.js` está acessível
  - Verificar no DevTools > Application > Service Workers
  - Testar funcionalidade offline

- [ ] **Configurar manifest.json**
  - Arquivo: `public/manifest.json`
  - Adicionar ícones reais (atualmente usa favicon.svg)
  - Criar ícones em diferentes tamanhos:
    - 192x192px (Android)
    - 512x512px (Android splash)
    - 180x180px (iOS)
  - Fazer upload para `/public/` e atualizar `manifest.json`

- [ ] **Testar instalação como PWA**
  - Chrome/Edge: Verificar prompt de instalação
  - iOS Safari: Testar "Adicionar à Tela de Início"
  - Android Chrome: Testar instalação

- [ ] **Configurar cache strategy (opcional)**
  - Arquivo: `public/sw.js`
  - Ajustar quais assets são cacheados
  - Configurar TTL (Time To Live) se necessário
  - Adicionar mais URLs ao `STATIC_ASSETS` se necessário

- [ ] **Testar atualizações do Service Worker**
  - Fazer alteração no `sw.js`
  - Verificar se usuários recebem a atualização
  - Testar processo de atualização

---

## 📧 4. Sistema de Email Marketing

### ✅ Tarefas Críticas:

#### 4.1. Executar Migração SQL
- [ ] **Executar migração no Supabase**
  - Arquivo: `supabase/migrations/20240102000000_email_marketing.sql`
  - Acessar Supabase Dashboard > SQL Editor
  - Copiar e executar todo o conteúdo do arquivo
  - Verificar se tabela `email_logs` foi criada
  - Verificar se triggers foram criados

#### 4.2. Deploy da Edge Function
- [ ] **Fazer deploy da função `send-email`**
  ```bash
  # No terminal, na raiz do projeto:
  supabase functions deploy send-email
  ```
  - Ou usar Supabase Dashboard > Edge Functions > Deploy

- [ ] **Configurar variáveis de ambiente da Edge Function**
  - No Supabase Dashboard > Edge Functions > send-email > Settings
  - Verificar se `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` estão configuradas
  - (Geralmente já estão configuradas automaticamente)

#### 4.3. Configurar Integração de Email Real
⚠️ **IMPORTANTE**: O sistema atual apenas **registra** os emails na tabela `email_logs`. Para enviar emails reais, você precisa:

- [ ] **Opção A: Usar Supabase Email (Recomendado para começar)**
  - O Supabase já tem sistema de email integrado
  - Configurar templates em: Authentication > Email Templates
  - Os templates já estão documentados em `SUPABASE_EMAIL_TEMPLATES.md`
  - **Limitação**: Apenas para emails de autenticação (signup, reset password)

- [ ] **Opção B: Integrar serviço externo (Recomendado para produção)**
  - **SendGrid** (gratuito até 100 emails/dia)
    - Criar conta em sendgrid.com
    - Obter API Key
    - Atualizar `supabase/functions/send-email/index.ts` para usar SendGrid API
  - **Mailgun** (gratuito até 5.000 emails/mês)
    - Criar conta em mailgun.com
    - Obter API Key e Domain
    - Atualizar Edge Function
  - **Resend** (moderno, fácil de usar)
    - Criar conta em resend.com
    - Obter API Key
    - Atualizar Edge Function

- [ ] **Atualizar Edge Function com serviço escolhido**
  - Modificar `supabase/functions/send-email/index.ts`
  - Adicionar lógica de envio real usando API do serviço
  - Adicionar variável de ambiente com API Key
  - Testar envio de email

#### 4.4. Testar Triggers de Email
- [ ] **Testar email de boas-vindas**
  - Criar novo usuário de teste
  - Verificar se registro aparece em `email_logs`
  - Verificar se email foi enviado (se integração estiver configurada)

- [ ] **Testar alerta de créditos baixos**
  - Fazer login com usuário de teste
  - Usar créditos até ficar com 3 ou menos
  - Verificar se registro aparece em `email_logs`
  - Verificar se email foi enviado

- [ ] **Testar email de compra**
  - Fazer uma compra de teste (usar modo de teste do Stripe)
  - Verificar se registro aparece em `email_logs`
  - Verificar se email foi enviado

#### 4.5. Monitorar Emails Enviados
- [ ] **Criar dashboard de monitoramento (opcional)**
  - Criar query SQL para ver emails enviados:
    ```sql
    SELECT 
      email_type,
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE sent_at > NOW() - INTERVAL '24 hours') as last_24h
    FROM email_logs
    GROUP BY email_type;
    ```
  - Ou criar uma página admin no app para visualizar

---

## 🔧 5. Configurações Gerais

### ✅ Tarefas:

- [ ] **Verificar variáveis de ambiente**
  - Arquivo `.env.local` ou variáveis no Vercel/Netlify
  - Confirmar que todas estão configuradas:
    - `VITE_SUPABASE_URL`
    - `VITE_SUPABASE_ANON_KEY`
    - `VITE_GEMINI_API_KEY`
    - `VITE_STRIPE_PUBLISHABLE_KEY`
    - `VITE_SITE_URL` (opcional, mas recomendado)

- [ ] **Testar build de produção**
  ```bash
  npm run build
  npm run preview
  ```
  - Verificar se não há erros
  - Testar todas as funcionalidades

- [ ] **Fazer deploy**
  - Fazer deploy para produção (Vercel, Netlify, etc.)
  - Verificar se Service Worker está funcionando
  - Verificar se todas as rotas estão acessíveis

- [ ] **Configurar domínio customizado (se aplicável)**
  - Atualizar `manifest.json` com URL correta
  - Atualizar `index.html` com meta tags corretas
  - Configurar SSL/HTTPS (obrigatório para PWA)

---

## 📊 6. Testes Finais

### ✅ Checklist de Testes:

- [ ] **Tour Interativo**
  - [ ] Abre automaticamente na primeira visita
  - [ ] Não abre novamente após completar
  - [ ] Todos os elementos estão visíveis
  - [ ] Tooltips estão bem posicionados

- [ ] **Service Worker**
  - [ ] Registra corretamente
  - [ ] Cache funciona offline
  - [ ] Página offline aparece quando sem internet
  - [ ] Atualizações são detectadas

- [ ] **PWA**
  - [ ] Pode ser instalado como app
  - [ ] Ícones aparecem corretamente
  - [ ] Splash screen funciona (se configurado)

- [ ] **Email Marketing**
  - [ ] Triggers executam corretamente
  - [ ] Emails são registrados em `email_logs`
  - [ ] Emails são enviados (se integração configurada)
  - [ ] Templates estão formatados corretamente

- [ ] **Blog Section**
  - [ ] Posts aparecem corretamente
  - [ ] Filtros funcionam
  - [ ] Design está responsivo

---

## 🚨 Problemas Comuns e Soluções

### Service Worker não registra
- **Solução**: Verificar se está em HTTPS (ou localhost)
- Verificar console do navegador para erros
- Limpar cache e recarregar

### Emails não são enviados
- **Solução**: Verificar se Edge Function foi deployada
- Verificar logs da Edge Function no Supabase Dashboard
- Confirmar que integração de email está configurada
- Verificar se triggers estão ativos no banco

### Tour não aparece
- **Solução**: Limpar localStorage: `localStorage.removeItem('imagenius_tour_completed')`
- Verificar se elementos com `data-tour` existem na página
- Verificar console para erros do react-joyride

### PWA não instala
- **Solução**: Verificar se está em HTTPS
- Verificar se `manifest.json` está acessível
- Verificar se ícones existem e estão corretos
- Testar em diferentes navegadores

---

## 📝 Notas Importantes

1. **Email Marketing**: O sistema atual **registra** os emails, mas não envia automaticamente. Você precisa integrar um serviço de email externo para envio real.

2. **Service Worker**: Funciona apenas em HTTPS (ou localhost). Certifique-se de que seu site está em HTTPS em produção.

3. **PWA**: Requer HTTPS e manifest.json válido. Teste em diferentes dispositivos.

4. **Tour**: Pode ser desabilitado temporariamente comentando o código em `App.tsx` se necessário.

---

## ✅ Prioridades

**Alta Prioridade:**
1. Executar migração SQL do email marketing
2. Deploy da Edge Function send-email
3. Configurar integração de email real
4. Testar Service Worker em produção

**Média Prioridade:**
5. Configurar ícones do PWA
6. Personalizar conteúdo do blog
7. Ajustar tour se necessário

**Baixa Prioridade:**
8. Dashboard de monitoramento de emails
9. Adicionar mais templates de email
10. Otimizações de performance

---

**Última atualização**: Janeiro 2024
**Versão**: 1.0

