/**
 * Sistema de Analytics para tracking de eventos
 * Suporta Google Analytics 4 (GA4) e eventos customizados
 */

interface AnalyticsEvent {
  action: string;
  category?: string;
  label?: string;
  value?: number;
  [key: string]: any;
}

// Verificar se Google Analytics está disponível
const isGA4Available = (): boolean => {
  return typeof window !== 'undefined' && typeof (window as any).gtag === 'function';
};

// Verificar se há um ID de tracking configurado
const getGA4Id = (): string | null => {
  if (typeof window === 'undefined') return null;
  return import.meta.env.VITE_GA4_MEASUREMENT_ID || null;
};

/**
 * Inicializa Google Analytics 4
 */
export const initAnalytics = (): void => {
  const ga4Id = getGA4Id();
  if (!ga4Id) {
    console.log('[Analytics] GA4 Measurement ID não configurado');
    return;
  }

  // Adicionar script do Google Analytics
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${ga4Id}`;
  document.head.appendChild(script1);

  // Inicializar gtag
  const script2 = document.createElement('script');
  script2.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${ga4Id}', {
      page_path: window.location.pathname,
    });
  `;
  document.head.appendChild(script2);

  console.log('[Analytics] Google Analytics 4 inicializado');
};

/**
 * Tracka um evento customizado
 */
export const trackEvent = (event: AnalyticsEvent): void => {
  if (!isGA4Available()) {
    // Fallback: log no console em desenvolvimento
    if (import.meta.env.DEV) {
      console.log('[Analytics Event]', event);
    }
    return;
  }

  const { action, category, label, value, ...params } = event;
  
  (window as any).gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
    ...params
  });
};

/**
 * Tracka visualização de página
 */
export const trackPageView = (path: string, title?: string): void => {
  if (!isGA4Available()) {
    if (import.meta.env.DEV) {
      console.log('[Analytics PageView]', { path, title });
    }
    return;
  }

  (window as any).gtag('config', getGA4Id()!, {
    page_path: path,
    page_title: title || document.title
  });
};

/**
 * Eventos pré-definidos para a aplicação
 */
export const analyticsEvents = {
  // Geração de imagem
  imageGenerated: (mode: string, promptLength: number) => {
    trackEvent({
      action: 'image_generated',
      category: 'generation',
      label: mode,
      value: promptLength,
      prompt_length: promptLength,
      mode: mode
    });
  },

  // Compra de créditos
  creditsPurchased: (planId: string, amount: number, currency: string = 'BRL') => {
    trackEvent({
      action: 'purchase',
      category: 'ecommerce',
      label: planId,
      value: amount,
      currency: currency,
      items: [{ item_id: planId, price: amount, currency: currency }]
    });
  },

  // Cadastro
  userSignedUp: (method: string = 'email') => {
    trackEvent({
      action: 'sign_up',
      category: 'user',
      label: method,
      method: method
    });
  },

  // Login
  userSignedIn: (method: string = 'email') => {
    trackEvent({
      action: 'login',
      category: 'user',
      label: method,
      method: method
    });
  },

  // Compartilhamento
  contentShared: (platform: string, contentType: string = 'image') => {
    trackEvent({
      action: 'share',
      category: 'social',
      label: platform,
      content_type: contentType,
      method: platform
    });
  },

  // Conversão (test drive → cadastro)
  testDriveConversion: () => {
    trackEvent({
      action: 'conversion',
      category: 'marketing',
      label: 'test_drive_to_signup',
      conversion_type: 'test_drive_signup'
    });
  },

  // Visualização de galeria
  galleryViewed: (imageCount: number) => {
    trackEvent({
      action: 'view_item_list',
      category: 'gallery',
      value: imageCount,
      item_count: imageCount
    });
  },

  // Download de imagem
  imageDownloaded: (imageId: string) => {
    trackEvent({
      action: 'download',
      category: 'image',
      label: imageId,
      item_id: imageId
    });
  },

  // Erro
  errorOccurred: (errorType: string, errorMessage: string) => {
    trackEvent({
      action: 'exception',
      category: 'error',
      label: errorType,
      description: errorMessage,
      fatal: false
    });
  },

  // Tutorial iniciado
  tutorialStarted: () => {
    trackEvent({
      action: 'tutorial_begin',
      category: 'onboarding'
    });
  },

  // Tutorial completado
  tutorialCompleted: () => {
    trackEvent({
      action: 'tutorial_complete',
      category: 'onboarding'
    });
  },

  // Modal aberto
  modalOpened: (modalName: string) => {
    trackEvent({
      action: 'modal_view',
      category: 'ui',
      label: modalName,
      modal_name: modalName
    });
  }
};

