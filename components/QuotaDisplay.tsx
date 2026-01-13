import React, { useState, useEffect } from 'react';
import { getQuotaInfo } from '../services/quotaTracker';

interface QuotaDisplayProps {
  className?: string;
}

const QuotaDisplay: React.FC<QuotaDisplayProps> = ({ className = '' }) => {
  const [quotaInfo, setQuotaInfo] = useState(getQuotaInfo());
  const [isExpanded, setIsExpanded] = useState(false);

  // Atualiza a quota a cada segundo para mostrar contagem regressiva
  useEffect(() => {
    const interval = setInterval(() => {
      setQuotaInfo(getQuotaInfo());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const { remainingDaily, usedToday, canMakeRequest, nextAvailableTime } = quotaInfo;
  const totalDaily = 5; // Gemini 2.5 Flash Image free tier limit
  const percentage = (usedToday / totalDaily) * 100;
  
  // Calcula tempo restante até próxima requisição disponível
  let timeUntilNext: string | null = null;
  if (nextAvailableTime) {
    const seconds = Math.ceil((nextAvailableTime - Date.now()) / 1000);
    if (seconds > 0) {
      timeUntilNext = `${seconds}s`;
    }
  }

  // Cor baseado no uso
  const getColorClass = () => {
    if (percentage >= 80) return 'text-red-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-indigo-600';
  };

  const getBgColorClass = () => {
    if (percentage >= 80) return 'bg-red-50 border-red-200';
    if (percentage >= 60) return 'bg-orange-50 border-orange-200';
    return 'bg-indigo-50 border-indigo-200';
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all hover:shadow-sm ${getBgColorClass()}`}
        title="Clique para ver detalhes da quota"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className={`text-xs font-bold ${getColorClass()}`}>
          {remainingDaily}/{totalDaily}
        </span>
        {!canMakeRequest && timeUntilNext && (
          <span className="text-xs text-slate-500">({timeUntilNext})</span>
        )}
      </button>

      {isExpanded && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-50">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Quota Diária</h3>
              <span className={`text-sm font-black ${getColorClass()}`}>
                {usedToday} / {totalDaily}
              </span>
            </div>
            
            {/* Barra de progresso */}
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all ${
                  percentage >= 80 ? 'bg-red-500' :
                  percentage >= 60 ? 'bg-orange-500' : 'bg-indigo-500'
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <div className="flex justify-between">
                <span>Restante hoje:</span>
                <span className="font-bold">{remainingDaily} requisições</span>
              </div>
              {timeUntilNext && (
                <div className="flex justify-between text-orange-600">
                  <span>Próxima requisição em:</span>
                  <span className="font-bold">{timeUntilNext}</span>
                </div>
              )}
              {!canMakeRequest && !timeUntilNext && (
                <div className="text-red-600 font-bold text-center py-1">
                  Quota diária esgotada
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100">
              <p className="text-[10px] text-slate-400 text-center">
                Limite do Free Tier: Gemini 2.5 Flash Image
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotaDisplay;

