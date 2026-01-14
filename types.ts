
export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
}

export interface PromptSuggestion {
  id: number;
  text: string;
}

export type AppStep = 'mode_selection' | 'template_selection' | 'upload' | 'themes' | 'prompts' | 'gallery';

export type ProjectMode = 'single' | 'studio';

export interface ImageData {
  data: string;
  mimeType: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  credits: number;
  price: string;
  popular?: boolean;
  type?: 'one-time' | 'subscription'; // Tipo de plano: avulso ou assinatura
  interval?: 'month' | 'year'; // Para assinaturas: mensal ou anual
  pixBonus?: number; // Bônus de créditos ao pagar via PIX (apenas para planos avulsos)
}

export interface UserProfile {
  id: string;
  email: string;
  credits: number;
  full_name?: string;
  avatar_url?: string;
  referral_code?: string;
  referred_by?: string;
}

export interface Transaction {
  id: string;
  status: 'pending' | 'completed' | 'failed';
  plan_id: string;
  created_at: number;
}

// Re-export achievements types
export type { AchievementId, Achievement, UserAchievement } from './types/achievements';
export { ACHIEVEMENTS } from './types/achievements';

// Re-export template types
export type { TemplateId, Template } from './config/templates';
export { TEMPLATES, getTemplateById, getTemplatesByCategory, getAllTemplates } from './config/templates';
