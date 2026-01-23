
import { ImageData, TemplateId } from "../types";
import { getCurrentUser, getSupabaseClient } from "./supabaseService";

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
      
      // Não retry em erros 4xx (client errors) - exceto 429 (rate limit)
      const status = error?.status || error?.statusCode;
      if (status && status >= 400 && status < 500 && status !== 429) {
        throw error;
      }
      
      // Não retry em erros de autenticação (401)
      if (status === 401) {
        throw error;
      }
      
      // Não retry em erros de validação (400)
      if (status === 400) {
        throw error;
      }
      
      // Se for a última tentativa, lançar o erro
      if (attempt >= maxRetries - 1) {
        throw error;
      }
      
      // Para erros 503 (modelo sobrecarregado) ou WORKER_LIMIT, usar delay maior
      const isOverloaded = status === 503 || error?.retryable === true || error?.code === 'WORKER_LIMIT';
      const isWorkerLimit = error?.code === 'WORKER_LIMIT' || error?.message?.includes('WORKER_LIMIT');
      
      // WORKER_LIMIT precisa de delay ainda maior (60 segundos)
      let baseDelay = initialDelay;
      if (isWorkerLimit) {
        baseDelay = 60000; // 60 segundos para WORKER_LIMIT
      } else if (isOverloaded) {
        baseDelay = 5000; // 5 segundos para sobrecarga geral
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      
      // Delay máximo: 120 segundos para WORKER_LIMIT, 30 segundos para outros
      const maxDelay = isWorkerLimit ? 120000 : 30000;
      const finalDelay = Math.min(delay, maxDelay);
      
      await new Promise(resolve => setTimeout(resolve, finalDelay));
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
      let errorData: any;
      try {
        const responseText = await response.text();
        // Tentar parsear como JSON
        errorData = JSON.parse(responseText);
        // Se o erro estiver aninhado em uma string JSON, tentar parsear novamente
        if (typeof errorData.error === 'string') {
          try {
            errorData = { ...errorData, ...JSON.parse(errorData.error) };
          } catch {
            // Ignorar se não conseguir parsear
          }
        }
      } catch {
        errorData = { message: response.statusText };
      }
      
      if (response.status === 429) {
        throw new Error('Limite de requisições excedido. Aguarde um momento antes de tentar novamente.');
      }
      
      // Tratar erro WORKER_LIMIT (recursos insuficientes do Supabase)
      const errorMessage = errorData.error?.message || errorData.message || errorData.error || response.statusText;
      if (errorData.code === 'WORKER_LIMIT' || 
          errorMessage.includes('WORKER_LIMIT') || 
          errorMessage.includes('not having enough compute resources')) {
        const error: any = new Error(errorData.error || 'Servidor temporariamente sobrecarregado. Por favor, tente novamente em alguns instantes.');
        error.status = 503;
        error.code = 'WORKER_LIMIT';
        error.retryable = true;
        error.retryAfter = errorData.retryAfter || 60;
        throw error;
      }
      
      // Tratar erro 503 - Modelo sobrecarregado
      if (response.status === 503 || errorData.code === 503 || errorData.code === 'MODEL_OVERLOADED' || errorData.status === 'UNAVAILABLE') {
        const error: any = new Error(errorData.error || 'O modelo de IA está temporariamente sobrecarregado. Por favor, tente novamente em alguns instantes.');
        error.status = 503;
        error.code = errorData.code || 'MODEL_OVERLOADED';
        error.retryable = true;
        error.retryAfter = errorData.retryAfter || 30;
        throw error;
      }
      
      // Tratar erro de recursos insuficientes (fallback)
      if (errorMessage.includes('compute resources') || errorMessage.includes('not having enough') || errorMessage.includes('overloaded')) {
        const error: any = new Error('Servidor temporariamente sobrecarregado. Por favor, tente novamente em alguns instantes.');
        error.status = 503;
        error.retryable = true;
        throw error;
      }
      
      // Tratar erro 500 (erro interno do servidor)
      if (response.status === 500) {
        throw new Error('Erro interno do servidor. Por favor, tente novamente em alguns instantes.');
      }
      
      throw new Error(errorMessage || `Erro ao sugerir prompts: ${response.statusText}`);
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
      let errorData: any;
      try {
        const responseText = await response.text();
        // Tentar parsear como JSON
        errorData = JSON.parse(responseText);
        // Se o erro estiver aninhado em uma string JSON, tentar parsear novamente
        if (typeof errorData.error === 'string') {
          try {
            errorData = { ...errorData, ...JSON.parse(errorData.error) };
          } catch {
            // Ignorar se não conseguir parsear
          }
        }
      } catch {
        errorData = { message: response.statusText };
      }
      
      // Criar erro com status para que retryWithBackoff possa tratá-lo corretamente
      const errorMessage = errorData.error?.message || errorData.message || errorData.error || `Erro ao gerar imagem: ${response.statusText}`;
      const error: any = new Error(errorMessage);
      error.status = response.status;
      
      if (response.status === 429) {
        error.message = 'Limite de requisições excedido. Aguarde um momento antes de tentar novamente.';
        throw error;
      }
      
      // Tratar erro WORKER_LIMIT (recursos insuficientes do Supabase)
      if (errorData.code === 'WORKER_LIMIT' || 
          errorMessage.includes('WORKER_LIMIT') || 
          errorMessage.includes('not having enough compute resources')) {
        error.message = errorData.error || 'Servidor temporariamente sobrecarregado. Por favor, tente novamente em alguns instantes.';
        error.status = 503;
        error.code = 'WORKER_LIMIT';
        error.retryable = true;
        error.retryAfter = errorData.retryAfter || 60;
        throw error;
      }
      
      // Tratar erro 503 - Modelo sobrecarregado
      if (response.status === 503 || errorData.code === 503 || errorData.code === 'MODEL_OVERLOADED' || errorData.status === 'UNAVAILABLE') {
        error.message = errorData.error || 'O modelo de IA está temporariamente sobrecarregado. Por favor, tente novamente em alguns instantes.';
        error.status = 503;
        error.code = errorData.code || 'MODEL_OVERLOADED';
        error.retryable = true;
        error.retryAfter = errorData.retryAfter || 30;
        throw error;
      }
      
      // Tratar erro de modelo sobrecarregado na mensagem (fallback)
      if (errorMessage.includes('overloaded') || errorMessage.includes('UNAVAILABLE') || errorMessage.includes('compute resources')) {
        error.message = 'Servidor temporariamente sobrecarregado. Por favor, tente novamente em alguns instantes.';
        error.status = 503;
        error.retryable = true;
        throw error;
      }
      
      throw error;
    }

    const data = await response.json();
    return data.imageUrl || null;
  });
}
