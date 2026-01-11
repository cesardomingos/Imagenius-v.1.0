
/**
 * Centraliza o acesso a variáveis de ambiente para evitar exposição direta no código.
 */
export const CONFIG = {
  PRODUCT: {
    NAME: process.env.PRODUCT_NAME || 'Imagenius',
    SUPPORT: process.env.SUPPORT_EMAIL || 'support@imagenius.ai',
  },
  MODELS: {
    TEXT: process.env.MODEL_TEXT_PRO || 'gemini-3-pro-preview',
    IMAGE: process.env.MODEL_IMAGE_PRO || 'gemini-3-pro-image-preview',
  },
  NETWORK: {
    API_BASE: process.env.API_BASE_URL || 'https://generativelanguage.googleapis.com',
  }
} as const;
