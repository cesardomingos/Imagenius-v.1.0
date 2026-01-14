-- Migration: Rate Limiting Persistente
-- Cria tabela para armazenar rate limits de usuários por endpoint

CREATE TABLE IF NOT EXISTS rate_limits (
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  count INTEGER DEFAULT 1,
  reset_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, endpoint)
);

-- Índice para performance em queries de reset
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset ON rate_limits(reset_at);

-- Índice para limpeza de registros expirados
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_endpoint ON rate_limits(user_id, endpoint);

-- Função para limpar registros expirados automaticamente
CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM rate_limits WHERE reset_at < NOW();
END;
$$;

-- Comentários
COMMENT ON TABLE rate_limits IS 'Armazena contadores de rate limit por usuário e endpoint';
COMMENT ON COLUMN rate_limits.user_id IS 'ID do usuário autenticado';
COMMENT ON COLUMN rate_limits.endpoint IS 'Nome do endpoint (ex: generate-image, suggest-prompts)';
COMMENT ON COLUMN rate_limits.count IS 'Número de requisições no período atual';
COMMENT ON COLUMN rate_limits.reset_at IS 'Timestamp quando o contador será resetado';

