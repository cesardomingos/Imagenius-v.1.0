export type AchievementId = 
  | 'first_spark'
  | 'visual_alchemist'
  | 'art_director'
  | 'creative_marathon'
  | 'art_patron'
  | 'unlimited_power'
  | 'ambassador';

export type AchievementLevel = 'bronze' | 'silver' | 'gold';

export interface AchievementLevelConfig {
  level: AchievementLevel;
  threshold: number;
  reward: {
    type: 'credit';
    amount: number;
  };
  description: string;
}

export interface Achievement {
  id: AchievementId;
  name: string;
  description: string;
  icon: string; // Emoji ou ícone
  isUnique: boolean; // Se true, sempre será ouro quando desbloqueado
  levels?: AchievementLevelConfig[]; // Níveis progressivos (bronze, prata, ouro)
  reward?: {
    type: 'credit';
    amount: number;
  };
  instruction: string; // Instrução de como conquistar
}

export const ACHIEVEMENTS: Record<AchievementId, Achievement> = {
  first_spark: {
    id: 'first_spark',
    name: 'A Faísca Inicial',
    description: 'Gerou sua primeira imagem',
    icon: '✨',
    isUnique: true,
    instruction: 'Gere sua primeira imagem usando o Imagenius',
  },
  visual_alchemist: {
    id: 'visual_alchemist',
    name: 'Alquimista Visual',
    description: 'Usou o Modo Studio com 5 imagens de referência',
    icon: '🧪',
    isUnique: true,
    reward: {
      type: 'credit',
      amount: 1,
    },
    instruction: 'Use o Modo Studio e faça upload de 5 imagens de referência',
  },
  art_director: {
    id: 'art_director',
    name: 'Diretor de Arte',
    description: 'Editou manualmente prompts sugeridos',
    icon: '🎨',
    isUnique: false,
    levels: [
      {
        level: 'bronze',
        threshold: 5,
        reward: { type: 'credit', amount: 1 },
        description: 'Editou 5 prompts sugeridos',
      },
      {
        level: 'silver',
        threshold: 20,
        reward: { type: 'credit', amount: 5 },
        description: 'Editou 20 prompts sugeridos',
      },
      {
        level: 'gold',
        threshold: 50,
        reward: { type: 'credit', amount: 15 },
        description: 'Editou 50 prompts sugeridos',
      },
    ],
    instruction: 'Edite os prompts sugeridos pelo Imagenius antes de gerar as imagens',
  },
  creative_marathon: {
    id: 'creative_marathon',
    name: 'Maratona Criativa',
    description: 'Gerou múltiplas imagens em menos de 24h',
    icon: '🏃',
    isUnique: false,
    levels: [
      {
        level: 'bronze',
        threshold: 10,
        reward: { type: 'credit', amount: 1 },
        description: 'Gerou 10 imagens em menos de 24h',
      },
      {
        level: 'silver',
        threshold: 50,
        reward: { type: 'credit', amount: 5 },
        description: 'Gerou 50 imagens em menos de 24h',
      },
      {
        level: 'gold',
        threshold: 200,
        reward: { type: 'credit', amount: 20 },
        description: 'Gerou 200 imagens em menos de 24h',
      },
    ],
    instruction: 'Gere o máximo de imagens possível em um período de 24 horas',
  },
  art_patron: {
    id: 'art_patron',
    name: 'Mecenas das Artes',
    description: 'Realizou sua primeira compra de créditos',
    icon: '💎',
    isUnique: true,
    instruction: 'Faça sua primeira compra de créditos na loja',
  },
  unlimited_power: {
    id: 'unlimited_power',
    name: 'Poder Ilimitado',
    description: 'Comprou o pacote Master',
    icon: '⚡',
    isUnique: true,
    instruction: 'Compre o pacote Master (400 créditos) na loja',
  },
  ambassador: {
    id: 'ambassador',
    name: 'Embaixador',
    description: 'Convidou pessoas que se cadastraram',
    icon: '🤝',
    isUnique: false,
    levels: [
      {
        level: 'bronze',
        threshold: 1,
        reward: { type: 'credit', amount: 5 },
        description: 'Convidou 1 pessoa que se cadastrou',
      },
      {
        level: 'silver',
        threshold: 5,
        reward: { type: 'credit', amount: 25 },
        description: 'Convidou 5 pessoas que se cadastraram',
      },
      {
        level: 'gold',
        threshold: 20,
        reward: { type: 'credit', amount: 100 },
        description: 'Convidou 20 pessoas que se cadastraram',
      },
    ],
    instruction: 'Compartilhe seu link de referência e ganhe créditos quando alguém se cadastrar',
  },
};

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: AchievementId;
  level: AchievementLevel;
  progress: number; // Progresso atual (ex: 15 de 50 para silver)
  unlocked_at: string;
  reward_claimed?: boolean;
}

export interface AchievementProgress {
  achievementId: AchievementId;
  currentLevel: AchievementLevel | null;
  currentProgress: number;
  nextLevel: AchievementLevelConfig | null;
  isUnlocked: boolean;
}

