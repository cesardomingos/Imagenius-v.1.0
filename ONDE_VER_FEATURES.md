# 📍 Onde o Usuário Pode Ver e Acessar as Funcionalidades

Este documento explica onde cada funcionalidade implementada está visível e acessível para o usuário final.

---

## 🎨 1. Seção de Blog/Conteúdo

### **Onde está:**
- **Página Inicial (Home)** - Aparece automaticamente quando o usuário está na tela de seleção de modo (`mode_selection`)
- **Localização:** Após a seção "Casos de Sucesso" e antes da "Galeria da Comunidade"
- **Rolagem:** O usuário precisa rolar a página para baixo para ver

### **Como acessar:**
1. Acessar a página inicial do site
2. Rolar a página para baixo
3. A seção aparece com o título "Aprenda e Inspire-se"
4. Filtros disponíveis: "Todos", "Tutorial", "Case de Uso", "Dica"

### **O que o usuário vê:**
- Grid de 6 cards de posts (Tutoriais, Cases de Uso, Dicas)
- Cada card mostra:
  - Ícone e categoria
  - Título e descrição
  - Tempo de leitura
  - Tags
  - Botão "Ler Artigo" (atualmente sem ação - precisa implementar)

### **Status:**
✅ **Visível** - Mas os botões "Ler Artigo" e "Ver Todos os Casos de Uso" não têm ações implementadas ainda

---

## 📧 2. Sistema de Email Marketing

### **Onde está:**
- **Automático** - Não é visível diretamente na interface
- **Funciona em background** através de triggers no banco de dados

### **Como funciona:**
Os emails são enviados automaticamente quando certos eventos acontecem:

#### **Email de Boas-vindas:**
- **Quando:** Imediatamente após o usuário criar uma conta
- **Trigger:** Quando um novo perfil é criado na tabela `profiles`
- **Onde o usuário recebe:** Na caixa de entrada do email cadastrado

#### **Alerta de Créditos Baixos:**
- **Quando:** Quando os créditos do usuário caem para 3 ou menos
- **Trigger:** Quando `credits` é atualizado e fica ≤ 3
- **Frequência:** Máximo 1 email por 24 horas
- **Onde o usuário recebe:** Na caixa de entrada do email cadastrado

#### **Email de Compra Confirmada:**
- **Quando:** Após uma compra ser completada com sucesso
- **Trigger:** Quando uma transação muda para status `completed`
- **Onde o usuário recebe:** Na caixa de entrada do email cadastrado

### **Onde verificar se funcionou:**
- **Tabela `email_logs` no Supabase:**
  - Acessar Supabase Dashboard > Table Editor > `email_logs`
  - Ver todos os emails registrados pelo sistema
  - Campos: `recipient_email`, `email_type`, `subject`, `sent_at`

### **Status:**
⚠️ **Parcialmente Funcional** - Os triggers estão criados e registram os emails, mas para envio real é necessário integrar um serviço de email (SendGrid, Mailgun, etc.)

---

## 🎯 3. Tour Interativo (react-joyride)

### **Onde está:**
- **Página Inicial** - Aparece automaticamente na primeira visita
- **Quando:** Assim que o usuário acessa a página de seleção de modo pela primeira vez

### **Como funciona:**
1. **Primeira visita:**
   - O tour inicia automaticamente após 1 segundo
   - Mostra tooltips destacando elementos importantes
   - Usuário pode pular ou seguir os passos

2. **Visitas subsequentes:**
   - O tour não aparece mais (salvo no localStorage)
   - Para ver novamente: limpar localStorage ou resetar manualmente

### **Passos do Tour:**
1. **Boas-vindas** (centro da tela)
2. **Logo** (canto superior esquerdo)
3. **Contador de Créditos** (canto superior direito)
4. **Seleção de Modo** (botões "Preservar DNA" e "Fundir Ideias")
5. **Templates** (seção de templates)
6. **Upload de Imagem** (quando estiver na tela de upload)

### **Como resetar o tour:**
- Abrir DevTools (F12)
- Console: `localStorage.removeItem('imagenius_tour_completed')`
- Recarregar a página

### **Status:**
✅ **Funcional** - Funciona automaticamente na primeira visita

---

## 🏆 4. Leaderboard (Ranking de Usuários)

### **Onde está:**
- **Galeria da Comunidade** - Aparece no topo da seção
- **Página Inicial** - Dentro da seção "Galeria da Comunidade"
- **Localização:** Antes do grid de imagens da comunidade

### **Como acessar:**
1. Acessar a página inicial
2. Rolar até a seção "Galeria da Comunidade"
3. O leaderboard aparece automaticamente no topo

### **O que o usuário vê:**
- Top 10 usuários mais ativos
- 3 filtros disponíveis:
  - **Mais Imagens** - Usuários que geraram mais imagens
  - **Mais Curtidas** - Usuários com mais curtidas
  - **Mais Recentes** - Usuários mais ativos recentemente
- Cada entrada mostra:
  - Posição (🥇 🥈 🥉 ou #)
  - Avatar do usuário
  - Nome
  - Estatística relevante (imagens, curtidas, etc.)

### **Status:**
✅ **Funcional** - Visível na Galeria da Comunidade

---

## 📱 5. Service Worker (PWA e Offline)

### **Onde está:**
- **Automático** - Funciona em background
- **Não é visível diretamente** na interface

### **Como funciona:**
1. **Cache de Assets:**
   - Assets estáticos (JS, CSS, imagens) são cacheados automaticamente
   - Melhora performance em visitas subsequentes

2. **Funcionalidade Offline:**
   - Quando o usuário está offline, vê uma página personalizada
   - Assets cacheados continuam funcionando

3. **Instalação como PWA:**
   - Chrome/Edge: Mostra prompt de instalação
   - iOS Safari: Menu > "Adicionar à Tela de Início"
   - Android Chrome: Prompt de instalação

### **Como o usuário percebe:**
- **Performance:** Site carrega mais rápido em visitas subsequentes
- **Offline:** Pode navegar mesmo sem internet (página básica)
- **PWA:** Pode instalar como app no celular/computador

### **Status:**
✅ **Funcional** - Funciona automaticamente, mas requer HTTPS em produção

---

## 📊 6. Social Proof (Números Reais)

### **Onde está:**
- **Página Inicial** - Seção "Social Proof"
- **Localização:** Aparece na home page, geralmente no topo

### **O que o usuário vê:**
- Número total de usuários cadastrados
- Número total de imagens geradas
- Taxa de satisfação (baseada em transações completadas)

### **Status:**
✅ **Funcional** - Dados são buscados do banco de dados em tempo real

---

## 🎁 7. Sistema de Referral (Afiliados)

### **Onde está:**
- **Perfil do Usuário** - Seção de Referral
- **Como acessar:**
  1. Clicar no botão "Perfil" (header ou navbar mobile)
  2. Rolar até a seção "Programa de Afiliados"

### **O que o usuário vê:**
- Link de referência personalizado
- Botão para copiar o link
- Número de pessoas indicadas
- Créditos ganhos por indicações
- Níveis progressivos (Bronze, Silver, Gold) com badges

### **Status:**
✅ **Funcional** - Visível no perfil do usuário

---

## 📈 8. Histórico de Ações Recentes

### **Onde está:**
- **Perfil do Usuário** - Seção "Ações Recentes"
- **Como acessar:**
  1. Clicar no botão "Perfil"
  2. Rolar até a seção "Ações Recentes"

### **O que o usuário vê:**
- Imagens geradas nas últimas 24 horas
- Grid com previews das imagens
- Timestamp de quando foram criadas

### **Status:**
✅ **Funcional** - Visível no perfil do usuário

---

## 🔍 Resumo Rápido

| Funcionalidade | Onde Está | Como Acessar | Status |
|---------------|-----------|--------------|--------|
| **Blog/Conteúdo** | Página Inicial | Rolar para baixo | ✅ Visível (botões sem ação) |
| **Email Marketing** | Automático | Recebe por email | ⚠️ Parcial (precisa integração) |
| **Tour Interativo** | Página Inicial | Automático na 1ª visita | ✅ Funcional |
| **Leaderboard** | Galeria Comunidade | Rolar até galeria | ✅ Funcional |
| **Service Worker** | Background | Automático | ✅ Funcional |
| **Social Proof** | Página Inicial | Topo da página | ✅ Funcional |
| **Referral** | Perfil | Clicar em Perfil | ✅ Funcional |
| **Ações Recentes** | Perfil | Clicar em Perfil | ✅ Funcional |

---

## 🚨 Funcionalidades que Precisam de Ação

### 1. **Blog - Botões sem ação:**
- "Ler Artigo" - Não abre nenhum conteúdo
- "Ver Todos os Casos de Uso" - Não tem ação definida

**Solução:** Implementar:
- Páginas de artigos individuais, OU
- Modais com conteúdo completo, OU
- Links externos para blog real

### 2. **Email Marketing - Envio real:**
- Emails são registrados mas não enviados
- Precisa integrar serviço de email (SendGrid, Mailgun, Resend)

**Solução:** Seguir instruções em `TAREFAS_CONFIGURACAO.md` seção 4.3

---

## 💡 Dicas para Melhorar Visibilidade

### **Blog:**
- Adicionar link no menu principal
- Adicionar botão "Blog" no header
- Criar página dedicada de blog

### **Tour:**
- Adicionar botão "Ver Tour" no menu de configurações
- Mostrar novamente após atualizações importantes

### **Leaderboard:**
- Adicionar link direto no menu
- Criar página dedicada de rankings
- Mostrar no perfil do usuário sua posição

---

**Última atualização:** Janeiro 2024

