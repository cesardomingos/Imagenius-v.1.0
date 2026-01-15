-- ============================================
-- Email Marketing System
-- ============================================

-- Tabela para logs de emails enviados
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_email TEXT NOT NULL,
  email_type TEXT NOT NULL CHECK (email_type IN ('welcome', 'low-credits', 'purchase-success', 'achievement', 'referral')),
  subject TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON public.email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_email_type ON public.email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON public.email_logs(sent_at);

-- Habilitar RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Política: usuários podem ver seus próprios logs de email
CREATE POLICY "Users can view their own email logs" ON public.email_logs
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- Função para enviar email de boas-vindas
-- ============================================
CREATE OR REPLACE FUNCTION public.send_welcome_email()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  user_name TEXT;
BEGIN
  -- Buscar email do usuário
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.id;

  -- Buscar nome do perfil (se disponível)
  SELECT full_name INTO user_name
  FROM public.profiles
  WHERE id = NEW.id;

  -- Registrar email de boas-vindas
  INSERT INTO public.email_logs (
    recipient_email,
    email_type,
    subject,
    user_id,
    metadata
  ) VALUES (
    user_email,
    'welcome',
    'Bem-vindo ao Imagenius! 🎨',
    NEW.id,
    jsonb_build_object(
      'user_name', COALESCE(user_name, 'Gênio'),
      'credits', NEW.credits,
      'referral_code', NEW.referral_code
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para enviar email de boas-vindas quando perfil é criado
DROP TRIGGER IF EXISTS trigger_send_welcome_email ON public.profiles;
CREATE TRIGGER trigger_send_welcome_email
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  WHEN (NEW.credits > 0)
  EXECUTE FUNCTION public.send_welcome_email();

-- ============================================
-- Função para detectar créditos baixos
-- ============================================
CREATE OR REPLACE FUNCTION public.check_low_credits()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  last_low_credit_email TIMESTAMP WITH TIME ZONE;
  credits_threshold INTEGER := 3;
BEGIN
  -- Só enviar se créditos estão baixos (<= 3) e antes tinha mais
  IF NEW.credits <= credits_threshold AND OLD.credits > credits_threshold THEN
    -- Buscar email do usuário
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = NEW.id;

    -- Verificar se já enviamos email de créditos baixos nas últimas 24 horas
    SELECT MAX(sent_at) INTO last_low_credit_email
    FROM public.email_logs
    WHERE user_id = NEW.id
      AND email_type = 'low-credits'
      AND sent_at > NOW() - INTERVAL '24 hours';

    -- Se não enviamos recentemente, registrar email
    IF last_low_credit_email IS NULL THEN
      INSERT INTO public.email_logs (
        recipient_email,
        email_type,
        subject,
        user_id,
        metadata
      ) VALUES (
        user_email,
        'low-credits',
        'Seus créditos estão acabando! ⚠️',
        NEW.id,
        jsonb_build_object(
          'current_credits', NEW.credits,
          'previous_credits', OLD.credits
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para detectar créditos baixos
DROP TRIGGER IF EXISTS trigger_check_low_credits ON public.profiles;
CREATE TRIGGER trigger_check_low_credits
  AFTER UPDATE OF credits ON public.profiles
  FOR EACH ROW
  WHEN (NEW.credits < OLD.credits)
  EXECUTE FUNCTION public.check_low_credits();

-- ============================================
-- Função para email de compra bem-sucedida
-- ============================================
CREATE OR REPLACE FUNCTION public.send_purchase_success_email()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  credits_added INTEGER;
BEGIN
  -- Só processar transações completadas
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Buscar email do usuário
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = NEW.user_id;

    -- Calcular créditos adicionados (baseado no plan_id)
    -- Isso deve ser calculado no webhook, mas vamos usar um valor padrão
    credits_added := CASE
      WHEN NEW.plan_id LIKE '%20%' THEN 20
      WHEN NEW.plan_id LIKE '%50%' THEN 50
      WHEN NEW.plan_id LIKE '%100%' THEN 100
      WHEN NEW.plan_id LIKE '%200%' THEN 200
      ELSE 0
    END;

    -- Registrar email de compra bem-sucedida
    INSERT INTO public.email_logs (
      recipient_email,
      email_type,
      subject,
      user_id,
      metadata
    ) VALUES (
      user_email,
      'purchase-success',
      'Compra confirmada! Seus créditos foram adicionados 🎉',
      NEW.user_id,
      jsonb_build_object(
        'transaction_id', NEW.id,
        'plan_id', NEW.plan_id,
        'credits_added', credits_added,
        'amount', NEW.amount_total
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para email de compra bem-sucedida
DROP TRIGGER IF EXISTS trigger_send_purchase_success_email ON public.transactions;
CREATE TRIGGER trigger_send_purchase_success_email
  AFTER INSERT OR UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.send_purchase_success_email();

-- ============================================
-- Comentários
-- ============================================
COMMENT ON TABLE public.email_logs IS 'Registra todos os emails enviados pelo sistema de marketing';
COMMENT ON FUNCTION public.send_welcome_email() IS 'Envia email de boas-vindas quando um novo usuário se cadastra';
COMMENT ON FUNCTION public.check_low_credits() IS 'Detecta quando créditos estão baixos e registra email de alerta';
COMMENT ON FUNCTION public.send_purchase_success_email() IS 'Envia email de confirmação quando uma compra é completada';

