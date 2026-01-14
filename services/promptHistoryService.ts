
import { getSupabaseClient } from './supabaseService';

export interface PromptHistoryItem {
  id: string;
  prompt: string;
  templateId?: string;
  createdAt: string;
}

/**
 * Salva um prompt no histórico do usuário
 */
export async function savePromptToHistory(
  prompt: string,
  templateId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { success: false, error: 'Supabase não configurado' };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    // Verificar se o prompt já existe recentemente (últimas 24h) para evitar duplicatas
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const { data: existing } = await supabase
      .from('prompt_history')
      .select('id')
      .eq('user_id', user.id)
      .eq('prompt', prompt)
      .gte('created_at', oneDayAgo.toISOString())
      .limit(1)
      .single();

    // Se já existe, não salvar duplicado
    if (existing) {
      return { success: true };
    }

    // Inserir novo prompt
    const { error } = await supabase
      .from('prompt_history')
      .insert({
        user_id: user.id,
        prompt,
        template_id: templateId || null,
      });

    if (error) {
      console.error('Erro ao salvar prompt no histórico:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Erro ao salvar prompt no histórico:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Busca histórico de prompts do usuário (últimos 50)
 */
export async function getPromptHistory(
  limit: number = 50,
  templateId?: string
): Promise<{ success: boolean; prompts?: PromptHistoryItem[]; error?: string }> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { success: false, error: 'Supabase não configurado' };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    let query = supabase
      .from('prompt_history')
      .select('id, prompt, template_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (templateId) {
      query = query.eq('template_id', templateId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar histórico de prompts:', error);
      return { success: false, error: error.message };
    }

    const prompts: PromptHistoryItem[] = (data || []).map(item => ({
      id: item.id,
      prompt: item.prompt,
      templateId: item.template_id || undefined,
      createdAt: item.created_at,
    }));

    return { success: true, prompts };
  } catch (error: any) {
    console.error('Erro ao buscar histórico de prompts:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Remove um prompt do histórico
 */
export async function deletePromptFromHistory(
  promptId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { success: false, error: 'Supabase não configurado' };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    const { error } = await supabase
      .from('prompt_history')
      .delete()
      .eq('id', promptId)
      .eq('user_id', user.id); // Garantir que só deleta seus próprios prompts

    if (error) {
      console.error('Erro ao deletar prompt do histórico:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Erro ao deletar prompt do histórico:', error);
    return { success: false, error: error.message };
  }
}

