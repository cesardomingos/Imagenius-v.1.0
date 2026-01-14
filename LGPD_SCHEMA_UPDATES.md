# Atualizações do Schema para LGPD

⚠️ **IMPORTANTE**: Execute o SQL do arquivo `SQL_ATUALIZACAO_LGPD.sql` no editor de consultas (SQL Editor) do seu projeto Supabase antes de usar as funcionalidades de consentimento.

O código foi preparado para funcionar mesmo sem a coluna `privacy_policy_version`, mas para funcionalidade completa, execute o SQL abaixo.

## Adicionar Colunas de Opt-in de Privacidade na Tabela profiles

```sql
-- Adicionar colunas de opt-in de privacidade
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS privacy_opt_in BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS privacy_opt_in_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS privacy_policy_version TEXT;

-- Adicionar colunas para perfil do usuário (nome e foto)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Comentários para documentação
COMMENT ON COLUMN public.profiles.privacy_opt_in IS 'Indica se o usuário optou por consentir com o tratamento de dados pessoais';
COMMENT ON COLUMN public.profiles.privacy_opt_in_date IS 'Data e hora em que o usuário deu consentimento';
COMMENT ON COLUMN public.profiles.privacy_policy_version IS 'Versão da política de privacidade quando o usuário deu consentimento (ex: "1.0.0")';
COMMENT ON COLUMN public.profiles.full_name IS 'Nome completo do usuário';
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL da foto de perfil do usuário';
```

## Atualizar Trigger de Criação de Perfil

```sql
-- Atualizar função de criação de perfil para incluir valores padrão
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, credits, privacy_opt_in, privacy_opt_in_date, privacy_policy_version, full_name, avatar_url)
  VALUES (
    new.id, 
    new.email, 
    5, -- Inicia com 5 créditos grátis
    false, -- Opt-in inicia como false
    NULL, -- Data de opt-in inicia como NULL
    NULL, -- Versão da política inicia como NULL
    NULL, -- Nome inicia como NULL
    NULL  -- Avatar inicia como NULL
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Índices para Performance

```sql
-- Índice para busca por opt-in (se necessário para relatórios)
CREATE INDEX IF NOT EXISTS idx_profiles_privacy_opt_in ON public.profiles(privacy_opt_in) WHERE privacy_opt_in = true;
```

## Notas Importantes

1. **Opt-in**: O campo `privacy_opt_in` deve ser `true` apenas quando o usuário explicitamente consentir durante o cadastro.
2. **Data de Opt-in**: A data é registrada automaticamente quando o usuário dá consentimento.
3. **Conformidade LGPD**: Esses campos permitem rastrear quando e como o consentimento foi obtido, conforme exigido pela LGPD.
4. **Exclusão de Conta**: Quando um usuário excluir sua conta, todos os dados relacionados devem ser removidos ou anonimizados.

