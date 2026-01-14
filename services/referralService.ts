import { createClient, SupabaseClient } from '@supabase/supabase-js';
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
 * Obtém estatísticas de referência do usuário
 */
export async function getReferralStats(): Promise<{
  totalReferrals: number;
  totalCreditsEarned: number;
} | null> {
  try {
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

    // Calcular créditos ganhos (5 créditos por referência)
    const totalReferrals = count || 0;
    const totalCreditsEarned = totalReferrals * 5;

    return {
      totalReferrals,
      totalCreditsEarned,
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

