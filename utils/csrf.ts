/**
 * Utilitário para proteção CSRF
 * Gera e valida tokens CSRF para operações críticas
 */

/**
 * Gera um token CSRF aleatório
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Armazena token CSRF no sessionStorage
 */
export function storeCSRFToken(token: string): void {
  try {
    sessionStorage.setItem('csrf_token', token);
  } catch (error) {
    console.error('Erro ao armazenar token CSRF:', error);
  }
}

/**
 * Obtém token CSRF do sessionStorage
 */
export function getCSRFToken(): string | null {
  try {
    return sessionStorage.getItem('csrf_token');
  } catch (error) {
    console.error('Erro ao obter token CSRF:', error);
    return null;
  }
}

/**
 * Valida token CSRF
 */
export function validateCSRFToken(token: string | null): boolean {
  if (!token) return false;
  const storedToken = getCSRFToken();
  if (!storedToken) return false;
  return token === storedToken;
}

/**
 * Remove token CSRF (útil para logout)
 */
export function clearCSRFToken(): void {
  try {
    sessionStorage.removeItem('csrf_token');
  } catch (error) {
    console.error('Erro ao remover token CSRF:', error);
  }
}

/**
 * Gera e armazena um novo token CSRF
 */
export function refreshCSRFToken(): string {
  const token = generateCSRFToken();
  storeCSRFToken(token);
  return token;
}

