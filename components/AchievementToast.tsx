import React, { useEffect, useState } from 'react';
import { Achievement, AchievementId, ACHIEVEMENTS, AchievementLevel } from '../types/achievements';

interface AchievementToastProps {
  achievementId: AchievementId;
  level?: AchievementLevel;
  isVisible: boolean;
  onClose: () => void;
}

const AchievementToast: React.FC<AchievementToastProps> = ({ achievementId, level = 'bronze', isVisible, onClose }) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const achievement = ACHIEVEMENTS[achievementId];
  
  const getLevelName = (lvl: AchievementLevel) => {
    switch (lvl) {
      case 'bronze': return 'Bronze';
      case 'silver': return 'Prata';
      case 'gold': return 'Ouro';
    }
  };

  const getLevelEmoji = (lvl: AchievementLevel) => {
    switch (lvl) {
      case 'bronze': return '🥉';
      case 'silver': return '🥈';
      case 'gold': return '🥇';
    }
  };

  const getRewardAmount = () => {
    if (achievement.isUnique && achievement.reward) {
      return achievement.reward.amount;
    }
    if (achievement.levels) {
      const levelConfig = achievement.levels.find(l => l.level === level);
      return levelConfig?.reward.amount || 0;
    }
    return 0;
  };

  useEffect(() => {
    if (isVisible) {
      setShowConfetti(true);
      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible || !achievement) return null;

  return (
    <>
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-[500] overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10px',
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              <span className="text-2xl">
                {['🎉', '✨', '⭐', '🌟', '💫'][Math.floor(Math.random() * 5)]}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Toast Notification */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[400] animate-in slide-in-from-top-5 fade-in duration-500">
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-2xl border-2 border-white/20 backdrop-blur-md p-6 max-w-md w-full mx-4">
          <div className="flex items-start gap-4">
            {/* Achievement Icon */}
            <div className="flex-shrink-0 w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-4xl backdrop-blur-sm">
              {achievement.icon}
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-black text-white">
                  Conquista Desbloqueada!
                </h3>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center hover:bg-white/20 rounded-lg transition-colors text-white/80 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <p className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                {achievement.name}
                <span className="text-2xl">{getLevelEmoji(level)}</span>
                <span className="text-xs font-normal text-white/80">({getLevelName(level)})</span>
              </p>
              <p className="text-sm text-white/90 mb-3">
                {achievement.levels && achievement.levels.find(l => l.level === level)?.description || achievement.description}
              </p>

              {/* Reward Badge */}
              {getRewardAmount() > 0 && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                  <span className="text-sm font-black text-white">
                    +{getRewardAmount()} crédito{getRewardAmount() > 1 ? 's' : ''} cortesia do gênio!
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
      `}</style>
    </>
  );
};

export default AchievementToast;

