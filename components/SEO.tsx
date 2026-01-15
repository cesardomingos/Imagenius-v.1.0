import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  keywords?: string;
}

const SEO: React.FC<SEOProps> = ({
  title = "Imagenius | I'm a genius, and you are too.",
  description = "Transforme suas ideias em imagens incríveis com IA. Gere, melhore e restaure imagens com tecnologia de ponta.",
  image = "/og-image.png",
  url = typeof window !== 'undefined' ? window.location.href : '',
  type = "website",
  keywords = "IA, inteligência artificial, geração de imagens, imagem, arte, design, criatividade, Gemini, Imagenius"
}) => {
  useEffect(() => {
    // Atualizar title
    document.title = title;

    // Função helper para atualizar ou criar meta tag
    const setMetaTag = (name: string, content: string, attribute: string = 'name') => {
      let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Meta tags básicas
    setMetaTag('description', description);
    setMetaTag('keywords', keywords);
    setMetaTag('author', 'Imagenius');

    // Open Graph tags
    setMetaTag('og:title', title, 'property');
    setMetaTag('og:description', description, 'property');
    setMetaTag('og:image', image, 'property');
    setMetaTag('og:url', url, 'property');
    setMetaTag('og:type', type, 'property');
    setMetaTag('og:site_name', 'Imagenius', 'property');
    setMetaTag('og:locale', 'pt_BR', 'property');

    // Twitter Card tags
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', title);
    setMetaTag('twitter:description', description);
    setMetaTag('twitter:image', image);

    // Meta tags adicionais
    setMetaTag('theme-color', '#4f46e5');
    setMetaTag('viewport', 'width=device-width, initial-scale=1.0');

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);
  }, [title, description, image, url, type, keywords]);

  return null;
};

export default SEO;

