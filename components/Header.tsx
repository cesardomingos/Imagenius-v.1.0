
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { UserProfile } from '../types';

interface HeaderProps {
  onReset: () => void;
  hasImages: boolean;
  goToGallery: () => void;
  credits: number;
  onOpenStore: () => void;
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenProfile: () => void;
  hasNewAchievement?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onReset, hasImages, goToGallery, credits, onOpenStore, currentUser, onOpenAuth, onLogout, onOpenProfile, hasNewAchievement = false }) => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 sticky top-0 z-40">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <div className="flex items-center gap-5 cursor-pointer group" onClick={onReset}>
          <div className="relative w-12 h-12 flex items-center justify-center">
            <div className="absolute w-3 h-3 bg-genius-gradient rounded-full shadow-lg z-20 shadow-indigo-500/50"></div>
            <div className="absolute inset-0 border-[2.5px] border-indigo-600/20 rounded-[40%] animate-orbit-slow"></div>
            <div className="absolute inset-2 border-[2.5px] border-purple-500/20 rounded-[40%] rotate-45 animate-orbit-fast"></div>
          </div>
          
          <div className="flex flex-col">
            <h1 className="font-black text-2xl tracking-tighter leading-none flex items-baseline">
                <span className="text-genius-gradient">Ima</span>
                <span className="text-slate-900 dark:text-white">genius</span>
            </h1>
            <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] mt-1.5 ml-0.5">
                Generative Atelier
            </span>
          </div>
        </div>

        <nav className="flex items-center gap-4 md:gap-8">
          <div className="hidden lg:block">
             <p className="text-[11px] font-mono-genius text-slate-400 dark:text-slate-500">
                <span className="text-indigo-600 dark:text-indigo-400">I'm</span> a genius, and <span className="text-indigo-600 dark:text-indigo-400">you</span> are too.
             </p>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all"
            title={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
          >
            {theme === 'light' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </button>

          {/* Credit Counter */}
          <div 
            onClick={onOpenStore}
            className="flex items-center gap-3 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-700 transition-all group"
          >
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Créditos</span>
              <span className="text-sm font-black text-slate-900 dark:text-white">{credits}</span>
            </div>
            <div className="w-8 h-8 bg-genius-gradient rounded-xl flex items-center justify-center text-white shadow shadow-indigo-100/50 group-hover:scale-110 transition-transform">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
            </div>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden flex items-center gap-2">
            {hasImages && (
              <button 
                onClick={goToGallery}
                className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold text-xs uppercase tracking-widest transition-colors"
              >
                Galeria
              </button>
            )}
            
            {/* Auth Button Mobile */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenProfile}
                  className="relative px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg hover:border-indigo-200 dark:hover:border-indigo-700 transition-all cursor-pointer"
                >
                  {hasNewAchievement && (
                    <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
                  )}
                  <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Usuário</p>
                  <p className="text-[10px] font-black text-slate-900 dark:text-white truncate max-w-[80px]">{currentUser.email}</p>
                </button>
                <button 
                  onClick={onLogout}
                  className="px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-500 font-bold text-[10px] uppercase tracking-widest transition-colors"
                >
                  Sair
                </button>
              </div>
            ) : (
              <button 
                onClick={onOpenAuth}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest rounded-lg transition-all shadow-lg active:scale-95"
              >
                Entrar
              </button>
            )}
            
            <button 
              onClick={onReset}
              className="bg-slate-900 dark:bg-slate-800 hover:bg-indigo-600 dark:hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center gap-1.5"
            >
              Novo
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
            </button>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-3">
            {hasImages && (
              <button 
                onClick={goToGallery}
                className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold text-xs uppercase tracking-widest transition-colors mr-2"
              >
                Galeria
              </button>
            )}
            
            {/* Auth Button */}
            {currentUser ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={onOpenProfile}
                  className="relative px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-indigo-200 dark:hover:border-indigo-700 transition-all cursor-pointer"
                >
                  {hasNewAchievement && (
                    <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
                  )}
                  <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Usuário</p>
                  <p className="text-xs font-black text-slate-900 dark:text-white truncate max-w-[120px]">{currentUser.email}</p>
                </button>
                <button 
                  onClick={onLogout}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-500 font-bold text-xs uppercase tracking-widest transition-colors"
                >
                  Sair
                </button>
              </div>
            ) : (
              <button 
                onClick={onOpenAuth}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95"
              >
                Entrar
              </button>
            )}
            
            <button 
              onClick={onReset}
              className="bg-slate-900 dark:bg-slate-800 hover:bg-indigo-600 dark:hover:bg-indigo-700 text-white px-7 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center gap-2"
            >
              Novo
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
