
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

export interface LeaderboardEntry {
  userId: string;
  email: string;
  totalImages: number;
  totalLikes: number;
  rank: number;
  avatarUrl?: string;
  fullName?: string;
}

export type LeaderboardType = 'images' | 'likes' | 'recent';

/**
 * Busca o leaderboard de usuários mais ativos
 * @param type - Tipo de ranking: 'images' (mais imagens), 'likes' (mais curtidas), 'recent' (mais recentes)
 * @param limit - Número máximo de entradas (padrão: 10)
 */
export async function getLeaderboard(
  type: LeaderboardType = 'images',
  limit: number = 10
): Promise<LeaderboardEntry[]> {
  try {
    if (!supabase) {
      return [];
    }

    let query;

    switch (type) {
      case 'images':
        // Ranking por número de imagens geradas
        query = supabase
          .from('community_arts')
          .select('user_id, profiles!inner(email, full_name, avatar_url)')
          .select('*', { count: 'exact' })
          .group('user_id, profiles.email, profiles.full_name, profiles.avatar_url')
          .order('count', { ascending: false })
          .limit(limit);
        break;

      case 'likes':
        // Ranking por número total de likes recebidos
        query = supabase
          .rpc('get_user_likes_leaderboard', { limit_count: limit })
          .select('*');
        break;

      case 'recent':
        // Ranking por atividade recente (últimas 7 dias)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        query = supabase
          .from('community_arts')
          .select('user_id, profiles!inner(email, full_name, avatar_url)')
          .select('*', { count: 'exact' })
          .gte('created_at', sevenDaysAgo.toISOString())
          .group('user_id, profiles.email, profiles.full_name, profiles.avatar_url')
          .order('count', { ascending: false })
          .limit(limit);
        break;

      default:
        return [];
    }

    // Para 'images' e 'recent', precisamos fazer uma query diferente
    if (type === 'images' || type === 'recent') {
      const { data: artsData, error } = await supabase
        .from('community_arts')
        .select('user_id, profiles!inner(email, full_name, avatar_url)')
        .limit(1000); // Limitar para performance

      if (error) {
        console.error('Erro ao buscar leaderboard:', error);
        return [];
      }

      // Agrupar e contar
      const userStats = new Map<string, {
        userId: string;
        email: string;
        count: number;
        avatarUrl?: string;
        fullName?: string;
      }>();

      artsData?.forEach((art: any) => {
        const userId = art.user_id;
        const profile = art.profiles;
        
        if (!userStats.has(userId)) {
          userStats.set(userId, {
            userId,
            email: profile?.email || 'Usuário',
            count: 0,
            avatarUrl: profile?.avatar_url,
            fullName: profile?.full_name,
          });
        }
        
        const stats = userStats.get(userId)!;
        stats.count++;
      });

      // Converter para array e ordenar
      const entries = Array.from(userStats.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, limit)
        .map((entry, index) => ({
          userId: entry.userId,
          email: entry.email,
          totalImages: entry.count,
          totalLikes: 0, // Será calculado separadamente se necessário
          rank: index + 1,
          avatarUrl: entry.avatarUrl,
          fullName: entry.fullName,
        }));

      // Buscar likes totais para cada usuário
      const userIds = entries.map(e => e.userId);
      if (userIds.length > 0) {
        const { data: likesData } = await supabase
          .from('community_art_likes')
          .select('art_id, community_arts!inner(user_id)')
          .in('community_arts.user_id', userIds);

        const likesCount = new Map<string, number>();
        likesData?.forEach((like: any) => {
          const userId = like.community_arts?.user_id;
          if (userId) {
            likesCount.set(userId, (likesCount.get(userId) || 0) + 1);
          }
        });

        entries.forEach(entry => {
          entry.totalLikes = likesCount.get(entry.userId) || 0;
        });
      }

      return entries;
    }

    // Para 'likes', usar RPC function (se disponível) ou query manual
    const { data, error } = await supabase
      .from('community_art_likes')
      .select('art_id, community_arts!inner(user_id, profiles!inner(email, full_name, avatar_url))')
      .limit(1000);

    if (error) {
      console.error('Erro ao buscar leaderboard de likes:', error);
      return [];
    }

    // Agrupar likes por usuário
    const userLikes = new Map<string, {
      userId: string;
      email: string;
      count: number;
      avatarUrl?: string;
      fullName?: string;
    }>();

    data?.forEach((like: any) => {
      const art = like.community_arts;
      if (!art) return;
      
      const userId = art.user_id;
      const profile = art.profiles;
      
      if (!userLikes.has(userId)) {
        userLikes.set(userId, {
          userId,
          email: profile?.email || 'Usuário',
          count: 0,
          avatarUrl: profile?.avatar_url,
          fullName: profile?.full_name,
        });
      }
      
      const stats = userLikes.get(userId)!;
      stats.count++;
    });

    const entries = Array.from(userLikes.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map((entry, index) => ({
        userId: entry.userId,
        email: entry.email,
        totalImages: 0,
        totalLikes: entry.count,
        rank: index + 1,
        avatarUrl: entry.avatarUrl,
        fullName: entry.fullName,
      }));

    return entries;
  } catch (error) {
    console.error('Erro ao buscar leaderboard:', error);
    return [];
  }
}

/**
 * Busca a posição do usuário atual no leaderboard
 */
export async function getUserRank(
  type: LeaderboardType = 'images'
): Promise<number | null> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return null;

    const leaderboard = await getLeaderboard(type, 100);
    const userIndex = leaderboard.findIndex(entry => entry.userId === currentUser.id);
    
    return userIndex >= 0 ? userIndex + 1 : null;
  } catch (error) {
    console.error('Erro ao buscar rank do usuário:', error);
    return null;
  }
}

