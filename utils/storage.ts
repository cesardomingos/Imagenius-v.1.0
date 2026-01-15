
/**
 * Utilitário para gerenciar armazenamento seguro
 * Usa sessionStorage para dados sensíveis e localStorage para dados não sensíveis
 */

/**
 * Armazena dados sensíveis em sessionStorage (limpo ao fechar aba)
 */
export function setSecureItem(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch (error) {
    console.error(`Erro ao salvar item seguro ${key}:`, error);
  }
}

/**
 * Recupera dados sensíveis de sessionStorage
 */
export function getSecureItem(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch (error) {
    console.error(`Erro ao recuperar item seguro ${key}:`, error);
    return null;
  }
}

/**
 * Remove dados sensíveis de sessionStorage
 */
export function removeSecureItem(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch (error) {
    console.error(`Erro ao remover item seguro ${key}:`, error);
  }
}

/**
 * Armazena dados não sensíveis em localStorage (persiste entre sessões)
 */
export function setItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error(`Erro ao salvar item ${key}:`, error);
  }
}

/**
 * Recupera dados não sensíveis de localStorage
 */
export function getItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`Erro ao recuperar item ${key}:`, error);
    return null;
  }
}

/**
 * Remove dados não sensíveis de localStorage
 */
export function removeItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Erro ao remover item ${key}:`, error);
  }
}

/**
 * Limpa todos os dados sensíveis (sessionStorage)
 */
export function clearSecureStorage(): void {
  try {
    sessionStorage.clear();
  } catch (error) {
    console.error('Erro ao limpar armazenamento seguro:', error);
  }
}

/**
 * Limpa todos os dados não sensíveis (localStorage)
 */
export function clearStorage(): void {
  try {
    localStorage.clear();
  } catch (error) {
    console.error('Erro ao limpar armazenamento:', error);
  }
}

/**
 * Chaves que devem ser armazenadas em sessionStorage (dados sensíveis)
 */
const SECURE_KEYS = [
  'genius_user', // Dados do usuário autenticado
  'genius_session', // Token de sessão
  'genius_auth_token', // Token de autenticação
];

/**
 * Migra dados sensíveis de localStorage para sessionStorage
 * Deve ser chamado uma vez na inicialização da aplicação
 */
export function migrateSensitiveData(): void {
  SECURE_KEYS.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
      try {
        sessionStorage.setItem(key, value);
        localStorage.removeItem(key);
        if (import.meta.env.DEV) {
          console.log(`Migrado ${key} de localStorage para sessionStorage`);
        }
      } catch (error) {
        console.error(`Erro ao migrar ${key}:`, error);
      }
    }
  });
}

