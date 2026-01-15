
/**
 * Sistema de cache para requisições de dados estáticos e dinâmicos
 * Usa localStorage para cache persistente e sessionStorage para cache temporário
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

const CACHE_PREFIX = 'img_cache_';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos por padrão

/**
 * Gera uma chave de cache baseada no tipo e parâmetros
 */
function generateCacheKey(type: string, params?: Record<string, any>): string {
  const paramsStr = params ? JSON.stringify(params) : '';
  return `${CACHE_PREFIX}${type}_${paramsStr}`;
}

/**
 * Verifica se uma entrada de cache ainda é válida
 */
function isCacheValid(entry: CacheEntry<any>): boolean {
  return Date.now() < entry.expiresAt;
}

/**
 * Armazena dados no cache
 * @param key - Chave do cache
 * @param data - Dados a serem armazenados
 * @param ttl - Tempo de vida em milissegundos (padrão: 5 minutos)
 * @param persistent - Se true, usa localStorage; se false, usa sessionStorage
 */
export function setCache<T>(
  key: string,
  data: T,
  ttl: number = DEFAULT_TTL,
  persistent: boolean = true
): void {
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
    expiresAt: Date.now() + ttl
  };

  try {
    const storage = persistent ? localStorage : sessionStorage;
    storage.setItem(key, JSON.stringify(entry));
  } catch (error) {
    // Se o storage estiver cheio, limpar cache antigo
    console.warn('Erro ao salvar no cache, limpando cache antigo:', error);
    clearExpiredCache();
    try {
      const storage = persistent ? localStorage : sessionStorage;
      storage.setItem(key, JSON.stringify(entry));
    } catch (retryError) {
      console.error('Erro ao salvar no cache após limpeza:', retryError);
    }
  }
}

/**
 * Recupera dados do cache
 * @param key - Chave do cache
 * @param persistent - Se true, busca em localStorage; se false, busca em sessionStorage
 * @returns Dados armazenados ou null se não existir ou estiver expirado
 */
export function getCache<T>(
  key: string,
  persistent: boolean = true
): T | null {
  try {
    const storage = persistent ? localStorage : sessionStorage;
    const cached = storage.getItem(key);
    
    if (!cached) return null;

    const entry: CacheEntry<T> = JSON.parse(cached);
    
    if (!isCacheValid(entry)) {
      // Remover entrada expirada
      storage.removeItem(key);
      return null;
    }

    return entry.data;
  } catch (error) {
    console.error('Erro ao recuperar do cache:', error);
    return null;
  }
}

/**
 * Remove uma entrada específica do cache
 */
export function removeCache(key: string, persistent: boolean = true): void {
  try {
    const storage = persistent ? localStorage : sessionStorage;
    storage.removeItem(key);
  } catch (error) {
    console.error('Erro ao remover do cache:', error);
  }
}

/**
 * Limpa todas as entradas expiradas do cache
 */
export function clearExpiredCache(): void {
  try {
    // Limpar localStorage
    const localStorageKeys = Object.keys(localStorage);
    localStorageKeys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        const cached = localStorage.getItem(key);
        if (cached) {
          try {
            const entry: CacheEntry<any> = JSON.parse(cached);
            if (!isCacheValid(entry)) {
              localStorage.removeItem(key);
            }
          } catch {
            // Se não conseguir parsear, remover
            localStorage.removeItem(key);
          }
        }
      }
    });

    // Limpar sessionStorage
    const sessionStorageKeys = Object.keys(sessionStorage);
    sessionStorageKeys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        const cached = sessionStorage.getItem(key);
        if (cached) {
          try {
            const entry: CacheEntry<any> = JSON.parse(cached);
            if (!isCacheValid(entry)) {
              sessionStorage.removeItem(key);
            }
          } catch {
            // Se não conseguir parsear, remover
            sessionStorage.removeItem(key);
          }
        }
      }
    });
  } catch (error) {
    console.error('Erro ao limpar cache expirado:', error);
  }
}

/**
 * Limpa todo o cache (útil para logout ou reset)
 */
export function clearAllCache(): void {
  try {
    // Limpar localStorage
    const localStorageKeys = Object.keys(localStorage);
    localStorageKeys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });

    // Limpar sessionStorage
    const sessionStorageKeys = Object.keys(sessionStorage);
    sessionStorageKeys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        sessionStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Erro ao limpar todo o cache:', error);
  }
}

/**
 * Wrapper para funções assíncronas com cache automático
 * @param fn - Função assíncrona a ser executada
 * @param cacheKey - Chave do cache
 * @param ttl - Tempo de vida em milissegundos
 * @param persistent - Se true, usa localStorage; se false, usa sessionStorage
 * @param forceRefresh - Se true, ignora o cache e força uma nova requisição
 */
export async function cachedRequest<T>(
  fn: () => Promise<T>,
  cacheKey: string,
  ttl: number = DEFAULT_TTL,
  persistent: boolean = true,
  forceRefresh: boolean = false
): Promise<T> {
  // Se não for para forçar refresh, verificar cache primeiro
  if (!forceRefresh) {
    const cached = getCache<T>(cacheKey, persistent);
    if (cached !== null) {
      return cached;
    }
  }

  // Executar função e armazenar resultado
  try {
    const result = await fn();
    setCache(cacheKey, result, ttl, persistent);
    return result;
  } catch (error) {
    // Em caso de erro, tentar retornar cache mesmo que expirado
    const cached = getCache<T>(cacheKey, persistent);
    if (cached !== null) {
      console.warn('Erro na requisição, usando cache:', error);
      return cached;
    }
    throw error;
  }
}

/**
 * Helpers específicos para diferentes tipos de dados
 */
export const cacheHelpers = {
  /**
   * Cache para dados de comunidade (TTL: 2 minutos)
   */
  communityArts: (params: { limit: number; offset: number }) => {
    return generateCacheKey('community_arts', params);
  },

  /**
   * Cache para dados de usuário (TTL: 1 minuto, sessionStorage)
   */
  userArts: (params: { page: number; pageSize: number }) => {
    return generateCacheKey('user_arts', params);
  },

  /**
   * Cache para histórico de prompts (TTL: 1 minuto, sessionStorage)
   */
  promptHistory: (params: { limit: number; templateId?: string }) => {
    return generateCacheKey('prompt_history', params);
  },

  /**
   * Cache para estatísticas de social proof (TTL: 10 minutos)
   */
  socialProof: () => {
    return generateCacheKey('social_proof');
  },

  /**
   * Cache para achievements do usuário (TTL: 2 minutos, sessionStorage)
   */
  userAchievements: () => {
    return generateCacheKey('user_achievements');
  }
};

