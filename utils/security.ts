
/**
 * Sanitiza strings para remover caracteres de controle e tags HTML/Script.
 */
export function sanitizeInput(text: string, maxLength: number = 500): string {
  if (!text) return "";
  
  return text
    .replace(/[<>]/g, "") // Remove tags simples
    .replace(/javascript:/gi, "") // Remove protocolos de script
    .trim()
    .slice(0, maxLength);
}

/**
 * Valida se um MIME type de imagem é seguro.
 */
export function isSafeImageType(mimeType: string): boolean {
  const safeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  return safeTypes.includes(mimeType);
}
