
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
 * Caracteres Unicode que podem ser usados para mascarar palavras bloqueadas
 * Exemplos: zero-width spaces, homoglyphs, etc.
 */
const BYPASS_CHARACTERS = [
  /\u200B/g, // Zero-width space
  /\u200C/g, // Zero-width non-joiner
  /\u200D/g, // Zero-width joiner
  /\uFEFF/g, // Zero-width no-break space
  /\u2060/g, // Word joiner
  /\u180E/g, // Mongolian vowel separator
];

/**
 * Normaliza string Unicode para forma canônica (NFC)
 * Isso ajuda a detectar tentativas de bypass usando caracteres similares
 */
function normalizeUnicode(text: string): string {
  // Normalizar para NFC (Canonical Composition)
  let normalized = text.normalize('NFC');
  
  // Remover caracteres de bypass
  for (const pattern of BYPASS_CHARACTERS) {
    normalized = normalized.replace(pattern, '');
  }
  
  return normalized;
}

/**
 * Detecta tentativas de bypass usando homoglyphs ou caracteres similares
 */
function detectBypassAttempt(text: string): boolean {
  // Padrões comuns de bypass: substituir letras por números ou caracteres similares
  const bypassPatterns = [
    /[0oO]/g, // 0, o, O podem ser usados para mascarar
    /[1lI]/g, // 1, l, I podem ser confundidos
    /[5sS]/g, // 5, s, S
    /[@aA]/g, // @, a, A
  ];
  
  // Verificar se há muitas substituições suspeitas
  let suspiciousCount = 0;
  for (const pattern of bypassPatterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > text.length * 0.3) {
      suspiciousCount++;
    }
  }
  
  return suspiciousCount >= 2;
}

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

  // Normalizar Unicode primeiro (ajuda a detectar bypass)
  const beforeNormalization = sanitized;
  sanitized = normalizeUnicode(sanitized);
  if (sanitized !== beforeNormalization) {
    wasModified = true;
  }

  // Detectar tentativas de bypass
  if (detectBypassAttempt(sanitized)) {
    // Se detectar bypass, aplicar sanitização mais agressiva
    wasModified = true;
  }

  // Remover caracteres suspeitos
  for (const pattern of SUSPICIOUS_CHARACTERS) {
    const before = sanitized;
    sanitized = sanitized.replace(pattern, '');
    if (sanitized !== before) {
      wasModified = true;
    }
  }

  // Aplicar filtros de conteúdo bloqueado (após normalização)
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

