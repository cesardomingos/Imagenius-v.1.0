
/**
 * Sanitizador de mensagens de erro para produção
 * Remove informações sensíveis e detalhes técnicos que não devem ser expostos
 */

const SENSITIVE_PATTERNS = [
  /api[_-]?key/gi,
  /secret/gi,
  /password/gi,
  /token/gi,
  /credential/gi,
  /authorization/gi,
  /supabase[_-]?url/gi,
  /database[_-]?url/gi,
  /connection[_-]?string/gi,
  /\.env/gi,
  /file[_-]?path/gi,
  /stack[_-]?trace/gi,
];

const TECHNICAL_DETAILS = [
  /at\s+\w+\.\w+/g, // Stack trace patterns
  /Error:\s+/gi,
  /Exception:\s+/gi,
  /line\s+\d+/gi,
  /column\s+\d+/gi,
  /file:\/\/\//gi,
];

/**
 * Sanitiza uma mensagem de erro para produção
 * Remove informações sensíveis e detalhes técnicos
 */
export function sanitizeErrorMessage(error: any, isProduction: boolean = true): string {
  if (!isProduction) {
    // Em desenvolvimento, retornar mensagem completa
    return error?.message || String(error) || 'Erro desconhecido';
  }

  let message = error?.message || String(error) || 'Erro interno do servidor';

  // Remover informações sensíveis
  for (const pattern of SENSITIVE_PATTERNS) {
    message = message.replace(pattern, '[REDACTED]');
  }

  // Remover detalhes técnicos
  for (const pattern of TECHNICAL_DETAILS) {
    message = message.replace(pattern, '');
  }

  // Limpar espaços múltiplos
  message = message.replace(/\s+/g, ' ').trim();

  // Mapear erros conhecidos para mensagens amigáveis
  const errorMappings: Record<string, string> = {
    'rate limit': 'Limite de requisições excedido. Tente novamente em alguns instantes.',
    'unauthorized': 'Você precisa estar autenticado para realizar esta ação.',
    'forbidden': 'Você não tem permissão para realizar esta ação.',
    'not found': 'Recurso não encontrado.',
    'timeout': 'A requisição demorou muito para ser processada. Tente novamente.',
    'network': 'Erro de conexão. Verifique sua internet e tente novamente.',
    'invalid': 'Dados inválidos fornecidos.',
    'validation': 'Dados fornecidos não passaram na validação.',
    'database': 'Erro ao acessar o banco de dados. Tente novamente mais tarde.',
    'storage': 'Erro ao acessar o armazenamento. Tente novamente mais tarde.',
  };

  // Verificar se a mensagem contém algum padrão conhecido
  const lowerMessage = message.toLowerCase();
  for (const [key, friendlyMessage] of Object.entries(errorMappings)) {
    if (lowerMessage.includes(key)) {
      return friendlyMessage;
    }
  }

  // Se não houver mapeamento, retornar mensagem genérica se contiver informações sensíveis
  if (message.includes('[REDACTED]')) {
    return 'Erro interno do servidor. Por favor, tente novamente mais tarde.';
  }

  // Limitar tamanho da mensagem
  if (message.length > 200) {
    message = message.substring(0, 200) + '...';
  }

  return message || 'Erro interno do servidor. Por favor, tente novamente mais tarde.';
}

/**
 * Determina se está em produção baseado em variáveis de ambiente
 */
export function isProduction(): boolean {
  const env = Deno.env.get('ENVIRONMENT') || Deno.env.get('NODE_ENV') || '';
  return env.toLowerCase() === 'production' || env.toLowerCase() === 'prod';
}

/**
 * Cria uma resposta de erro sanitizada
 */
export function createSanitizedErrorResponse(
  error: any,
  statusCode: number = 500,
  corsHeaders: Record<string, string> = {}
): Response {
  const isProd = isProduction();
  const sanitizedMessage = sanitizeErrorMessage(error, isProd);

  return new Response(
    JSON.stringify({ 
      error: sanitizedMessage,
      ...(isProd ? {} : { 
        // Em desenvolvimento, incluir detalhes adicionais
        details: error?.message,
        type: error?.name
      })
    }),
    { 
      status: statusCode, 
      headers: { 
        ...corsHeaders, 
        "Content-Type": "application/json" 
      } 
    }
  );
}

