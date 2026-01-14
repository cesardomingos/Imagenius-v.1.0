# Configurar Personal Access Token do GitHub

## ✅ Passo 1: Criar Personal Access Token

1. Acesse: https://github.com/settings/tokens
2. Clique em **"Generate new token"** → **"Generate new token (classic)"**
3. Configure:
   - **Note**: `Imagenius - Local Development`
   - **Expiration**: Escolha uma data (ou "No expiration" para desenvolvimento)
   - **Scopes**: Marque `repo` (acesso completo aos repositórios privados)
4. Clique em **"Generate token"**
5. **COPIE O TOKEN** (você só verá ele uma vez! Começa com `ghp_...`)

## ✅ Passo 2: Fazer Push com o Token

Quando você executar `git push`, o Windows vai solicitar credenciais:

1. **Username**: `cesardomingos`
2. **Password**: Cole o **Personal Access Token** (não use sua senha do GitHub!)

O Windows vai salvar essas credenciais automaticamente.

## 🔄 Alternativa: Configurar Token via URL

Se preferir, você pode configurar o token diretamente na URL do remote:

```bash
git remote set-url origin https://ghp_SEU_TOKEN_AQUI@github.com/cesardomingos/Imagenius-v.1.0.git
```

**⚠️ ATENÇÃO**: Não commite este arquivo se você usar esta opção, pois o token ficará visível!

## ✅ Verificar Configuração

```bash
# Verificar remote
git remote -v

# Verificar username
git config --global user.name

# Tentar fazer push
git push -u origin main
```

## 🔒 Segurança

- ✅ O token tem permissões limitadas (apenas `repo`)
- ✅ Você pode revogar o token a qualquer momento no GitHub
- ✅ O token é salvo de forma segura no Windows Credential Manager
- ❌ NUNCA compartilhe ou commite seu token no código

