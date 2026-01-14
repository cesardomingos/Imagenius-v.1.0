
export type ErrorCategory = 'network' | 'validation' | 'api' | 'auth' | 'rate_limit' | 'unknown';

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
 * Mapeia erros para mensagens amigáveis
 */
export function handleError(error: any): ErrorInfo {
  // Erros de rede
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      message: 'Erro de conexão. Verifique sua internet e tente novamente.',
      category: 'network',
      retryable: true,
    };
  }

  // Erros de rate limit
  if (error.message?.includes('Limite de requisições') || error.message?.includes('rate limit')) {
    return {
      message: 'Muitas requisições. Aguarde um momento antes de tentar novamente.',
      category: 'rate_limit',
      retryable: true,
    };
  }

  // Erros de autenticação
  if (error.message?.includes('não autenticado') || error.message?.includes('autenticação')) {
    return {
      message: 'Sua sessão expirou. Faça login novamente.',
      category: 'auth',
      retryable: false,
    };
  }

  // Erros de validação
  if (error.message?.includes('muito grande') || error.message?.includes('inválido') || error.message?.includes('não suportado')) {
    return {
      message: error.message,
      category: 'validation',
      retryable: false,
    };
  }

  // Erros da API
  if (error.message && typeof error.message === 'string') {
    return {
      message: error.message,
      category: 'api',
      retryable: error.message.includes('tente novamente') || error.message.includes('aguarde'),
    };
  }

  // Erro desconhecido
  return {
    message: 'Ocorreu um erro inesperado. Tente novamente ou entre em contato com o suporte.',
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

