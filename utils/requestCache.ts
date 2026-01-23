
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
const MAX_STORAGE_SIZE = 4 * 1024 * 1024; // 4MB (deixar margem de segurança)
const MAX_ITEM_SIZE = 500 * 1024; // 500KB por item máximo

/**
 * Gera uma chave de cache baseada no tipo e parâmetros
 */
function generateCacheKey(type: string, params?: Record<string, any>): string {
  const paramsStr = params ? JSON.stringify(params) : '';
  return `${CACHE_PREFIX}${type}_${paramsStr}`;
}

/**
 * Calcula o tamanho aproximado de uma string em bytes
 */
function getStringSize(str: string): number {
  return new Blob([str]).size;
}

/**
 * Calcula o tamanho total usado no storage
 */
function getStorageSize(storage: Storage): number {
  let total = 0;
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key) {
      const value = storage.getItem(key) || '';
      total += getStringSize(key) + getStringSize(value);
    }
  }
  return total;
}

/**
 * Limpa entradas antigas do cache para liberar espaço
 * Remove as entradas mais antigas primeiro
 */
function clearOldCacheEntries(storage: Storage, targetSize: number = MAX_STORAGE_SIZE * 0.5): void {
  try {
    const entries: Array<{ key: string; timestamp: number; size: number }> = [];
    
    // Coletar todas as entradas de cache
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        const value = storage.getItem(key);
        if (value) {
          try {
            const entry: CacheEntry<any> = JSON.parse(value);
            const size = getStringSize(key) + getStringSize(value);
            entries.push({ key, timestamp: entry.timestamp, size });
          } catch {
            // Se não conseguir parsear, remover
            storage.removeItem(key);
          }
        }
      }
    }
    
    // Ordenar por timestamp (mais antigas primeiro)
    entries.sort((a, b) => a.timestamp - b.timestamp);
    
    // Remover entradas antigas até atingir o tamanho alvo
    let currentSize = getStorageSize(storage);
    for (const entry of entries) {
      if (currentSize <= targetSize) break;
      storage.removeItem(entry.key);
      currentSize -= entry.size;
    }
  } catch (error) {
    console.error('Erro ao limpar entradas antigas do cache:', error);
  }
}

/**
 * Verifica se uma entrada de cache ainda é válida
 */
function isCacheValid(entry: CacheEntry<any>): boolean {
  return Date.now() < entry.expiresAt;
}

/**
 * Verifica se os dados são muito grandes para cache
 * Retorna true se os dados devem ser rejeitados
 */
function isDataTooLarge<T>(data: T): boolean {
  try {
    const dataString = JSON.stringify(data);
    return getStringSize(dataString) > MAX_ITEM_SIZE;
  } catch {
    return true; // Se não conseguir serializar, considerar muito grande
  }
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
  // Verificar se os dados são muito grandes antes de tentar salvar
  if (isDataTooLarge(data)) {
    console.warn(`Dados muito grandes para cache, não serão salvos:`, key);
    return;
  }
  
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
    expiresAt: Date.now() + ttl
  };

  const entryString = JSON.stringify(entry);
  const entrySize = getStringSize(entryString);
  
  // Verificar novamente o tamanho após serialização
  if (entrySize > MAX_ITEM_SIZE) {
    console.warn(`Item de cache muito grande após serialização (${entrySize} bytes), não será salvo:`, key);
    return;
  }

  try {
    const storage = persistent ? localStorage : sessionStorage;
    
    // Verificar tamanho do storage antes de salvar
    const currentSize = getStorageSize(storage);
    if (currentSize + entrySize > MAX_STORAGE_SIZE) {
      console.warn('Storage próximo do limite, limpando cache antigo...');
      clearOldCacheEntries(storage, MAX_STORAGE_SIZE * 0.5);
    }
    
    storage.setItem(key, entryString);
  } catch (error: any) {
    // Se o storage estiver cheio, limpar cache antigo mais agressivamente
    console.warn('Erro ao salvar no cache, limpando cache antigo:', error);
    
    try {
      const storage = persistent ? localStorage : sessionStorage;
      
      // Limpar cache expirado primeiro
      clearExpiredCache();
      
      // Se ainda não conseguir, limpar entradas antigas
      clearOldCacheEntries(storage, MAX_STORAGE_SIZE * 0.3);
      
      // Tentar novamente
      storage.setItem(key, entryString);
    } catch (retryError: any) {
      // Se ainda falhar, tentar limpar todo o cache do tipo
      console.error('Erro ao salvar no cache após limpeza, limpando todo o cache:', retryError);
      try {
        const storage = persistent ? localStorage : sessionStorage;
        clearAllCache();
        // Tentar uma última vez
        storage.setItem(key, entryString);
      } catch (finalError) {
        console.error('Erro crítico ao salvar no cache:', finalError);
        // Não lançar erro - apenas logar e continuar sem cache
      }
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

