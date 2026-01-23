import { AchievementId, UserAchievement, ACHIEVEMENTS, AchievementLevel, AchievementProgress } from '../types/achievements';
import { getCurrentUser, getSupabaseClient } from './supabaseService';

/**
 * Verifica se o usuário já possui uma conquista (qualquer nível)
 */
export async function hasAchievement(achievementId: AchievementId): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    const user = await getCurrentUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('user_achievements')
      .select('id')
      .eq('user_id', user.id)
      .eq('achievement_id', achievementId)
      .limit(1);

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao verificar achievement:', error);
      return false;
    }

    return !!data && data.length > 0;
  } catch (error) {
    console.error('Erro ao verificar achievement:', error);
    return false;
  }
}

/**
 * Obtém o nível atual de um achievement do usuário
 */
export async function getUserAchievementLevel(achievementId: AchievementId): Promise<AchievementLevel | null> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    const user = await getCurrentUser();
    if (!user) return null;

    const { data: achievementsData, error } = await supabase
      .from('user_achievements')
      .select('level')
      .eq('user_id', user.id)
      .eq('achievement_id', achievementId)
      .order('unlocked_at', { ascending: false })
      .limit(1);

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar nível do achievement:', error);
      return null;
    }

    return achievementsData && achievementsData.length > 0 ? achievementsData[0].level as AchievementLevel : null;
  } catch (error) {
    console.error('Erro ao buscar nível do achievement:', error);
    return null;
  }
}

/**
 * Desbloqueia ou atualiza uma conquista para o usuário
 */
export async function unlockAchievement(
  achievementId: AchievementId,
  level: AchievementLevel = 'bronze',
  progress: number = 0
): Promise<{ success: boolean; achievement?: UserAchievement; error?: string; isUpgrade?: boolean }> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { success: false, error: 'Supabase não configurado' };
    }

    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    // Obter informações da conquista
    const achievement = ACHIEVEMENTS[achievementId];
    if (!achievement) {
      return { success: false, error: 'Conquista não encontrada' };
    }

    // Se for achievement único, sempre usar ouro
    const finalLevel = achievement.isUnique ? 'gold' : level;

    // Verificar se já possui a conquista
    const { data: existingData, error: existingError } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', user.id)
      .eq('achievement_id', achievementId)
      .order('unlocked_at', { ascending: false })
      .limit(1);

    // Ignorar erro se não houver resultado (PGRST116 = nenhum resultado)
    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Erro ao verificar achievement existente:', existingError);
    }

    const existing = existingData && existingData.length > 0 ? existingData[0] : null;

    let isUpgrade = false;
    let shouldUpgrade = false;

    if (existing) {
      // Se já tem, verificar se precisa atualizar o nível
      const currentLevel = existing.level as AchievementLevel;
      const levelOrder: AchievementLevel[] = ['bronze', 'silver', 'gold'];
      const currentIndex = levelOrder.indexOf(currentLevel);
      const newIndex = levelOrder.indexOf(finalLevel);

      if (newIndex > currentIndex) {
        shouldUpgrade = true;
        isUpgrade = true;
      } else {
        // Já tem nível igual ou superior
        return { success: false, error: 'Conquista já desbloqueada com nível igual ou superior' };
      }
    }

    if (shouldUpgrade && existing) {
      // Atualizar nível existente
      const { data, error } = await supabase
        .from('user_achievements')
        .update({
          level: finalLevel,
          progress: progress,
          unlocked_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar achievement:', error);
        return { success: false, error: error.message };
      }

      // Adicionar recompensa do novo nível
      if (achievement.levels) {
        const levelConfig = achievement.levels.find(l => l.level === finalLevel);
        if (levelConfig) {
          await addCreditsReward(levelConfig.reward.amount);
        }
      } else if (achievement.reward) {
        await addCreditsReward(achievement.reward.amount);
      }

      return { success: true, achievement: data, isUpgrade: true };
    } else {
      // Inserir nova conquista
      const { data, error } = await supabase
        .from('user_achievements')
        .insert({
          user_id: user.id,
          achievement_id: achievementId,
          level: finalLevel,
          progress: progress,
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
      if (achievement.levels) {
        const levelConfig = achievement.levels.find(l => l.level === finalLevel);
        if (levelConfig) {
          await addCreditsReward(levelConfig.reward.amount);
        }
      } else if (achievement.reward) {
        await addCreditsReward(achievement.reward.amount);
      }

      return { success: true, achievement: data };
    }
  } catch (error: any) {
    console.error('Erro ao desbloquear achievement:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Adiciona créditos como recompensa
 */
async function addCreditsReward(amount: number): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase || amount <= 0) return;

    const user = await getCurrentUser();
    if (!user) return;

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .limit(1);

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Erro ao buscar perfil:', profileError);
      return;
    }

    const profile = profileData && profileData.length > 0 ? profileData[0] : null;
    if (profile) {
      const newCredits = (profile.credits || 0) + amount;
      await supabase
        .from('profiles')
        .update({ credits: newCredits })
        .eq('id', user.id);
    }
  } catch (error) {
    console.error('Erro ao adicionar créditos de recompensa:', error);
  }
}

/**
 * Busca todas as conquistas do usuário
 */
export async function getUserAchievements(): Promise<UserAchievement[]> {
  try {
    const supabase = getSupabaseClient();
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

    return (data || []).map(ach => ({
      id: ach.id,
      user_id: ach.user_id,
      achievement_id: ach.achievement_id as AchievementId,
      level: (ach.level || 'bronze') as AchievementLevel,
      progress: ach.progress || 0,
      unlocked_at: ach.unlocked_at,
      reward_claimed: ach.reward_claimed || false,
    })) as UserAchievement[];
  } catch (error) {
    console.error('Erro ao buscar achievements:', error);
    return [];
  }
}

/**
 * Obtém o progresso atual de um achievement
 */
export async function getAchievementProgress(achievementId: AchievementId): Promise<AchievementProgress> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return {
        achievementId,
        currentLevel: null,
        currentProgress: 0,
        nextLevel: null,
        isUnlocked: false,
      };
    }

    const user = await getCurrentUser();
    if (!user) {
      return {
        achievementId,
        currentLevel: null,
        currentProgress: 0,
        nextLevel: null,
        isUnlocked: false,
      };
    }

    const achievement = ACHIEVEMENTS[achievementId];
    if (!achievement) {
      return {
        achievementId,
        currentLevel: null,
        currentProgress: 0,
        nextLevel: null,
        isUnlocked: false,
      };
    }

    // Buscar achievement do usuário
    const { data: userAchievementsData, error } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', user.id)
      .eq('achievement_id', achievementId)
      .order('unlocked_at', { ascending: false })
      .limit(1);

    // Se houver erro e não for "nenhum resultado", logar
    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar achievement:', error);
    }

    const userAchievement = userAchievementsData && userAchievementsData.length > 0 ? userAchievementsData[0] : null;
    const currentLevel = userAchievement?.level as AchievementLevel | null;
    const currentProgress = userAchievement?.progress || 0;
    const isUnlocked = !!userAchievement;

    // Se for achievement único, já está completo
    if (achievement.isUnique) {
      return {
        achievementId,
        currentLevel: isUnlocked ? 'gold' : null,
        currentProgress: isUnlocked ? 1 : 0,
        nextLevel: null,
        isUnlocked,
      };
    }

    // Para achievements progressivos, calcular próximo nível
    if (!achievement.levels || achievement.levels.length === 0) {
      return {
        achievementId,
        currentLevel,
        currentProgress,
        nextLevel: null,
        isUnlocked,
      };
    }

    // Encontrar próximo nível não alcançado
    const levelOrder: AchievementLevel[] = ['bronze', 'silver', 'gold'];
    let nextLevelIndex = 0;

    if (currentLevel) {
      const currentIndex = levelOrder.indexOf(currentLevel);
      if (currentIndex < levelOrder.length - 1) {
        nextLevelIndex = currentIndex + 1;
      } else {
        // Já está no nível máximo
        return {
          achievementId,
          currentLevel,
          currentProgress,
          nextLevel: null,
          isUnlocked,
        };
      }
    }

    const nextLevel = achievement.levels[nextLevelIndex];

    return {
      achievementId,
      currentLevel,
      currentProgress,
      nextLevel: nextLevel || null,
      isUnlocked,
    };
  } catch (error) {
    console.error('Erro ao obter progresso do achievement:', error);
    return {
      achievementId,
      currentLevel: null,
      currentProgress: 0,
      nextLevel: null,
      isUnlocked: false,
    };
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

  // A Faísca Inicial - Primeira imagem gerada (único, sempre ouro)
  if (isFirstImage) {
    const hasFirstSpark = await hasAchievement('first_spark');
    if (!hasFirstSpark) {
      const result = await unlockAchievement('first_spark', 'gold', 1);
      if (result.success) {
        unlocked.push('first_spark');
      }
    }
  }

  // Maratona Criativa - Progressivo (bronze: 10, prata: 50, ouro: 200)
  if (imagesGeneratedIn24h >= 10) {
    let targetLevel: AchievementLevel = 'bronze';
    if (imagesGeneratedIn24h >= 200) {
      targetLevel = 'gold';
    } else if (imagesGeneratedIn24h >= 50) {
      targetLevel = 'silver';
    }

    const currentLevel = await getUserAchievementLevel('creative_marathon');
    const levelOrder: AchievementLevel[] = ['bronze', 'silver', 'gold'];
    const currentIndex = currentLevel ? levelOrder.indexOf(currentLevel) : -1;
    const targetIndex = levelOrder.indexOf(targetLevel);

    if (targetIndex > currentIndex) {
      const result = await unlockAchievement('creative_marathon', targetLevel, imagesGeneratedIn24h);
      if (result.success) {
        unlocked.push('creative_marathon');
      }
    }
  }

  return unlocked;
}

/**
 * Verifica conquista de Alquimista Visual (Modo Studio com 5 imagens) - Único, sempre ouro
 */
export async function checkVisualAlchemistAchievement(): Promise<AchievementId | null> {
  const hasAlchemist = await hasAchievement('visual_alchemist');
  if (!hasAlchemist) {
    const result = await unlockAchievement('visual_alchemist', 'gold', 1);
    if (result.success) {
      return 'visual_alchemist';
    }
  }
  return null;
}

/**
 * Verifica conquista de Diretor de Arte (progressivo: bronze: 5, prata: 20, ouro: 50)
 */
export async function checkArtDirectorAchievement(editedPromptsCount: number): Promise<AchievementId | null> {
  if (editedPromptsCount >= 5) {
    let targetLevel: AchievementLevel = 'bronze';
    if (editedPromptsCount >= 50) {
      targetLevel = 'gold';
    } else if (editedPromptsCount >= 20) {
      targetLevel = 'silver';
    }

    const currentLevel = await getUserAchievementLevel('art_director');
    const levelOrder: AchievementLevel[] = ['bronze', 'silver', 'gold'];
    const currentIndex = currentLevel ? levelOrder.indexOf(currentLevel) : -1;
    const targetIndex = levelOrder.indexOf(targetLevel);

    if (targetIndex > currentIndex) {
      const result = await unlockAchievement('art_director', targetLevel, editedPromptsCount);
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

  // Mecenas das Artes - Primeira compra (único, sempre ouro)
  if (isFirstPurchase) {
    const hasPatron = await hasAchievement('art_patron');
    if (!hasPatron) {
      const result = await unlockAchievement('art_patron', 'gold', 1);
      if (result.success) {
        unlocked.push('art_patron');
      }
    }
  }

  // Poder Ilimitado - Pacote Master (único, sempre ouro)
  if (planId === 'master') {
    const hasUnlimited = await hasAchievement('unlimited_power');
    if (!hasUnlimited) {
      const result = await unlockAchievement('unlimited_power', 'gold', 1);
      if (result.success) {
        unlocked.push('unlimited_power');
      }
    }
  }

  return unlocked;
}

