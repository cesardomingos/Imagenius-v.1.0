-- ============================================
-- Schema de Gamificação: Sistema de Achievements
-- ============================================
-- Este script cria a tabela necessária para armazenar
-- as conquistas desbloqueadas pelos usuários.

-- Tabela: user_achievements
-- Armazena as conquistas desbloqueadas por cada usuário
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id TEXT NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reward_claimed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Garantir que um usuário não pode ter a mesma conquista duas vezes
    UNIQUE(user_id, achievement_id)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON public.user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked_at ON public.user_achievements(unlocked_at DESC);

-- RLS (Row Level Security)
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas suas próprias conquistas
CREATE POLICY "Users can view their own achievements"
    ON public.user_achievements
    FOR SELECT
    USING (auth.uid() = user_id);

-- Política: Usuários podem inserir suas próprias conquistas
CREATE POLICY "Users can insert their own achievements"
    ON public.user_achievements
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem atualizar suas próprias conquistas (para marcar recompensas como reivindicadas)
CREATE POLICY "Users can update their own achievements"
    ON public.user_achievements
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Comentários para documentação
COMMENT ON TABLE public.user_achievements IS 'Armazena as conquistas desbloqueadas pelos usuários';
COMMENT ON COLUMN public.user_achievements.achievement_id IS 'ID da conquista (ex: first_spark, visual_alchemist, etc.)';
COMMENT ON COLUMN public.user_achievements.reward_claimed IS 'Indica se a recompensa da conquista foi reivindicada';

-- ============================================
-- FIM DO SCRIPT
-- ============================================

