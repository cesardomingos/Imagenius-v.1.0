# Solução: API Key do Gemini Reportada como Vazada

## 🔍 Problema

Você recebeu o erro:
```json
{
  "error": {
    "code": 403,
    "message": "Your API key was reported as leaked. Please use another API key.",
    "status": "PERMISSION_DENIED"
  }
}
```

Isso significa que sua chave da API do Gemini foi detectada como vazada/exposta publicamente.

## ✅ Solução

### Passo 1: Gerar uma Nova API Key

1. Acesse: https://aistudio.google.com/apikey
2. Faça login com sua conta Google
3. Clique em **"Create API Key"** (Criar chave de API)
4. Selecione o projeto ou crie um novo
5. Copie a nova chave (começa com `AIza...`)

### Passo 2: Revogar a Chave Antiga (Importante!)

1. No mesmo painel (https://aistudio.google.com/apikey)
2. Encontre a chave antiga que foi vazada
3. Clique em **"Delete"** ou **"Revoke"** para revogá-la
4. Isso impede que outras pessoas usem sua chave vazada

### Passo 3: Atualizar a Nova Chave no Projeto

1. **No arquivo `.env` ou `.env.local`** (na raiz do projeto):
   ```
   GEMINI_API_KEY=sua_nova_chave_aqui
   VITE_GEMINI_API_KEY=sua_nova_chave_aqui
   ```

2. **Reinicie o servidor de desenvolvimento:**
   ```bash
   # Pare o servidor (Ctrl+C)
   npm run dev
   ```

### Passo 4: Verificar se a Chave Está Segura

✅ **Verifique se o arquivo `.env` está no `.gitignore`:**
   - O arquivo `.gitignore` já inclui `*.local`
   - Certifique-se de que `.env` e `.env.local` não estão commitados

✅ **Verifique se a chave não está no código:**
   - Nunca coloque a chave diretamente no código TypeScript/JavaScript
   - Sempre use variáveis de ambiente

✅ **Verifique o histórico do Git:**
   ```bash
   # Verificar se algum arquivo .env foi commitado
   git log --all --full-history -- .env
   git log --all --full-history -- .env.local
   ```

## 🔒 Prevenção Futura

### 1. Nunca Commite Arquivos `.env`

Certifique-se de que seu `.gitignore` inclui:
```
.env
.env.local
.env.*.local
*.env
```

### 2. Use Variáveis de Ambiente

Sempre use `import.meta.env.VITE_GEMINI_API_KEY` no código, nunca valores hardcoded.

### 3. Rotacione Chaves Regularmente

- Considere rotacionar chaves periodicamente
- Revogue chaves antigas quando não precisar mais

### 4. Use Restrições de API (Recomendado)

No Google AI Studio, você pode:
- Restringir a chave por IP
- Restringir por referrer (domínio)
- Limitar quotas

## 🆘 Se a Chave Continuar Vazada

Se mesmo após criar uma nova chave você receber o mesmo erro:

1. **Verifique se há commits antigos com a chave:**
   ```bash
   git log -p --all -S "AIza" -- .env
   ```

2. **Se encontrar, remova do histórico:**
   - Use `git filter-branch` ou `git filter-repo`
   - Ou force push (cuidado: isso reescreve o histórico)

3. **Verifique se a chave está em algum serviço de CI/CD:**
   - Vercel, Netlify, GitHub Actions, etc.
   - Certifique-se de usar variáveis de ambiente secretas

## 📋 Checklist

- [ ] Nova API key gerada no Google AI Studio
- [ ] Chave antiga revogada
- [ ] Nova chave adicionada ao arquivo `.env`
- [ ] Servidor reiniciado
- [ ] Teste de geração de imagem funcionando
- [ ] Verificado que `.env` não está commitado
- [ ] Configurado restrições de API (opcional, mas recomendado)

---

**Após seguir estes passos, sua aplicação deve voltar a funcionar normalmente!**

