
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
