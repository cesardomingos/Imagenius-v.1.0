import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AchievementId, UserAchievement, ACHIEVEMENTS } from '../types/achievements';
import { getCurrentUser } from './supabaseService';

const getSupabaseClient = (): SupabaseClient | null => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    return createClient(supabaseUrl, supabaseAnonKey);
  }
  
  return null;
};

const supabase = getSupabaseClient();

/**
 * Verifica se o usuário já possui uma conquista
 */
export async function hasAchievement(achievementId: AchievementId): Promise<boolean> {
  try {
    if (!supabase) return false;

    const user = await getCurrentUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('user_achievements')
      .select('id')
      .eq('user_id', user.id)
      .eq('achievement_id', achievementId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao verificar achievement:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Erro ao verificar achievement:', error);
    return false;
  }
}

/**
 * Desbloqueia uma conquista para o usuário
 */
export async function unlockAchievement(
  achievementId: AchievementId
): Promise<{ success: boolean; achievement?: UserAchievement; error?: string }> {
  try {
    if (!supabase) {
      return { success: false, error: 'Supabase não configurado' };
    }

    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    // Verificar se já possui a conquista
    const alreadyHas = await hasAchievement(achievementId);
    if (alreadyHas) {
      return { success: false, error: 'Conquista já desbloqueada' };
    }

    // Obter informações da conquista
    const achievement = ACHIEVEMENTS[achievementId];
    if (!achievement) {
      return { success: false, error: 'Conquista não encontrada' };
    }

    // Inserir conquista
    const { data, error } = await supabase
      .from('user_achievements')
      .insert({
        user_id: user.id,
        achievement_id: achievementId,
        unlocked_at: new Date().toISOString(),
        reward_claimed: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao desbloquear achievement:', error);
      return { success: false, error: error.message };
    }

    // Se a conquista tem recompensa de crédito, adicionar
    if (achievement.reward?.type === 'credit') {
      await claimAchievementReward(achievementId);
    }

    return { success: true, achievement: data };
  } catch (error: any) {
    console.error('Erro ao desbloquear achievement:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Reivindica a recompensa de uma conquista
 */
async function claimAchievementReward(achievementId: AchievementId): Promise<void> {
  try {
    if (!supabase) return;

    const user = await getCurrentUser();
    if (!user) return;

    const achievement = ACHIEVEMENTS[achievementId];
    if (!achievement?.reward || achievement.reward.type !== 'credit') return;

    // Verificar se a recompensa já foi reivindicada
    const { data: existing } = await supabase
      .from('user_achievements')
      .select('reward_claimed')
      .eq('user_id', user.id)
      .eq('achievement_id', achievementId)
      .single();

    if (existing?.reward_claimed) {
      return; // Já foi reivindicada
    }

    // Adicionar créditos
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single();

    if (profile) {
      const newCredits = (profile.credits || 0) + achievement.reward.amount;
      await supabase
        .from('profiles')
        .update({ credits: newCredits })
        .eq('id', user.id);

      // Marcar recompensa como reivindicada
      await supabase
        .from('user_achievements')
        .update({ reward_claimed: true })
        .eq('user_id', user.id)
        .eq('achievement_id', achievementId);
    }
  } catch (error) {
    console.error('Erro ao reivindicar recompensa:', error);
  }
}

/**
 * Busca todas as conquistas do usuário
 */
export async function getUserAchievements(): Promise<UserAchievement[]> {
  try {
    if (!supabase) return [];

    const user = await getCurrentUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', user.id)
      .order('unlocked_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar achievements:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar achievements:', error);
    return [];
  }
}

/**
 * Verifica conquistas relacionadas à geração de imagens
 */
export async function checkImageGenerationAchievements(
  isFirstImage: boolean,
  imagesGeneratedIn24h: number
): Promise<AchievementId[]> {
  const unlocked: AchievementId[] = [];

  // A Faísca Inicial - Primeira imagem gerada
  if (isFirstImage) {
    const hasFirstSpark = await hasAchievement('first_spark');
    if (!hasFirstSpark) {
      const result = await unlockAchievement('first_spark');
      if (result.success) {
        unlocked.push('first_spark');
      }
    }
  }

  // Maratona Criativa - 10 imagens em 24h
  if (imagesGeneratedIn24h >= 10) {
    const hasMarathon = await hasAchievement('creative_marathon');
    if (!hasMarathon) {
      const result = await unlockAchievement('creative_marathon');
      if (result.success) {
        unlocked.push('creative_marathon');
      }
    }
  }

  return unlocked;
}

/**
 * Verifica conquista de Alquimista Visual (Modo Studio com 5 imagens)
 */
export async function checkVisualAlchemistAchievement(): Promise<AchievementId | null> {
  const hasAlchemist = await hasAchievement('visual_alchemist');
  if (!hasAlchemist) {
    const result = await unlockAchievement('visual_alchemist');
    if (result.success) {
      return 'visual_alchemist';
    }
  }
  return null;
}

/**
 * Verifica conquista de Diretor de Arte (5 prompts editados)
 */
export async function checkArtDirectorAchievement(editedPromptsCount: number): Promise<AchievementId | null> {
  if (editedPromptsCount >= 5) {
    const hasDirector = await hasAchievement('art_director');
    if (!hasDirector) {
      const result = await unlockAchievement('art_director');
      if (result.success) {
        return 'art_director';
      }
    }
  }
  return null;
}

/**
 * Verifica conquistas relacionadas a compras
 */
export async function checkPurchaseAchievements(
  isFirstPurchase: boolean,
  planId: string
): Promise<AchievementId[]> {
  const unlocked: AchievementId[] = [];

  // Mecenas das Artes - Primeira compra
  if (isFirstPurchase) {
    const hasPatron = await hasAchievement('art_patron');
    if (!hasPatron) {
      const result = await unlockAchievement('art_patron');
      if (result.success) {
        unlocked.push('art_patron');
      }
    }
  }

  // Poder Ilimitado - Pacote Master
  if (planId === 'master') {
    const hasUnlimited = await hasAchievement('unlimited_power');
    if (!hasUnlimited) {
      const result = await unlockAchievement('unlimited_power');
      if (result.success) {
        unlocked.push('unlimited_power');
      }
    }
  }

  return unlocked;
}

