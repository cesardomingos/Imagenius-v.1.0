
import React from 'react';
import QuotaDisplay from './QuotaDisplay';

interface HeaderProps {
  onReset: () => void;
  hasImages: boolean;
  goToGallery: () => void;
}

const Header: React.FC<HeaderProps> = ({ onReset, hasImages, goToGallery }) => {
  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-40">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <div className="flex items-center gap-5 cursor-pointer group" onClick={onReset}>
          {/* Símbolo Inovador: Insight Orbit */}
          <div className="relative w-12 h-12 flex items-center justify-center">
            {/* Núcleo (The Spark) */}
            <div className="absolute w-3 h-3 bg-genius-gradient rounded-full shadow-lg z-20 shadow-indigo-500/50"></div>
            
            {/* Órbita 1 */}
            <div className="absolute inset-0 border-[2.5px] border-indigo-600/20 rounded-[40%] animate-orbit-slow group-hover:border-indigo-600/50 transition-colors"></div>
            
            {/* Órbita 2 */}
            <div className="absolute inset-2 border-[2.5px] border-purple-500/20 rounded-[40%] rotate-45 animate-orbit-fast group-hover:border-purple-500/50 transition-colors"></div>
            
            {/* Brilho de fundo */}
            <div className="absolute inset-0 bg-indigo-500/5 blur-xl rounded-full group-hover:bg-indigo-500/10 transition-colors"></div>
          </div>
          
          <div className="flex flex-col">
            <h1 className="font-black text-2xl tracking-tighter leading-none flex items-baseline">
                <span className="text-genius-gradient">Ima</span>
                <span className="text-slate-900">genius</span>
                <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full ml-0.5"></span>
            </h1>
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em] mt-1.5 ml-0.5">
                Generative Atelier
            </span>
          </div>
        </div>

        <nav className="flex items-center gap-8">
          <div className="hidden lg:block">
             <p className="text-[11px] font-mono-genius text-slate-400">
                <span className="text-indigo-600">I'm</span> a genius, and <span className="text-indigo-600">you</span> are too.
             </p>
          </div>
          <div className="flex items-center gap-3">
            <QuotaDisplay />
            {hasImages && (
              <button 
                onClick={goToGallery}
                className="text-slate-500 hover:text-indigo-600 font-bold text-xs uppercase tracking-widest transition-colors mr-2"
              >
                Galeria
              </button>
            )}
            <button 
              onClick={onReset}
              className="bg-slate-900 hover:bg-indigo-600 text-white px-7 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/10 active:scale-95 flex items-center gap-2"
            >
              Novo Setup
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
