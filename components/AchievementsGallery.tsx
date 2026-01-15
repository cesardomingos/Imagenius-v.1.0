import React, { useState, useEffect, useCallback } from 'react';
import { AchievementId, Achievement, AchievementLevel, ACHIEVEMENTS, AchievementProgress } from '../types/achievements';
import { getUserAchievements, getAchievementProgress } from '../services/achievementService';

interface AchievementsGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  embedded?: boolean; // Se true, renderiza sem backdrop (dentro de outro componente)
}

const AchievementsGallery: React.FC<AchievementsGalleryProps> = ({ isOpen, onClose, embedded = false }) => {
  const [userAchievements, setUserAchievements] = useState<Map<AchievementId, AchievementLevel>>(new Map());
  const [progressMap, setProgressMap] = useState<Map<AchievementId, AchievementProgress>>(new Map());
  const [loading, setLoading] = useState(true);

  const loadAchievements = useCallback(async () => {
    setLoading(true);
    try {
      const achievements = await getUserAchievements();
      const levelMap = new Map<AchievementId, AchievementLevel>();
      
      achievements.forEach(ach => {
        levelMap.set(ach.achievement_id, ach.level);
      });

      setUserAchievements(levelMap);

      // Carregar progresso de cada achievement
      const progressPromises = Object.keys(ACHIEVEMENTS).map(async (id) => {
        const progress = await getAchievementProgress(id as AchievementId);
        return [id, progress] as [string, AchievementProgress];
      });

      const progressResults = await Promise.all(progressPromises);
      const progressMap = new Map(progressResults);
      setProgressMap(progressMap);
    } catch (error) {
      console.error('Erro ao carregar achievements:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadAchievements();
    }
  }, [isOpen, loadAchievements]);

  const getLevelColor = (level: AchievementLevel | null, isUnlocked: boolean) => {
    if (!isUnlocked) {
      return 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-600';
    }
    
    switch (level) {
      case 'bronze':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700';
      case 'silver':
        return 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600';
      case 'gold':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700';
      default:
        return 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-600';
    }
  };

  const getLevelIcon = (level: AchievementLevel | null, isUnlocked: boolean) => {
    if (!isUnlocked) return '🔒';
    
    switch (level) {
      case 'bronze':
        return '🥉';
      case 'silver':
        return '🥈';
      case 'gold':
        return '🥇';
      default:
        return '🔒';
    }
  };

  const getLevelName = (level: AchievementLevel | null) => {
    switch (level) {
      case 'bronze':
        return 'Bronze';
      case 'silver':
        return 'Prata';
      case 'gold':
        return 'Ouro';
      default:
        return 'Bloqueado';
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`${embedded ? 'relative' : 'fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md'} ${embedded ? '' : 'animate-in fade-in duration-300'} overflow-y-auto`}>
      <div className={`bg-white dark:bg-slate-800 ${embedded ? 'rounded-2xl' : 'rounded-3xl'} max-w-6xl w-full ${embedded ? 'max-h-none' : 'max-h-[90vh]'} overflow-hidden ${embedded ? '' : 'shadow-2xl'} ${embedded ? '' : 'animate-in zoom-in-95 duration-300'} flex flex-col ${embedded ? '' : 'my-8'}`}>
        {/* Header - Only show when not embedded */}
        {!embedded && (
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
            <div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white">Conquistas</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Complete desafios e ganhe créditos bônus
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        {/* Subtitle when embedded */}
        {embedded && (
          <div className="mb-6">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Complete desafios e ganhe créditos bônus. Cada conquista desbloqueada te recompensa com créditos extras!
            </p>
          </div>
        )}

        {/* Content */}
        <div className="flex-grow overflow-auto p-6 md:p-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-indigo-100 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.values(ACHIEVEMENTS).map((achievement) => {
                const userLevel = userAchievements.get(achievement.id);
                const progress = progressMap.get(achievement.id);
                const isUnlocked = userLevel !== undefined;
                const currentLevel = progress?.currentLevel || null;
                const currentProgress = progress?.currentProgress || 0;
                const nextLevel = progress?.nextLevel;

                return (
                  <div
                    key={achievement.id}
                    className={`relative p-6 rounded-2xl border-2 transition-all ${
                      isUnlocked
                        ? getLevelColor(currentLevel, true)
                        : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 opacity-60'
                    }`}
                  >
                    {/* Level Badge */}
                    <div className="absolute top-4 right-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl border-2 ${getLevelColor(currentLevel, isUnlocked)}`}>
                        {getLevelIcon(currentLevel, isUnlocked)}
                      </div>
                    </div>

                    {/* Achievement Icon */}
                    <div className={`text-6xl mb-4 transition-all ${isUnlocked ? 'filter-none scale-100' : 'filter grayscale opacity-30 scale-90'}`}>
                      {achievement.icon}
                    </div>

                    {/* Achievement Info */}
                    <div className="space-y-2">
                      <h3 className="text-xl font-black text-slate-900 dark:text-white">
                        {achievement.name}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {isUnlocked && currentLevel
                          ? achievement.levels?.find(l => l.level === currentLevel)?.description || achievement.description
                          : achievement.description}
                      </p>

                      {/* Level Badge */}
                      {isUnlocked && (
                        <div className="inline-block px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider border-2">
                          <span className={getLevelColor(currentLevel, true)}>
                            {getLevelName(currentLevel)}
                          </span>
                        </div>
                      )}

                      {/* Progress Bar (para achievements progressivos) */}
                      {!achievement.isUnique && nextLevel && (
                        <div className="pt-3 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-600 dark:text-slate-400">
                              Progresso
                            </span>
                            <span className="font-black text-slate-700 dark:text-slate-300">
                              {currentProgress} / {nextLevel.threshold}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${
                                currentLevel === 'bronze'
                                  ? 'bg-amber-500'
                                  : currentLevel === 'silver'
                                  ? 'bg-slate-400'
                                  : 'bg-yellow-500'
                              }`}
                              style={{
                                width: `${Math.min((currentProgress / nextLevel.threshold) * 100, 100)}%`,
                              }}
                            />
                          </div>
                          {nextLevel && (
                            <p className="text-xs text-slate-500 dark:text-slate-500">
                              Próximo nível: {nextLevel.description} (+{nextLevel.reward.amount} créditos)
                            </p>
                          )}
                        </div>
                      )}

                      {/* Instruction */}
                      <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                          💡 {achievement.instruction}
                        </p>
                      </div>

                      {/* Reward Info */}
                      {isUnlocked && currentLevel && (
                        <div className="pt-2">
                          {achievement.isUnique && achievement.reward && (
                            <p className="text-xs font-bold text-green-600 dark:text-green-400">
                              ✓ Recompensa: +{achievement.reward.amount} crédito{achievement.reward.amount > 1 ? 's' : ''}
                            </p>
                          )}
                          {!achievement.isUnique && achievement.levels && (
                            <p className="text-xs font-bold text-green-600 dark:text-green-400">
                              ✓ Recompensa atual: +{achievement.levels.find(l => l.level === currentLevel)?.reward.amount || 0} crédito{achievement.levels.find(l => l.level === currentLevel)?.reward.amount !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AchievementsGallery;

