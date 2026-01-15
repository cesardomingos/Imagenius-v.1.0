
export type ErrorCategory = 
  | 'network' 
  | 'validation' 
  | 'api' 
  | 'auth' 
  | 'rate_limit' 
  | 'payment'
  | 'storage'
  | 'permission'
  | 'timeout'
  | 'quota'
  | 'unknown';

export interface ErrorInfo {
  message: string;
  category: ErrorCategory;
  retryable: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Mapeia códigos de status HTTP para categorias de erro
 */
function getCategoryFromStatus(status: number): ErrorCategory {
  if (status >= 400 && status < 500) {
    if (status === 401 || status === 403) return 'auth';
    if (status === 429) return 'rate_limit';
    if (status === 402 || status === 403) return 'payment';
    return 'validation';
  }
  if (status >= 500) return 'api';
  return 'unknown';
}

/**
 * Mapeia erros para mensagens amigáveis e contextuais
 */
export function handleError(error: any, context?: string): ErrorInfo {
  const errorMessage = error?.message || error?.error || String(error);
  const statusCode = error?.status || error?.statusCode || error?.response?.status;

  // Erros de rede específicos
  if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('Failed to fetch'))) {
    return {
      message: 'Erro de conexão. Verifique sua internet e tente novamente.',
      category: 'network',
      retryable: true,
    };
  }

  if (errorMessage?.includes('NetworkError') || errorMessage?.includes('ERR_NETWORK')) {
    return {
      message: 'Sem conexão com a internet. Verifique sua rede.',
      category: 'network',
      retryable: true,
    };
  }

  // Erros de timeout
  if (errorMessage?.includes('timeout') || errorMessage?.includes('Timeout') || statusCode === 408) {
    return {
      message: 'A requisição demorou muito. Tente novamente.',
      category: 'timeout',
      retryable: true,
    };
  }

  // Erros de rate limit
  if (errorMessage?.includes('Limite de requisições') || 
      errorMessage?.includes('rate limit') || 
      errorMessage?.includes('Too many requests') ||
      statusCode === 429) {
    const retryAfter = error?.retryAfter || error?.retry_after || 60;
    return {
      message: `Muitas requisições. Aguarde ${retryAfter} segundos antes de tentar novamente.`,
      category: 'rate_limit',
      retryable: true,
    };
  }

  // Erros de autenticação específicos
  if (errorMessage?.includes('não autenticado') || 
      errorMessage?.includes('autenticação') ||
      errorMessage?.includes('Token expired') ||
      errorMessage?.includes('Invalid token') ||
      statusCode === 401) {
    return {
      message: 'Sua sessão expirou. Faça login novamente.',
      category: 'auth',
      retryable: false,
      action: {
        label: 'Fazer Login',
        onClick: () => {
          // Será implementado pelo componente que usa
        }
      }
    };
  }

  // Erros de permissão
  if (errorMessage?.includes('permissão') || 
      errorMessage?.includes('permission denied') ||
      errorMessage?.includes('Forbidden') ||
      statusCode === 403) {
    return {
      message: 'Você não tem permissão para realizar esta ação.',
      category: 'permission',
      retryable: false,
    };
  }

  // Erros de pagamento
  if (errorMessage?.includes('pagamento') || 
      errorMessage?.includes('payment') ||
      errorMessage?.includes('cartão') ||
      errorMessage?.includes('card') ||
      statusCode === 402) {
    return {
      message: 'Erro no processamento do pagamento. Verifique os dados do cartão.',
      category: 'payment',
      retryable: true,
    };
  }

  // Erros de quota/créditos
  if (errorMessage?.includes('créditos') || 
      errorMessage?.includes('credits') ||
      errorMessage?.includes('sem créditos') ||
      errorMessage?.includes('insufficient')) {
    return {
      message: 'Créditos insuficientes. Adquira mais créditos para continuar.',
      category: 'quota',
      retryable: false,
      action: {
        label: 'Comprar Créditos',
        onClick: () => {
          // Será implementado pelo componente que usa
        }
      }
    };
  }

  // Erros de storage
  if (errorMessage?.includes('storage') || 
      errorMessage?.includes('Storage quota') ||
      errorMessage?.includes('QuotaExceeded')) {
    return {
      message: 'Espaço de armazenamento insuficiente. Limpe o cache do navegador.',
      category: 'storage',
      retryable: false,
    };
  }

  // Erros de validação específicos
  if (errorMessage?.includes('muito grande') || errorMessage?.includes('too large')) {
    return {
      message: 'Arquivo muito grande. Reduza o tamanho e tente novamente.',
      category: 'validation',
      retryable: false,
    };
  }

  if (errorMessage?.includes('formato') || errorMessage?.includes('formato inválido') || errorMessage?.includes('invalid format')) {
    return {
      message: 'Formato de arquivo não suportado. Use PNG, JPG ou WEBP.',
      category: 'validation',
      retryable: false,
    };
  }

  if (errorMessage?.includes('email') && errorMessage?.includes('inválido')) {
    return {
      message: 'Email inválido. Verifique o formato e tente novamente.',
      category: 'validation',
      retryable: false,
    };
  }

  if (errorMessage?.includes('senha') && (errorMessage?.includes('fraca') || errorMessage?.includes('weak'))) {
    return {
      message: 'Senha muito fraca. Use pelo menos 8 caracteres com letras maiúsculas, minúsculas e números.',
      category: 'validation',
      retryable: false,
    };
  }

  if (errorMessage?.includes('prompt') && (errorMessage?.includes('muito longo') || errorMessage?.includes('too long'))) {
    return {
      message: 'Prompt muito longo. Reduza para no máximo 2000 caracteres.',
      category: 'validation',
      retryable: false,
    };
  }

  // Erros de validação genéricos
  if (errorMessage?.includes('inválido') || 
      errorMessage?.includes('não suportado') ||
      errorMessage?.includes('invalid') ||
      statusCode === 400) {
    return {
      message: errorMessage || 'Dados inválidos. Verifique as informações e tente novamente.',
      category: 'validation',
      retryable: false,
    };
  }

  // Erros da API com contexto
  if (statusCode) {
    const category = getCategoryFromStatus(statusCode);
    if (statusCode >= 500) {
      return {
        message: 'Erro no servidor. Nossa equipe foi notificada. Tente novamente em alguns instantes.',
        category,
        retryable: true,
      };
    }
  }

  // Erros da API com mensagem
  if (errorMessage && typeof errorMessage === 'string' && errorMessage.length > 0) {
    return {
      message: errorMessage,
      category: statusCode ? getCategoryFromStatus(statusCode) : 'api',
      retryable: errorMessage.includes('tente novamente') || 
                 errorMessage.includes('aguarde') ||
                 errorMessage.includes('retry') ||
                 (statusCode && statusCode >= 500),
    };
  }

  // Erro desconhecido com contexto
  return {
    message: context 
      ? `Ocorreu um erro ao ${context}. Tente novamente ou entre em contato com o suporte.`
      : 'Ocorreu um erro inesperado. Tente novamente ou entre em contato com o suporte.',
    category: 'unknown',
    retryable: true,
  };
}

/**
 * Log de erro estruturado (apenas em desenvolvimento)
 */
export function logError(error: any, context?: string): void {
  if (import.meta.env.DEV) {
    console.error(`[Error Handler${context ? ` - ${context}` : ''}]`, {
      error,
      message: error?.message,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
    });
  }
}

