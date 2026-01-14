-- ============================================
-- Migration: Corrigir criação de usuário
-- Este script corrige o erro 500 "Database error saving new user"
-- ============================================

-- 1. Garantir que todas as colunas necessárias existam na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referral_code TEXT,
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS privacy_opt_in BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS privacy_opt_in_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS privacy_policy_version TEXT,
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code) WHERE referral_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON public.profiles(referred_by) WHERE referred_by IS NOT NULL;

-- 3. Garantir que a função generate_referral_code existe
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_check BOOLEAN;
  attempts INTEGER := 0;
  max_attempts INTEGER := 10;
BEGIN
  LOOP
    attempts := attempts + 1;
    
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
    
    -- Proteção contra loop infinito
    IF attempts >= max_attempts THEN
      -- Se não conseguir gerar código único após 10 tentativas, usar timestamp
      code := UPPER(SUBSTRING(MD5(NOW()::TEXT || RANDOM()::TEXT), 1, 8));
      EXIT;
    END IF;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- 4. Atualizar função handle_new_user com tratamento de erros robusto
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  referral_code_value TEXT;
  referred_by_user_id UUID;
  initial_credits INTEGER;
  privacy_opt_in_value BOOLEAN;
  privacy_opt_in_date_value TIMESTAMP WITH TIME ZONE;
  privacy_policy_version_value TEXT;
BEGIN
  -- Inicializar valores padrão
  initial_credits := 15; -- Atualizado para 15 créditos iniciais
  privacy_opt_in_value := FALSE;
  privacy_opt_in_date_value := NULL;
  privacy_policy_version_value := NULL;
  
  -- Tentar obter valores da metadata do usuário
  IF NEW.raw_user_meta_data IS NOT NULL THEN
    -- Créditos iniciais
    IF NEW.raw_user_meta_data->>'initial_credits' IS NOT NULL THEN
      BEGIN
        initial_credits := (NEW.raw_user_meta_data->>'initial_credits')::INTEGER;
      EXCEPTION WHEN OTHERS THEN
        initial_credits := 15; -- Fallback para 15 se houver erro
      END;
    END IF;
    
    -- Privacy opt-in
    IF NEW.raw_user_meta_data->>'privacy_opt_in' IS NOT NULL THEN
      BEGIN
        privacy_opt_in_value := (NEW.raw_user_meta_data->>'privacy_opt_in')::BOOLEAN;
        IF privacy_opt_in_value THEN
          privacy_opt_in_date_value := NOW();
          privacy_policy_version_value := '1.0';
        END IF;
      EXCEPTION WHEN OTHERS THEN
        privacy_opt_in_value := FALSE;
      END;
    END IF;
  END IF;
  
  -- Gerar código de referência único
  BEGIN
    referral_code_value := public.generate_referral_code();
  EXCEPTION WHEN OTHERS THEN
    -- Fallback se a função falhar
    referral_code_value := UPPER(SUBSTRING(MD5(NEW.id::TEXT || NOW()::TEXT), 1, 8));
  END;
  
  -- Verificar se há um código de referência na metadata do usuário
  IF NEW.raw_user_meta_data IS NOT NULL AND NEW.raw_user_meta_data->>'referral_code' IS NOT NULL THEN
    BEGIN
      SELECT id INTO referred_by_user_id
      FROM public.profiles
      WHERE referral_code = NEW.raw_user_meta_data->>'referral_code'
      LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
      referred_by_user_id := NULL; -- Ignorar erro e continuar sem referral
    END;
  END IF;
  
  -- Inserir perfil com todos os campos (usando valores padrão seguros)
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
    avatar_url,
    updated_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    initial_credits,
    referral_code_value,
    referred_by_user_id,
    privacy_opt_in_value,
    privacy_opt_in_date_value,
    privacy_policy_version_value,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL),
    NOW()
  );
  
  -- Se o usuário foi referenciado, dar créditos ao referrer (opcional, apenas se a tabela existir)
  IF referred_by_user_id IS NOT NULL THEN
    BEGIN
      -- Adicionar créditos ao referrer
      UPDATE public.profiles
      SET credits = credits + 5
      WHERE id = referred_by_user_id;
      
      -- Tentar registrar achievement (apenas se a tabela existir)
      -- Isso é opcional e não deve quebrar a criação do usuário se falhar
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_achievements') THEN
        DECLARE
          referral_count INTEGER;
          ambassador_level TEXT;
        BEGIN
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
        EXCEPTION WHEN OTHERS THEN
          -- Ignorar erro de achievements e continuar
          NULL;
        END;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Ignorar erro de referral e continuar (não deve quebrar criação do usuário)
      NULL;
    END;
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log do erro (em produção, você pode querer usar um sistema de logging)
  RAISE WARNING 'Erro ao criar perfil para usuário %: %', NEW.id, SQLERRM;
  
  -- Tentar inserção mínima como fallback
  BEGIN
    INSERT INTO public.profiles (id, email, credits, updated_at)
    VALUES (NEW.id, COALESCE(NEW.email, ''), 15, NOW())
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- Se até o fallback falhar, re-raise o erro original
    RAISE;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Garantir que o trigger existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- 6. Verificar e atualizar política RLS para INSERT
DROP POLICY IF EXISTS "Permitir criação de perfil via trigger" ON public.profiles;
CREATE POLICY "Permitir criação de perfil via trigger" ON public.profiles
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- 7. Comentários para documentação
COMMENT ON FUNCTION public.handle_new_user() IS 'Função trigger que cria perfil automaticamente quando um novo usuário é criado no auth.users. Inclui suporte para referral codes, privacy opt-in e achievements.';
COMMENT ON FUNCTION public.generate_referral_code() IS 'Gera um código de referência único de 8 caracteres alfanuméricos para o usuário.';

-- ============================================
-- FIM DA MIGRATION
-- ============================================

