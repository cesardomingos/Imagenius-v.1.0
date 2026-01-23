import { getCurrentUser, getSupabaseClient } from './supabaseService';

/**
 * Obtém o código de referência do usuário atual
 */
export async function getUserReferralCode(): Promise<string | null> {
  try {
    const user = await getCurrentUser();
    if (!user || !user.referral_code) {
      return null;
    }
    return user.referral_code;
  } catch (error) {
    console.error('Erro ao obter código de referência:', error);
    return null;
  }
}

/**
 * Gera o link de referência completo
 */
export async function getReferralLink(): Promise<string | null> {
  const code = await getUserReferralCode();
  if (!code) {
    return null;
  }
  
  const baseUrl = window.location.origin;
  return `${baseUrl}?ref=${code}`;
}

/**
 * Obtém o código de referência da URL atual (query parameter)
 */
export function getReferralCodeFromUrl(): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('ref');
}

/**
 * Obtém estatísticas de referência do usuário com informações de progresso
 */
export async function getReferralStats(): Promise<{
  totalReferrals: number;
  totalCreditsEarned: number;
  currentLevel: 'bronze' | 'silver' | 'gold' | null;
  nextLevel: 'silver' | 'gold' | null;
  progressToNextLevel: number;
  nextLevelThreshold: number;
  milestones: Array<{ threshold: number; reached: boolean; reward: number }>;
} | null> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    const user = await getCurrentUser();
    if (!user) return null;

    // Contar quantos usuários foram referenciados por este usuário
    const { count, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('referred_by', user.id);

    if (countError) {
      console.error('Erro ao contar referências:', countError);
      return null;
    }

    const totalReferrals = count || 0;
    const totalCreditsEarned = totalReferrals * 5;

    // Definir milestones e níveis
    const milestones = [
      { threshold: 1, reached: totalReferrals >= 1, reward: 5 },
      { threshold: 5, reached: totalReferrals >= 5, reward: 5 }, // Bônus extra no milestone 5
      { threshold: 10, reached: totalReferrals >= 10, reward: 10 }, // Bônus extra no milestone 10
      { threshold: 20, reached: totalReferrals >= 20, reward: 15 }, // Bônus extra no milestone 20
      { threshold: 50, reached: totalReferrals >= 50, reward: 25 }, // Bônus extra no milestone 50
      { threshold: 100, reached: totalReferrals >= 100, reward: 50 }, // Bônus extra no milestone 100
    ];

    // Determinar nível atual e próximo
    let currentLevel: 'bronze' | 'silver' | 'gold' | null = null;
    let nextLevel: 'silver' | 'gold' | null = null;
    let nextLevelThreshold = 5;
    let progressToNextLevel = 0;

    if (totalReferrals >= 20) {
      currentLevel = 'gold';
      nextLevel = null;
      progressToNextLevel = 100;
    } else if (totalReferrals >= 5) {
      currentLevel = 'silver';
      nextLevel = 'gold';
      nextLevelThreshold = 20;
      progressToNextLevel = Math.min(100, (totalReferrals / 20) * 100);
    } else if (totalReferrals >= 1) {
      currentLevel = 'bronze';
      nextLevel = 'silver';
      nextLevelThreshold = 5;
      progressToNextLevel = Math.min(100, (totalReferrals / 5) * 100);
    } else {
      nextLevel = 'bronze';
      nextLevelThreshold = 1;
      progressToNextLevel = 0;
    }

    return {
      totalReferrals,
      totalCreditsEarned,
      currentLevel,
      nextLevel,
      progressToNextLevel,
      nextLevelThreshold,
      milestones,
    };
  } catch (error) {
    console.error('Erro ao obter estatísticas de referência:', error);
    return null;
  }
}

/**
 * Copia o link de referência para a área de transferência
 */
export async function copyReferralLink(): Promise<boolean> {
  try {
    const link = await getReferralLink();
    if (!link) {
      return false;
    }

    await navigator.clipboard.writeText(link);
    return true;
  } catch (error) {
    console.error('Erro ao copiar link:', error);
    return false;
  }
}

