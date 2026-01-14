
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

export type AppStep = 'mode_selection' | 'upload' | 'themes' | 'prompts' | 'gallery';

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
}

export interface UserProfile {
  id: string;
  email: string;
  credits: number;
  full_name?: string;
  avatar_url?: string;
}

export interface Transaction {
  id: string;
  status: 'pending' | 'completed' | 'failed';
  plan_id: string;
  created_at: number;
}
