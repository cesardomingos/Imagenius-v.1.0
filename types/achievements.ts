export type AchievementId = 
  | 'first_spark'
  | 'visual_alchemist'
  | 'art_director'
  | 'creative_marathon'
  | 'art_patron'
  | 'unlimited_power'
  | 'ambassador';

export interface Achievement {
  id: AchievementId;
  name: string;
  description: string;
  icon: string; // Emoji ou ícone
  reward?: {
    type: 'credit';
    amount: number;
  };
}

export const ACHIEVEMENTS: Record<AchievementId, Achievement> = {
  first_spark: {
    id: 'first_spark',
    name: 'A Faísca Inicial',
    description: 'Gerou sua primeira imagem',
    icon: '✨',
  },
  visual_alchemist: {
    id: 'visual_alchemist',
    name: 'Alquimista Visual',
    description: 'Usou o Modo Studio com 5 imagens de referência',
    icon: '🧪',
    reward: {
      type: 'credit',
      amount: 1,
    },
  },
  art_director: {
    id: 'art_director',
    name: 'Diretor de Arte',
    description: 'Editou manualmente 5 prompts sugeridos',
    icon: '🎨',
  },
  creative_marathon: {
    id: 'creative_marathon',
    name: 'Maratona Criativa',
    description: 'Gerou 10 imagens em menos de 24h',
    icon: '🏃',
  },
  art_patron: {
    id: 'art_patron',
    name: 'Mecenas das Artes',
    description: 'Realizou sua primeira compra de créditos',
    icon: '💎',
  },
  unlimited_power: {
    id: 'unlimited_power',
    name: 'Poder Ilimitado',
    description: 'Comprou o pacote Master',
    icon: '⚡',
  },
  ambassador: {
    id: 'ambassador',
    name: 'Embaixador',
    description: 'Convidou alguém que se cadastrou',
    icon: '🤝',
    reward: {
      type: 'credit',
      amount: 5,
    },
  },
};

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: AchievementId;
  unlocked_at: string;
  reward_claimed?: boolean;
}

