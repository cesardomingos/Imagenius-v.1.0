
/**
 * Módulo de moderação de conteúdo para prompts
 * Valida e sanitiza prompts antes de enviar para a API
 */

const MAX_PROMPT_LENGTH = 2000;

/**
 * Lista expandida de padrões bloqueados
 */
const BLOCKED_PATTERNS = [
  // Conteúdo explícito
  /nude|naked|explicit|nsfw|porn|sex/gi,
  /genital|breast|penis|vagina/gi,
  
  // Violência
  /violence|kill|murder|death|suicide|torture|gore/gi,
  /weapon|gun|knife|bomb|explosive/gi,
  
  // Discriminação e ódio
  /hate|discrimination|racism|sexism|homophobia/gi,
  /nazi|kkk|fascist/gi,
  
  // Conteúdo ilegal
  /drug|marijuana|cocaine|heroin/gi,
  /illegal|crime|theft|robbery/gi,
  
  // Spam e manipulação
  /spam|scam|phishing|malware|virus/gi,
];

/**
 * Caracteres especiais suspeitos que podem ser usados para bypass
 */
const SUSPICIOUS_CHARACTERS = [
  /[^\x20-\x7E\u00A0-\uFFFF]/g, // Caracteres não-ASCII suspeitos
  /\x00|\x01|\x02|\x03|\x04|\x05|\x06|\x07|\x08|\x0B|\x0C|\x0E|\x0F/g, // Caracteres de controle
];

/**
 * Valida o comprimento do prompt
 */
export function validatePromptLength(prompt: string): { valid: boolean; error?: string } {
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return {
      valid: false,
      error: `Prompt muito longo. Máximo de ${MAX_PROMPT_LENGTH} caracteres.`
    };
  }
  return { valid: true };
}

/**
 * Sanitiza prompt removendo conteúdo ofensivo e suspeito
 */
export function sanitizePrompt(prompt: string): { sanitized: string; wasModified: boolean } {
  let sanitized = prompt.trim();
  let wasModified = false;

  // Remover caracteres suspeitos
  for (const pattern of SUSPICIOUS_CHARACTERS) {
    const before = sanitized;
    sanitized = sanitized.replace(pattern, '');
    if (sanitized !== before) {
      wasModified = true;
    }
  }

  // Aplicar filtros de conteúdo bloqueado
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(sanitized)) {
      sanitized = sanitized.replace(pattern, '[conteúdo filtrado]');
      wasModified = true;
    }
  }

  return { sanitized: sanitized.trim(), wasModified };
}

/**
 * Valida e sanitiza prompt completo
 */
export function validateAndSanitizePrompt(prompt: string): {
  valid: boolean;
  sanitized?: string;
  error?: string;
  wasModified: boolean;
} {
  // Validar comprimento
  const lengthValidation = validatePromptLength(prompt);
  if (!lengthValidation.valid) {
    return {
      valid: false,
      error: lengthValidation.error,
      wasModified: false
    };
  }

  // Sanitizar
  const sanitization = sanitizePrompt(prompt);

  return {
    valid: true,
    sanitized: sanitization.sanitized,
    wasModified: sanitization.wasModified
  };
}

/**
 * Loga tentativa de bypass para auditoria
 */
export function logBypassAttempt(
  originalPrompt: string,
  sanitizedPrompt: string,
  userId?: string
): void {
  if (originalPrompt !== sanitizedPrompt) {
    console.warn('[Content Moderation] Tentativa de bypass detectada', {
      userId,
      originalLength: originalPrompt.length,
      sanitizedLength: sanitizedPrompt.length,
      timestamp: new Date().toISOString()
    });
  }
}

