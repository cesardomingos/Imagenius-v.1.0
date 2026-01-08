
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

export type AppStep = 'upload' | 'themes' | 'prompts' | 'gallery';
