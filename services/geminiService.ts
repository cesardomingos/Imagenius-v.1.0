
import { ImageData, TemplateId } from "../types";
import { getCurrentUser } from "./supabaseService";
import { createClient } from "@supabase/supabase-js";

/**
 * Obtém o cliente Supabase para fazer requisições autenticadas
 */
function getSupabaseClient() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase não configurado');
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  });
}

/**
 * Retry logic com exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Não retry em erros 4xx (client errors)
      if (error.status >= 400 && error.status < 500 && error.status !== 429) {
        throw error;
      }
      
      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Erro desconhecido após retries');
}

/**
 * Sugere prompts baseados em uma ou mais imagens de referência usando Edge Function.
 */
export async function suggestPrompts(
  images: ImageData[], 
  themes: string[], 
  templateId?: TemplateId
): Promise<string[]> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const edgeFunctionUrl = supabaseUrl 
    ? `${supabaseUrl}/functions/v1/suggest-prompts`
    : null;

  if (!edgeFunctionUrl) {
    throw new Error('Supabase não configurado. Edge Function não disponível.');
  }

  const supabase = getSupabaseClient();
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    throw new Error('Usuário não autenticado. Faça login para continuar.');
  }

  return retryWithBackoff(async () => {
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Token JWT do usuário autenticado - usado para autenticação real
        'Authorization': `Bearer ${session.access_token}`,
        // Chave anon do Supabase - pública por design, usada apenas para identificar requisições válidas
        // A segurança real vem do RLS (Row Level Security) e do token de autorização acima
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      },
      body: JSON.stringify({
        images: images.map(img => ({
          data: img.data,
          mimeType: img.mimeType
        })),
        themes,
        ...(templateId && { templateId })
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      
      if (response.status === 429) {
        throw new Error('Limite de requisições excedido. Aguarde um momento antes de tentar novamente.');
      }
      
      throw new Error(errorData.error || errorData.message || `Erro ao sugerir prompts: ${response.statusText}`);
    }

    const data = await response.json();
    return data.prompts || [];
  });
}

/**
 * Gera a imagem final com coerência multi-referencial usando Edge Function.
 */
export async function generateCoherentImage(
  images: ImageData[], 
  prompt: string,
  mode: 'single' | 'studio' = 'single'
): Promise<string | null> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const edgeFunctionUrl = supabaseUrl 
    ? `${supabaseUrl}/functions/v1/generate-image`
    : null;

  if (!edgeFunctionUrl) {
    throw new Error('Supabase não configurado. Edge Function não disponível.');
  }

  const supabase = getSupabaseClient();
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    throw new Error('Usuário não autenticado. Faça login para continuar.');
  }

  return retryWithBackoff(async () => {
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Token JWT do usuário autenticado - usado para autenticação real
        'Authorization': `Bearer ${session.access_token}`,
        // Chave anon do Supabase - pública por design, usada apenas para identificar requisições válidas
        // A segurança real vem do RLS (Row Level Security) e do token de autorização acima
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      },
      body: JSON.stringify({
        images: images.map(img => ({
          data: img.data,
          mimeType: img.mimeType
        })),
        prompt,
        mode
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      
      if (response.status === 429) {
        throw new Error('Limite de requisições excedido. Aguarde um momento antes de tentar novamente.');
      }
      
      throw new Error(errorData.error || errorData.message || `Erro ao gerar imagem: ${response.statusText}`);
    }

    const data = await response.json();
    return data.imageUrl || null;
  });
}
