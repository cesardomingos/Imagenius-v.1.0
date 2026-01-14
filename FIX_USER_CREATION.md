# Correção do Erro 500 na Criação de Usuário

## Problema

Ao criar um novo usuário, ocorre o erro:
```json
{
  "code": "unexpected_failure",
  "message": "Database error saving new user"
}
```

## Causa Raiz

O erro ocorre na função trigger `handle_new_user()` que é executada automaticamente quando um novo usuário é criado em `auth.users`. As possíveis causas são:

1. **Função `generate_referral_code()` não existe** - A função pode não ter sido criada antes do trigger tentar usá-la
2. **Colunas faltando na tabela `profiles`** - A função tenta inserir colunas que podem não existir
3. **Tabela `user_achievements` não existe** - A função tenta inserir achievements em uma tabela que pode não existir
4. **Falta de tratamento de erros** - Erros em partes opcionais (como achievements) quebram toda a criação do usuário
5. **Problemas com RLS (Row Level Security)** - Políticas de segurança podem estar bloqueando a inserção

## Solução

Foi criada uma migration (`supabase/migrations/fix_user_creation.sql`) que:

1. ✅ **Garante que todas as colunas existam** - Usa `ADD COLUMN IF NOT EXISTS` para criar colunas faltantes
2. ✅ **Cria a função `generate_referral_code()`** - Com proteção contra loops infinitos
3. ✅ **Tratamento robusto de erros** - Usa blocos `BEGIN...EXCEPTION` para tratar erros graciosamente
4. ✅ **Fallback seguro** - Se a inserção completa falhar, tenta uma inserção mínima
5. ✅ **Valores padrão corretos** - Inicia com 15 créditos (conforme esperado pelo código)
6. ✅ **Verificação de tabelas opcionais** - Verifica se `user_achievements` existe antes de tentar usar
7. ✅ **Atualiza política RLS** - Garante que a política de INSERT está correta

## Como Aplicar

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse o **Supabase Dashboard** → **SQL Editor**
2. Abra o arquivo `supabase/migrations/fix_user_creation.sql`
3. Copie todo o conteúdo
4. Cole no SQL Editor
5. Clique em **Run** para executar

### Opção 2: Via CLI do Supabase

```bash
# Se você usa Supabase CLI
supabase db push
```

Ou execute diretamente:

```bash
psql -h [seu-host] -U postgres -d postgres -f supabase/migrations/fix_user_creation.sql
```

## O que a Migration Faz

1. **Adiciona colunas faltantes** na tabela `profiles`:
   - `referral_code` (TEXT)
   - `referred_by` (UUID)
   - `privacy_opt_in` (BOOLEAN)
   - `privacy_opt_in_date` (TIMESTAMP)
   - `privacy_policy_version` (TEXT)
   - `full_name` (TEXT)
   - `avatar_url` (TEXT)

2. **Cria índices** para melhor performance

3. **Cria/atualiza a função `generate_referral_code()`** com:
   - Proteção contra loops infinitos
   - Fallback seguro se não conseguir gerar código único

4. **Reescreve a função `handle_new_user()`** com:
   - Tratamento de erros em cada etapa
   - Valores padrão seguros (15 créditos iniciais)
   - Suporte para referral codes
   - Suporte para privacy opt-in
   - Fallback para inserção mínima se tudo falhar

5. **Recria o trigger** `on_auth_user_created`

6. **Atualiza a política RLS** para permitir inserção via trigger

## Validação

Após aplicar a migration, teste criando um novo usuário:

1. Tente criar uma conta nova
2. Verifique se o usuário é criado com sucesso
3. Verifique se o perfil foi criado na tabela `profiles`:
   ```sql
   SELECT * FROM public.profiles WHERE email = 'seu-email@exemplo.com';
   ```
4. Verifique se o usuário tem 15 créditos iniciais

## Troubleshooting

### Se ainda houver erro após aplicar a migration:

1. **Verifique os logs do Supabase**:
   - Dashboard → Logs → Postgres Logs
   - Procure por erros relacionados a `handle_new_user`

2. **Verifique se o trigger existe**:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```

3. **Verifique se a função existe**:
   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'handle_new_user';
   ```

4. **Teste a função manualmente** (apenas para debug):
   ```sql
   -- CUIDADO: Não execute isso em produção sem entender o que faz
   -- Isso é apenas para debug
   SELECT public.handle_new_user();
   ```

5. **Verifique as políticas RLS**:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'profiles';
   ```

## Notas Importantes

- ⚠️ **A migration é idempotente** - Pode ser executada múltiplas vezes sem problemas
- ⚠️ **Não afeta usuários existentes** - Apenas corrige a criação de novos usuários
- ⚠️ **Mantém dados existentes** - Usa `IF NOT EXISTS` para não sobrescrever dados
- ⚠️ **Créditos iniciais atualizados** - Novos usuários receberão 15 créditos (não 5)

## Próximos Passos

Após aplicar a correção:
1. Teste a criação de usuário
2. Monitore os logs por alguns dias
3. Se tudo estiver funcionando, pode remover os scripts SQL antigos (`SQL_ATUALIZACAO_LGPD.sql` e `SQL_REFERRAL_SYSTEM.sql`) ou consolidá-los em migrations

