
export interface ErrorMessage {
  message: string;
  action?: {
    label: string;
    hint?: string;
  };
}

/**
 * Mapeamento de códigos de erro para mensagens amigáveis
 */
export const ERROR_MESSAGES: Record<string, ErrorMessage> = {
  // Network errors
  'NETWORK_ERROR': {
    message: 'Erro de conexão. Verifique sua internet e tente novamente.',
    action: {
      label: 'Tentar novamente',
      hint: 'Clique para tentar novamente'
    }
  },
  
  // Rate limit
  'RATE_LIMIT_EXCEEDED': {
    message: 'Muitas requisições. Aguarde um momento antes de tentar novamente.',
    action: {
      label: 'Entendi',
      hint: 'Aguarde 60 segundos antes de tentar novamente'
    }
  },
  
  // Authentication
  'AUTH_REQUIRED': {
    message: 'Você precisa estar logado para continuar.',
    action: {
      label: 'Fazer login',
      hint: 'Clique para abrir a tela de login'
    }
  },
  'AUTH_EXPIRED': {
    message: 'Sua sessão expirou. Faça login novamente.',
    action: {
      label: 'Fazer login',
      hint: 'Clique para fazer login novamente'
    }
  },
  
  // Validation
  'IMAGE_TOO_LARGE': {
    message: 'Imagem muito grande. Tamanho máximo: 10MB',
    action: {
      label: 'Entendi',
      hint: 'Reduza o tamanho da imagem e tente novamente'
    }
  },
  'INVALID_IMAGE_TYPE': {
    message: 'Tipo de arquivo não suportado. Use PNG, JPG, JPEG ou WEBP',
    action: {
      label: 'Entendi',
      hint: 'Converta a imagem para um formato suportado'
    }
  },
  'INVALID_PROMPT': {
    message: 'Prompt inválido ou vazio. Digite um prompt válido.',
    action: {
      label: 'Entendi',
      hint: 'Digite um prompt descritivo'
    }
  },
  
  // API errors
  'GENERATION_FAILED': {
    message: 'Não foi possível gerar a imagem. Tente novamente.',
    action: {
      label: 'Tentar novamente',
      hint: 'Clique para tentar gerar novamente'
    }
  },
  'SUGGESTION_FAILED': {
    message: 'Não foi possível gerar sugestões. Tente novamente.',
    action: {
      label: 'Tentar novamente',
      hint: 'Clique para tentar gerar sugestões novamente'
    }
  },
  
  // Credits
  'INSUFFICIENT_CREDITS': {
    message: 'Créditos insuficientes. Compre mais créditos para continuar.',
    action: {
      label: 'Comprar créditos',
      hint: 'Clique para abrir a loja de créditos'
    }
  },
  
  // Unknown
  'UNKNOWN_ERROR': {
    message: 'Ocorreu um erro inesperado. Tente novamente ou entre em contato com o suporte.',
    action: {
      label: 'Tentar novamente',
      hint: 'Clique para tentar novamente'
    }
  }
};

/**
 * Obtém mensagem de erro por código
 */
export function getErrorMessage(code: string): ErrorMessage {
  return ERROR_MESSAGES[code] || ERROR_MESSAGES['UNKNOWN_ERROR'];
}

