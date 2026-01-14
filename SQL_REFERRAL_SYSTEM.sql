-- ============================================
-- Sistema de Referência (Referral System)
-- ============================================
-- Este script adiciona suporte para sistema de referência,
-- onde usuários podem compartilhar links únicos e ganhar créditos
-- quando alguém se cadastra usando seu link.

-- ============================================
-- 1. Adicionar colunas na tabela profiles
-- ============================================

-- Código único de referência do usuário (gerado automaticamente)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- ID do usuário que referenciou este usuário (se aplicável)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON public.profiles(referred_by);

-- ============================================
-- 2. Função para gerar código de referência único
-- ============================================

CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    -- Gera um código de 8 caracteres alfanuméricos
    code := UPPER(
      SUBSTRING(
        MD5(RANDOM()::TEXT || NOW()::TEXT || GEN_RANDOM_UUID()::TEXT),
        1, 8
      )
    );
    
    -- Verifica se o código já existe
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = code) INTO exists_check;
    
    -- Se não existe, sai do loop
    EXIT WHEN NOT exists_check;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. Atualizar trigger handle_new_user para gerar referral_code
-- ============================================

-- Primeiro, vamos verificar se a função handle_new_user existe e atualizá-la
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  referral_code_value TEXT;
  referred_by_user_id UUID;
  referral_count INTEGER;
  ambassador_level TEXT;
BEGIN
  -- Gerar código de referência único
  referral_code_value := generate_referral_code();
  
  -- Verificar se há um código de referência na metadata do usuário
  -- (será passado durante o signup)
  IF NEW.raw_user_meta_data->>'referral_code' IS NOT NULL THEN
    -- Buscar o ID do usuário que tem esse código de referência
    SELECT id INTO referred_by_user_id
    FROM public.profiles
    WHERE referral_code = NEW.raw_user_meta_data->>'referral_code'
    LIMIT 1;
  END IF;
  
  -- Inserir perfil com referral_code e referred_by (se aplicável)
  INSERT INTO public.profiles (
    id,
    email,
    credits,
    referral_code,
    referred_by,
    privacy_opt_in,
    privacy_opt_in_date,
    privacy_policy_version,
    full_name,
    avatar_url
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'initial_credits')::INTEGER, 5),
    referral_code_value,
    referred_by_user_id,
    COALESCE((NEW.raw_user_meta_data->>'privacy_opt_in')::BOOLEAN, FALSE),
    CASE 
      WHEN (NEW.raw_user_meta_data->>'privacy_opt_in')::BOOLEAN = TRUE 
      THEN NOW() 
      ELSE NULL 
    END,
    CASE 
      WHEN (NEW.raw_user_meta_data->>'privacy_opt_in')::BOOLEAN = TRUE 
      THEN '1.0'
      ELSE NULL 
    END,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
  );
  
  -- Se o usuário foi referenciado, dar créditos ao referrer
  IF referred_by_user_id IS NOT NULL THEN
    -- Adicionar créditos ao referrer (padrão: 5 créditos)
    UPDATE public.profiles
    SET credits = credits + 5
    WHERE id = referred_by_user_id;
    
    -- Registrar achievement "Embaixador" - verificar quantas pessoas o referrer já convidou
    -- (incluindo este novo usuário que acabou de se cadastrar)
    SELECT COUNT(*) INTO referral_count
    FROM public.profiles
    WHERE referred_by = referred_by_user_id;
    
    -- Determinar nível baseado no número de referências
    IF referral_count >= 20 THEN
      ambassador_level := 'gold';
    ELSIF referral_count >= 5 THEN
      ambassador_level := 'silver';
    ELSE
      ambassador_level := 'bronze';
    END IF;
    
    -- Inserir ou atualizar achievement
    INSERT INTO public.user_achievements (user_id, achievement_id, level, progress, unlocked_at, reward_claimed)
    VALUES (referred_by_user_id, 'ambassador'::TEXT, ambassador_level, referral_count, NOW(), FALSE)
    ON CONFLICT (user_id, achievement_id) 
    DO UPDATE SET 
      level = ambassador_level,
      progress = referral_count,
      unlocked_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. Comentários para documentação
-- ============================================

COMMENT ON COLUMN public.profiles.referral_code IS 'Código único de referência do usuário (8 caracteres alfanuméricos)';
COMMENT ON COLUMN public.profiles.referred_by IS 'ID do usuário que referenciou este usuário';
COMMENT ON FUNCTION generate_referral_code() IS 'Gera um código de referência único de 8 caracteres';

-- ============================================
-- FIM DO SCRIPT
-- ============================================

