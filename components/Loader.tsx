
import React from 'react';

export interface ProgressInfo {
  current: number;
  total: number;
  stage: string;
}

interface LoaderProps {
  message?: string;
  progress?: ProgressInfo;
}

const Loader: React.FC<LoaderProps> = ({ message = 'Iniciando raciocínio...', progress }) => {
  const progressPercentage = progress ? (progress.current / progress.total) * 100 : 0;
  
  return (
    <div className="flex flex-col items-center justify-center py-24 animate-in fade-in duration-1000">
      <div className="relative w-48 h-48 mb-12 flex items-center justify-center">
        {/* Glow Central */}
        <div className="absolute inset-10 bg-indigo-500/20 blur-3xl animate-pulse rounded-full"></div>
        
        {/* Núcleo Pulsante */}
        <div className="absolute w-6 h-6 bg-genius-gradient rounded-full shadow-[0_0_30px_rgba(79,70,229,0.5)] z-20 animate-pulse"></div>
        
        {/* Órbitas de Loading */}
        <div className="absolute inset-0 border-[3px] border-indigo-600/30 rounded-[38%] animate-orbit-slow"></div>
        <div className="absolute inset-4 border-[3px] border-purple-500/20 rounded-[38%] rotate-45 animate-orbit-fast"></div>
        <div className="absolute inset-8 border-[3px] border-pink-500/10 rounded-[38%] -rotate-45 animate-orbit-slow"></div>
        
        {/* Partículas Decorativas */}
        <div className="absolute top-0 left-1/2 w-1.5 h-1.5 bg-indigo-600 rounded-full"></div>
        <div className="absolute bottom-0 left-1/2 w-1.5 h-1.5 bg-pink-500 rounded-full"></div>
      </div>
      
      <div className="text-center space-y-4 w-full max-w-md">
        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
          I'm a genius, and <span className="text-indigo-600 dark:text-indigo-400">you are too.</span>
        </h3>
        <div className="flex items-center justify-center gap-3">
            <span className="w-8 h-[1px] bg-slate-200 dark:bg-slate-700"></span>
            <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">
                {message}
            </p>
            <span className="w-8 h-[1px] bg-slate-200 dark:bg-slate-700"></span>
        </div>
        
        {/* Barra de Progresso */}
        {progress && (
          <div className="space-y-2 mt-6">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-bold">{progress.stage}</span>
              <span className="font-black">{progress.current}/{progress.total}</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-genius-gradient transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Loader;
