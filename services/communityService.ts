import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getCurrentUser } from './supabaseService';

// Interface para arte da comunidade
export interface CommunityArt {
  id: string;
  user_id: string;
  image_url: string;
  prompt: string;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
  author_email?: string;
  likes_count?: number;
  user_liked?: boolean;
}

// Criar cliente Supabase (reutiliza a mesma lógica do supabaseService)
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
 * Busca artes compartilhadas da comunidade
 * @param limit - Número máximo de artes a retornar (padrão: 20)
 * @param offset - Offset para paginação (padrão: 0)
 */
export async function fetchCommunityArts(
  limit: number = 20,
  offset: number = 0
): Promise<CommunityArt[]> {
  try {
    if (!supabase) {
      console.warn('Supabase não configurado. Retornando array vazio.');
      return [];
    }

    const currentUser = await getCurrentUser();

    // Buscar artes compartilhadas
    const { data, error } = await supabase
      .from('community_arts')
      .select(`
        id,
        user_id,
        image_url,
        prompt,
        is_shared,
        created_at,
        updated_at
      `)
      .eq('is_shared', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Erro ao buscar artes da comunidade:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Buscar contagem de likes e verificar likes do usuário atual
    const artIds = data.map(art => art.id);
    
    // Buscar todos os likes de uma vez
    const { data: likesData } = await supabase
      .from('community_art_likes')
      .select('art_id, user_id')
      .in('art_id', artIds);

    // Buscar emails dos autores
    const userIds = [...new Set(data.map(art => art.user_id))];
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, email')
      .in('id', userIds);

    const emailMap = new Map<string, string>();
    profilesData?.forEach(profile => {
      emailMap.set(profile.id, profile.email);
    });

    // Contar likes por arte
    const likesCountMap = new Map<string, number>();
    const userLikesSet = new Set<string>();

    likesData?.forEach(like => {
      const count = likesCountMap.get(like.art_id) || 0;
      likesCountMap.set(like.art_id, count + 1);
      
      if (currentUser && like.user_id === currentUser.id) {
        userLikesSet.add(like.art_id);
      }
    });

    // Mapear dados para o formato esperado
    const artsWithLikes: CommunityArt[] = data.map((art: any) => {
      const authorEmail = emailMap.get(art.user_id) || null;

      return {
        id: art.id,
        user_id: art.user_id,
        image_url: art.image_url,
        prompt: art.prompt,
        is_shared: art.is_shared,
        created_at: art.created_at,
        updated_at: art.updated_at,
        author_email: authorEmail,
        likes_count: likesCountMap.get(art.id) || 0,
        user_liked: userLikesSet.has(art.id)
      };
    });

    return artsWithLikes;
  } catch (error) {
    console.error('Erro ao buscar artes da comunidade:', error);
    return [];
  }
}

/**
 * Toggle de like em uma arte (adiciona ou remove like)
 * @param artId - ID da arte
 * @returns Objeto com sucesso e novo número de likes
 */
export async function toggleLike(
  artId: string
): Promise<{ success: boolean; likesCount: number; error?: string }> {
  try {
    if (!supabase) {
      return { success: false, likesCount: 0, error: 'Supabase não configurado' };
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, likesCount: 0, error: 'Usuário não autenticado' };
    }

    // Verificar se já deu like
    const { data: existingLike, error: checkError } = await supabase
      .from('community_art_likes')
      .select('id')
      .eq('art_id', artId)
      .eq('user_id', currentUser.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = no rows found (é esperado se não houver like)
      console.error('Erro ao verificar like:', checkError);
    }

    if (existingLike) {
      // Remover like
      const { error: deleteError } = await supabase
        .from('community_art_likes')
        .delete()
        .eq('art_id', artId)
        .eq('user_id', currentUser.id);

      if (deleteError) {
        console.error('Erro ao remover like:', deleteError);
        return { success: false, likesCount: 0, error: deleteError.message };
      }
    } else {
      // Adicionar like
      const { error: insertError } = await supabase
        .from('community_art_likes')
        .insert({
          art_id: artId,
          user_id: currentUser.id
        });

      if (insertError) {
        console.error('Erro ao adicionar like:', insertError);
        return { success: false, likesCount: 0, error: insertError.message };
      }
    }

    // Buscar novo número de likes
    const { count, error: countError } = await supabase
      .from('community_art_likes')
      .select('*', { count: 'exact', head: true })
      .eq('art_id', artId);

    if (countError) {
      console.error('Erro ao contar likes:', countError);
      return { success: true, likesCount: 0 };
    }

    return { 
      success: true, 
      likesCount: count || 0,
      error: undefined
    };
  } catch (error: any) {
    console.error('Erro ao fazer toggle de like:', error);
    return { success: false, likesCount: 0, error: error.message };
  }
}

/**
 * Verifica se uma arte já está compartilhada na comunidade
 * @param imageUrl - URL da imagem
 * @returns Objeto com sucesso, se está compartilhada e ID da arte (se existir)
 */
export async function checkIfArtIsShared(
  imageUrl: string
): Promise<{ success: boolean; isShared: boolean; artId?: string; error?: string }> {
  try {
    if (!supabase) {
      return { success: false, isShared: false, error: 'Supabase não configurado' };
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, isShared: false, error: 'Usuário não autenticado' };
    }

    const { data, error } = await supabase
      .from('community_arts')
      .select('id, is_shared')
      .eq('user_id', currentUser.id)
      .eq('image_url', imageUrl)
      .maybeSingle();

    if (error) {
      console.error('Erro ao verificar se arte está compartilhada:', error);
      return { success: false, isShared: false, error: error.message };
    }

    if (!data) {
      return { success: true, isShared: false };
    }

    return { success: true, isShared: data.is_shared, artId: data.id };
  } catch (error: any) {
    console.error('Erro ao verificar se arte está compartilhada:', error);
    return { success: false, isShared: false, error: error.message };
  }
}

/**
 * Compartilhar uma arte na galeria comunitária
 * @param imageUrl - URL da imagem
 * @param prompt - Prompt usado para gerar
 * @returns Objeto com sucesso e ID da arte criada
 */
export async function shareArt(
  imageUrl: string,
  prompt: string
): Promise<{ success: boolean; artId?: string; error?: string }> {
  try {
    if (!supabase) {
      return { success: false, error: 'Supabase não configurado' };
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    // Verificar se a arte já existe
    const checkResult = await checkIfArtIsShared(imageUrl);
    
    if (checkResult.success && checkResult.artId) {
      // Se já existe, apenas atualizar is_shared para true
      const { error: updateError } = await supabase
        .from('community_arts')
        .update({ is_shared: true })
        .eq('id', checkResult.artId)
        .eq('user_id', currentUser.id);

      if (updateError) {
        console.error('Erro ao atualizar compartilhamento:', updateError);
        return { success: false, error: updateError.message };
      }

      return { success: true, artId: checkResult.artId };
    }

    // Se não existe, criar nova entrada
    const { data, error } = await supabase
      .from('community_arts')
      .insert({
        user_id: currentUser.id,
        image_url: imageUrl,
        prompt: prompt,
        is_shared: true
      })
      .select('id')
      .single();

    if (error) {
      console.error('Erro ao compartilhar arte:', error);
      return { success: false, error: error.message };
    }

    return { success: true, artId: data.id };
  } catch (error: any) {
    console.error('Erro ao compartilhar arte:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Remover compartilhamento de uma arte (marcar is_shared como false)
 * @param artId - ID da arte
 */
export async function unshareArt(
  artId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!supabase) {
      return { success: false, error: 'Supabase não configurado' };
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    const { error } = await supabase
      .from('community_arts')
      .update({ is_shared: false })
      .eq('id', artId)
      .eq('user_id', currentUser.id);

    if (error) {
      console.error('Erro ao remover compartilhamento:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Erro ao remover compartilhamento:', error);
    return { success: false, error: error.message };
  }
}

