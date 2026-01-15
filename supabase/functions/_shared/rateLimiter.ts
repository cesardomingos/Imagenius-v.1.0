import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuto em milissegundos
const MAX_REQUESTS_PER_MINUTE_GENERATE = 10;
const MAX_REQUESTS_PER_MINUTE_SUGGEST = 5;

/**
 * Verifica rate limit persistente usando a tabela rate_limits
 */
export async function checkRateLimitPersistent(
  supabase: SupabaseClient,
  userId: string,
  endpoint: string
): Promise<{ allowed: boolean; remaining: number }> {
  const maxRequests = endpoint === 'generate-image' 
    ? MAX_REQUESTS_PER_MINUTE_GENERATE 
    : MAX_REQUESTS_PER_MINUTE_SUGGEST;

  try {
    // Buscar registro existente
    const { data: existing, error: fetchError } = await supabase
      .from('rate_limits')
      .select('count, reset_at')
      .eq('user_id', userId)
      .eq('endpoint', endpoint)
      .single();

    const now = new Date();
    const resetAt = existing?.reset_at ? new Date(existing.reset_at) : null;

    // Se não existe registro ou expirou, criar/resetar
    if (!existing || !resetAt || now > resetAt) {
      const newResetAt = new Date(now.getTime() + RATE_LIMIT_WINDOW);
      
      const { error: upsertError } = await supabase
        .from('rate_limits')
        .upsert({
          user_id: userId,
          endpoint,
          count: 1,
          reset_at: newResetAt.toISOString(),
          updated_at: now.toISOString()
        }, {
          onConflict: 'user_id,endpoint'
        });

      if (upsertError) {
        console.error('Erro ao criar/atualizar rate limit:', upsertError);
        // Em caso de erro, permitir requisição (fail open)
        return { allowed: true, remaining: maxRequests - 1 };
      }

      return { allowed: true, remaining: maxRequests - 1 };
    }

    // Verificar se excedeu o limite
    if (existing.count >= maxRequests) {
      return { allowed: false, remaining: 0 };
    }

    // Incrementar contador
    const { error: updateError } = await supabase
      .from('rate_limits')
      .update({ 
        count: existing.count + 1,
        updated_at: now.toISOString()
      })
      .eq('user_id', userId)
      .eq('endpoint', endpoint);

    if (updateError) {
      console.error('Erro ao incrementar rate limit:', updateError);
      // Em caso de erro, permitir requisição (fail open)
      return { allowed: true, remaining: maxRequests - existing.count - 1 };
    }

    return { 
      allowed: true, 
      remaining: maxRequests - existing.count - 1 
    };
  } catch (error) {
    console.error('Erro inesperado em checkRateLimitPersistent:', error);
    // Fail open em caso de erro
    return { allowed: true, remaining: maxRequests - 1 };
  }
}

