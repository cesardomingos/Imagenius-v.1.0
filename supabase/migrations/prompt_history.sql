-- Migration: Histórico de Prompts
-- Cria tabela para armazenar histórico de prompts utilizados pelos usuários

CREATE TABLE IF NOT EXISTS prompt_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  template_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para buscar histórico por usuário (ordenado por data)
CREATE INDEX IF NOT EXISTS idx_prompt_history_user_created ON prompt_history(user_id, created_at DESC);

-- Índice para buscar por template
CREATE INDEX IF NOT EXISTS idx_prompt_history_template ON prompt_history(template_id) WHERE template_id IS NOT NULL;

-- Política RLS: usuários só podem ver seus próprios prompts
ALTER TABLE prompt_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own prompt history"
  ON prompt_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own prompt history"
  ON prompt_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prompt history"
  ON prompt_history FOR DELETE
  USING (auth.uid() = user_id);

-- Função para limpar prompts antigos (manter apenas últimos 50 por usuário)
CREATE OR REPLACE FUNCTION cleanup_old_prompts()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM prompt_history
  WHERE id NOT IN (
    SELECT id
    FROM prompt_history
    WHERE user_id = prompt_history.user_id
    ORDER BY created_at DESC
    LIMIT 50
  );
END;
$$;

-- Comentários
COMMENT ON TABLE prompt_history IS 'Armazena histórico de prompts utilizados pelos usuários para reutilização';
COMMENT ON COLUMN prompt_history.user_id IS 'ID do usuário que criou o prompt';
COMMENT ON COLUMN prompt_history.prompt IS 'Texto do prompt utilizado';
COMMENT ON COLUMN prompt_history.template_id IS 'ID do template utilizado (opcional)';
COMMENT ON COLUMN prompt_history.created_at IS 'Data de criação do prompt';

