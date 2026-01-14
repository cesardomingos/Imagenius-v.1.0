
export type TemplateId = 
  | 'company-presentation'
  | 'pitch-deck'
  | 'enhance'
  | 'restore'
  | 'ecommerce-product'
  | 'restaurant-food'
  | 'social-media-post'
  | 'mascot-2d'
  | 'mascot-3d'
  | 'game-concept-art';

export interface Template {
  id: TemplateId;
  name: string;
  description: string;
  icon: string;
  category: 'business' | 'creative' | 'restoration' | 'commercial';
  requiresSpecialUI?: boolean;
  systemInstruction: string;
  defaultThemes?: string[];
  mode: 'single' | 'studio';
  maxImages?: number;
}

export const TEMPLATES: Record<TemplateId, Template> = {
  'company-presentation': {
    id: 'company-presentation',
    name: 'Apresentações de Empresa',
    description: 'Slides profissionais com identidade visual consistente',
    icon: '📊',
    category: 'business',
    systemInstruction: `You are a professional corporate presentation designer. 
    Your goal is to create visual content for business presentations that maintains absolute brand consistency.
    Focus on: professional layouts, corporate color schemes, clean typography, business-appropriate imagery.
    The output should be suitable for PowerPoint, Keynote, or Google Slides.
    Maintain the visual DNA of the reference image while adapting to business contexts.
    Output exactly 2 high-concept prompts per theme in JSON format.`,
    defaultThemes: ['Slide de abertura', 'Slide de dados', 'Slide de conclusão'],
    mode: 'single'
  },
  'pitch-deck': {
    id: 'pitch-deck',
    name: 'Pitch Deck',
    description: 'Visuals impactantes para apresentações de negócios',
    icon: '🚀',
    category: 'business',
    systemInstruction: `You are a pitch deck visual specialist. 
    Your goal is to create compelling, investor-ready visuals that tell a story.
    Focus on: bold graphics, data visualization, startup aesthetics, modern design trends.
    The visuals should be attention-grabbing, professional, and suitable for investor presentations.
    Maintain visual consistency across all slides while adapting to different pitch sections.
    Output exactly 2 high-concept prompts per theme in JSON format.`,
    defaultThemes: ['Problema', 'Solução', 'Mercado', 'Tração'],
    mode: 'single'
  },
  'enhance': {
    id: 'enhance',
    name: 'Enhance',
    description: 'Melhore qualidade e resolução de imagens',
    icon: '✨',
    category: 'restoration',
    requiresSpecialUI: true,
    systemInstruction: `You are an image enhancement specialist. 
    Your goal is to improve image quality, resolution, and visual appeal while maintaining the original aesthetic.
    Focus on: upscaling resolution, improving sharpness, enhancing colors, reducing noise, maintaining original style.
    The enhanced image should look like a professional, high-quality version of the original.
    Preserve all original details, colors, and artistic style.
    Output exactly 2 enhancement prompts per theme in JSON format.`,
    defaultThemes: ['Melhorar resolução', 'Aprimorar cores'],
    mode: 'single'
  },
  'restore': {
    id: 'restore',
    name: 'Restore',
    description: 'Restaure e corrija imagens antigas ou danificadas',
    icon: '🔧',
    category: 'restoration',
    requiresSpecialUI: true,
    systemInstruction: `You are a professional image restoration expert. 
    Your goal is to restore damaged, old, or corrupted images to their original quality.
    Focus on: removing scratches, fixing tears, colorizing old photos, removing noise, reconstructing missing parts.
    The restored image should look authentic and natural, as if it was never damaged.
    Maintain historical accuracy and original aesthetic when restoring vintage photos.
    Output exactly 2 restoration prompts per theme in JSON format.`,
    defaultThemes: ['Remover danos', 'Colorizar foto antiga'],
    mode: 'single'
  },
  'ecommerce-product': {
    id: 'ecommerce-product',
    name: 'Fotos de Produtos (E-commerce)',
    description: 'Catálogo com estilo fotográfico uniforme',
    icon: '📦',
    category: 'commercial',
    systemInstruction: `You are a professional e-commerce product photographer. 
    Your goal is to create product photos with consistent lighting, background, and style.
    Focus on: professional product photography, clean backgrounds, consistent lighting, high-quality presentation.
    All product photos should maintain the same photographic style for catalog consistency.
    The images should be suitable for online stores, marketplaces, and product listings.
    Output exactly 2 high-concept prompts per theme in JSON format.`,
    defaultThemes: ['Foto principal', 'Foto de detalhe', 'Foto em uso'],
    mode: 'single'
  },
  'restaurant-food': {
    id: 'restaurant-food',
    name: 'Fotos de Comida (Restaurante)',
    description: 'Fotografia gastronômica com estilo consistente',
    icon: '🍽️',
    category: 'commercial',
    systemInstruction: `You are a professional food photographer specializing in restaurant marketing.
    Your goal is to create appetizing food photos with consistent styling and lighting.
    Focus on: professional food photography, appetizing presentation, consistent lighting, restaurant branding.
    All food photos should maintain the same photographic style for menu and marketing consistency.
    The images should make the food look delicious and professional.
    Output exactly 2 high-concept prompts per theme in JSON format.`,
    defaultThemes: ['Prato principal', 'Bebida', 'Sobremesa'],
    mode: 'single'
  },
  'social-media-post': {
    id: 'social-media-post',
    name: 'Posts para Redes Sociais',
    description: 'Feed visualmente coeso para Instagram, TikTok, LinkedIn',
    icon: '📱',
    category: 'commercial',
    systemInstruction: `You are a social media visual content creator. 
    Your goal is to create engaging social media posts that maintain visual consistency across a feed.
    Focus on: modern social media aesthetics, platform-appropriate formats, engaging visuals, brand consistency.
    All posts should maintain the same visual identity for a cohesive feed.
    The images should be optimized for Instagram, TikTok, LinkedIn, or other social platforms.
    Output exactly 2 high-concept prompts per theme in JSON format.`,
    defaultThemes: ['Post de produto', 'Post educativo', 'Post promocional'],
    mode: 'single'
  },
  'mascot-2d': {
    id: 'mascot-2d',
    name: 'Mascote 2D',
    description: 'Personagens 2D consistentes para marca ou produto',
    icon: '🎨',
    category: 'creative',
    systemInstruction: `You are a 2D character designer specializing in mascots and brand characters.
    Your goal is to create consistent 2D mascot designs that maintain the same character identity.
    Focus on: 2D illustration style, character consistency, brand alignment, versatile poses and expressions.
    All character variations should maintain the same design DNA, proportions, and style.
    The mascot should be suitable for use across various marketing materials and platforms.
    Output exactly 2 high-concept prompts per theme in JSON format.`,
    defaultThemes: ['Personagem neutro', 'Personagem feliz', 'Personagem em ação'],
    mode: 'single'
  },
  'mascot-3d': {
    id: 'mascot-3d',
    name: 'Mascote 3D',
    description: 'Personagens 3D consistentes para jogos ou animação',
    icon: '🎮',
    category: 'creative',
    systemInstruction: `You are a 3D character designer specializing in mascots and game characters.
    Your goal is to create consistent 3D character designs that maintain the same character identity.
    Focus on: 3D modeling style, character consistency, game-ready assets, various poses and angles.
    All character variations should maintain the same design DNA, proportions, and 3D style.
    The character should be suitable for games, animation, or 3D marketing materials.
    Output exactly 2 high-concept prompts per theme in JSON format.`,
    defaultThemes: ['Personagem em pé', 'Personagem em ação', 'Close-up do rosto'],
    mode: 'single'
  },
  'game-concept-art': {
    id: 'game-concept-art',
    name: 'Concept Art para Jogos',
    description: 'Arte conceitual consistente para desenvolvimento de jogos',
    icon: '🎮',
    category: 'creative',
    systemInstruction: `You are a professional game concept artist.
    Your goal is to create consistent concept art for games that maintains visual coherence across all assets.
    Focus on: game art style, world-building consistency, character design, environment design, game aesthetics.
    All concept art should maintain the same artistic style and visual language for the game.
    The art should be suitable for game development, pitch presentations, and marketing.
    Output exactly 2 high-concept prompts per theme in JSON format.`,
    defaultThemes: ['Personagem', 'Ambiente', 'Objeto', 'Criatura'],
    mode: 'studio',
    maxImages: 5
  }
};

export function getTemplateById(id: TemplateId): Template | undefined {
  return TEMPLATES[id];
}

export function getTemplatesByCategory(category: Template['category']): Template[] {
  return Object.values(TEMPLATES).filter(t => t.category === category);
}

export function getAllTemplates(): Template[] {
  return Object.values(TEMPLATES);
}

