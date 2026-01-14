-- ============================================
-- Script de Atualização do Schema para LGPD
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- 1. Adicionar colunas de opt-in de privacidade
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS privacy_opt_in BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS privacy_opt_in_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS privacy_policy_version TEXT;

-- 2. Adicionar colunas para perfil do usuário (nome e foto)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 3. Adicionar comentários para documentação
COMMENT ON COLUMN public.profiles.privacy_opt_in IS 'Indica se o usuário optou por consentir com o tratamento de dados pessoais';
COMMENT ON COLUMN public.profiles.privacy_opt_in_date IS 'Data e hora em que o usuário deu consentimento';
COMMENT ON COLUMN public.profiles.privacy_policy_version IS 'Versão da política de privacidade quando o usuário deu consentimento (ex: "1.0.0")';
COMMENT ON COLUMN public.profiles.full_name IS 'Nome completo do usuário';
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL da foto de perfil do usuário';

-- 4. Atualizar função de criação de perfil
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    credits, 
    privacy_opt_in, 
    privacy_opt_in_date, 
    privacy_policy_version, 
    full_name, 
    avatar_url
  )
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

-- 5. Criar índice para performance (opcional)
CREATE INDEX IF NOT EXISTS idx_profiles_privacy_opt_in 
ON public.profiles(privacy_opt_in) 
WHERE privacy_opt_in = true;

-- 6. Verificar se as colunas foram criadas corretamente
-- Execute esta query para verificar:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' 
--   AND table_name = 'profiles' 
--   AND column_name IN ('privacy_opt_in', 'privacy_opt_in_date', 'privacy_policy_version', 'full_name', 'avatar_url');

-- ============================================
-- FIM DO SCRIPT
-- ============================================

