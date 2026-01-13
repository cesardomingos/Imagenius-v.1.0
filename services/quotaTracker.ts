/**
 * Serviço para rastrear o uso de quota da API do Gemini
 * Como a API não fornece endpoint para verificar quota, rastreamos localmente
 */

interface QuotaUsage {
  date: string; // YYYY-MM-DD
  requests: number;
  lastRequestTime: number; // timestamp
}

interface QuotaLimits {
  requestsPerDay: number;
  requestsPerMinute: number;
}

// Limites do Free Tier do Gemini (ajustáveis)
const DEFAULT_LIMITS: QuotaLimits = {
  requestsPerDay: 5, // Gemini 2.5 Flash Image free tier é muito restritivo
  requestsPerMinute: 2
};

const STORAGE_KEY = 'gemini_quota_usage';
const DATE_KEY = 'gemini_quota_date';

/**
 * Obtém ou cria o registro de uso de quota
 */
function getQuotaUsage(): QuotaUsage {
  const today = new Date().toISOString().split('T')[0];
  const stored = localStorage.getItem(STORAGE_KEY);
  const storedDate = localStorage.getItem(DATE_KEY);
  
  // Se mudou o dia, reseta o contador
  if (storedDate !== today) {
    const newUsage: QuotaUsage = {
      date: today,
      requests: 0,
      lastRequestTime: 0
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUsage));
    localStorage.setItem(DATE_KEY, today);
    return newUsage;
  }
  
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Se houver erro ao parsear, cria novo
    }
  }
  
  const newUsage: QuotaUsage = {
    date: today,
    requests: 0,
    lastRequestTime: 0
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newUsage));
  localStorage.setItem(DATE_KEY, today);
  return newUsage;
}

/**
 * Salva o uso de quota
 */
function saveQuotaUsage(usage: QuotaUsage): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
  localStorage.setItem(DATE_KEY, usage.date);
}

/**
 * Registra uma requisição
 */
export function recordRequest(): void {
  const usage = getQuotaUsage();
  const now = Date.now();
  
  usage.requests += 1;
  usage.lastRequestTime = now;
  
  saveQuotaUsage(usage);
}

/**
 * Obtém informações sobre a quota restante
 */
export function getQuotaInfo(limits: QuotaLimits = DEFAULT_LIMITS): {
  remainingDaily: number;
  remainingPerMinute: number;
  usedToday: number;
  canMakeRequest: boolean;
  nextAvailableTime: number | null; // timestamp quando pode fazer próxima requisição
} {
  const usage = getQuotaUsage();
  const now = Date.now();
  
  // Verifica limite diário
  const remainingDaily = Math.max(0, limits.requestsPerDay - usage.requests);
  
  // Verifica limite por minuto
  const oneMinuteAgo = now - (60 * 1000);
  const requestsInLastMinute = usage.lastRequestTime > oneMinuteAgo ? 1 : 0;
  const remainingPerMinute = Math.max(0, limits.requestsPerMinute - requestsInLastMinute);
  
  // Calcula quando pode fazer próxima requisição (se excedeu limite por minuto)
  let nextAvailableTime: number | null = null;
  if (usage.lastRequestTime > oneMinuteAgo && requestsInLastMinute >= limits.requestsPerMinute) {
    nextAvailableTime = usage.lastRequestTime + (60 * 1000);
  }
  
  const canMakeRequest = remainingDaily > 0 && remainingPerMinute > 0;
  
  return {
    remainingDaily,
    remainingPerMinute,
    usedToday: usage.requests,
    canMakeRequest,
    nextAvailableTime
  };
}

/**
 * Reseta o contador de quota (útil para testes ou mudança de plano)
 */
export function resetQuota(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(DATE_KEY);
}

/**
 * Atualiza os limites de quota (se mudar de plano)
 */
export function updateLimits(limits: Partial<QuotaLimits>): void {
  // Por enquanto, os limites são hardcoded, mas podemos expandir isso
  // para salvar no localStorage se necessário
  console.log('Limits updated:', limits);
}

