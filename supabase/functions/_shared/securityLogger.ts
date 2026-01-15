
/**
 * Sistema de Logging de Segurança
 * Registra eventos de segurança para auditoria e detecção de anomalias
 */

export interface SecurityEvent {
  type: 'rate_limit' | 'invalid_origin' | 'invalid_mime' | 'prompt_sanitized' | 'template_invalid' | 'timeout' | 'unauthorized' | 'error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ip?: string;
  userAgent?: string;
  details: Record<string, any>;
  timestamp: string;
}

/**
 * Registra um evento de segurança
 */
export async function logSecurityEvent(
  event: Omit<SecurityEvent, 'timestamp'>
): Promise<void> {
  const securityEvent: SecurityEvent = {
    ...event,
    timestamp: new Date().toISOString()
  };

  try {
    // Em produção, salvar no banco de dados
    // Por enquanto, log estruturado para análise
    console.error(JSON.stringify({
      type: 'SECURITY_EVENT',
      ...securityEvent
    }));

    // TODO: Implementar salvamento no Supabase quando necessário
    // const supabaseUrl = Deno.env.get('SUPABASE_URL');
    // const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    // if (supabaseUrl && supabaseServiceKey) {
    //   const supabase = createClient(supabaseUrl, supabaseServiceKey);
    //   await supabase.from('security_logs').insert(securityEvent);
    // }
  } catch (error) {
    // Não falhar se o logging falhar
    console.error('Failed to log security event:', error);
  }
}

/**
 * Helper para criar eventos de rate limit
 */
export function createRateLimitEvent(
  userId: string | undefined,
  ip: string | undefined,
  userAgent: string | undefined,
  endpoint: string
): Omit<SecurityEvent, 'timestamp'> {
  return {
    type: 'rate_limit',
    severity: 'medium',
    userId,
    ip,
    userAgent,
    details: { endpoint }
  };
}

/**
 * Helper para criar eventos de origem inválida
 */
export function createInvalidOriginEvent(
  origin: string | null,
  ip: string | undefined,
  userAgent: string | undefined
): Omit<SecurityEvent, 'timestamp'> {
  return {
    type: 'invalid_origin',
    severity: 'high',
    ip,
    userAgent,
    details: { origin }
  };
}

/**
 * Helper para criar eventos de MIME type inválido
 */
export function createInvalidMimeEvent(
  userId: string | undefined,
  ip: string | undefined,
  mimeType: string,
  expectedTypes: string[]
): Omit<SecurityEvent, 'timestamp'> {
  return {
    type: 'invalid_mime',
    severity: 'medium',
    userId,
    ip,
    details: { mimeType, expectedTypes }
  };
}

/**
 * Helper para criar eventos de prompt sanitizado
 */
export function createPromptSanitizedEvent(
  userId: string | undefined,
  ip: string | undefined,
  originalLength: number,
  sanitizedLength: number,
  removedContent: string[]
): Omit<SecurityEvent, 'timestamp'> {
  return {
    type: 'prompt_sanitized',
    severity: 'low',
    userId,
    ip,
    details: {
      originalLength,
      sanitizedLength,
      removedContent: removedContent.slice(0, 10) // Limitar para não expor muito
    }
  };
}

/**
 * Helper para criar eventos de template inválido
 */
export function createInvalidTemplateEvent(
  userId: string | undefined,
  ip: string | undefined,
  templateId: string,
  allowedTemplates: string[]
): Omit<SecurityEvent, 'timestamp'> {
  return {
    type: 'template_invalid',
    severity: 'medium',
    userId,
    ip,
    details: { templateId, allowedTemplates }
  };
}

/**
 * Helper para criar eventos de timeout
 */
export function createTimeoutEvent(
  userId: string | undefined,
  ip: string | undefined,
  endpoint: string,
  timeoutMs: number
): Omit<SecurityEvent, 'timestamp'> {
  return {
    type: 'timeout',
    severity: 'medium',
    userId,
    ip,
    details: { endpoint, timeoutMs }
  };
}

/**
 * Helper para criar eventos de não autorizado
 */
export function createUnauthorizedEvent(
  ip: string | undefined,
  userAgent: string | undefined,
  reason: string
): Omit<SecurityEvent, 'timestamp'> {
  return {
    type: 'unauthorized',
    severity: 'high',
    ip,
    userAgent,
    details: { reason }
  };
}

/**
 * Helper para criar eventos de erro crítico
 */
export function createErrorEvent(
  userId: string | undefined,
  ip: string | undefined,
  error: Error,
  context: Record<string, any>
): Omit<SecurityEvent, 'timestamp'> {
  return {
    type: 'error',
    severity: 'critical',
    userId,
    ip,
    details: {
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5), // Limitar stack trace
      ...context
    }
  };
}

/**
 * Extrai informações do request para logging
 */
export function extractRequestInfo(req: Request): {
  ip: string | undefined;
  userAgent: string | undefined;
  origin: string | null;
} {
  return {
    ip: req.headers.get('x-forwarded-for')?.split(',')[0] || 
        req.headers.get('x-real-ip') || 
        undefined,
    userAgent: req.headers.get('user-agent') || undefined,
    origin: req.headers.get('origin')
  };
}

