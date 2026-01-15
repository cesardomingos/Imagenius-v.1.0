
import React, { useState, useEffect } from 'react';
import { getLeaderboard, LeaderboardEntry, LeaderboardType } from '../services/leaderboardService';
import { GallerySkeleton } from './SkeletonLoader';

interface LeaderboardProps {
  className?: string;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ className = '' }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<LeaderboardType>('images');

  useEffect(() => {
    loadLeaderboard();
  }, [type]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await getLeaderboard(type, 10);
      setEntries(data);
    } catch (error) {
      console.error('Erro ao carregar leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-400 to-yellow-600';
    if (rank === 2) return 'from-slate-300 to-slate-500';
    if (rank === 3) return 'from-amber-600 to-amber-800';
    return 'from-indigo-500 to-purple-500';
  };

  const getTypeLabel = (t: LeaderboardType) => {
    switch (t) {
      case 'images': return 'Mais Imagens';
      case 'likes': return 'Mais Curtidas';
      case 'recent': return 'Mais Recentes';
      default: return 'Mais Ativos';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">
            Ranking de <span className="text-genius-gradient">Gênios</span>
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Os usuários mais ativos da comunidade
          </p>
        </div>
      </div>

      {/* Filtros de Tipo */}
      <div className="flex gap-2 flex-wrap">
        {(['images', 'likes', 'recent'] as LeaderboardType[]).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
              type === t
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            aria-label={`Filtrar por ${getTypeLabel(t)}`}
          >
            {getTypeLabel(t)}
          </button>
        ))}
      </div>

      {/* Lista de Ranking */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700">
          <p className="text-slate-500 dark:text-slate-400">
            Ainda não há dados suficientes para o ranking
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.userId}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                entry.rank <= 3
                  ? `bg-gradient-to-r ${getRankColor(entry.rank)} text-white border-transparent shadow-lg`
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-md'
              }`}
            >
              {/* Rank */}
              <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-black text-lg ${
                entry.rank <= 3
                  ? 'bg-white/20 text-white'
                  : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
              }`}>
                {getRankIcon(entry.rank)}
              </div>

              {/* Avatar */}
              <div className="flex-shrink-0">
                {entry.avatarUrl ? (
                  <img
                    src={entry.avatarUrl}
                    alt={entry.fullName || entry.email}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white/50"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center border-2 border-white/50">
                    <span className={`text-lg font-black ${
                      entry.rank <= 3
                        ? 'text-white'
                        : 'text-indigo-600 dark:text-indigo-400'
                    }`}>
                      {(entry.fullName || entry.email).charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className={`font-black truncate ${
                  entry.rank <= 3 ? 'text-white' : 'text-slate-900 dark:text-white'
                }`}>
                  {entry.fullName || entry.email.split('@')[0]}
                </p>
                <p className={`text-xs truncate ${
                  entry.rank <= 3 ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'
                }`}>
                  {entry.email}
                </p>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-right">
                {type === 'images' && (
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-wider ${
                      entry.rank <= 3 ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      Imagens
                    </p>
                    <p className={`text-lg font-black ${
                      entry.rank <= 3 ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'
                    }`}>
                      {entry.totalImages}
                    </p>
                  </div>
                )}
                {type === 'likes' && (
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-wider ${
                      entry.rank <= 3 ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      Curtidas
                    </p>
                    <p className={`text-lg font-black ${
                      entry.rank <= 3 ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'
                    }`}>
                      {entry.totalLikes}
                    </p>
                  </div>
                )}
                {type === 'recent' && (
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-wider ${
                      entry.rank <= 3 ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      Esta Semana
                    </p>
                    <p className={`text-lg font-black ${
                      entry.rank <= 3 ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'
                    }`}>
                      {entry.totalImages}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default React.memo(Leaderboard);

