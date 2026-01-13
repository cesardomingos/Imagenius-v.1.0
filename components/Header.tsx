
import React from 'react';

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
}

const Header: React.FC<HeaderProps> = ({ onReset, hasImages, goToGallery, credits, onOpenStore, currentUser, onOpenAuth, onLogout }) => {
  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-40">
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
                <span className="text-slate-900">genius</span>
            </h1>
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em] mt-1.5 ml-0.5">
                Generative Atelier
            </span>
          </div>
        </div>

        <nav className="flex items-center gap-4 md:gap-8">
          <div className="hidden lg:block">
             <p className="text-[11px] font-mono-genius text-slate-400">
                <span className="text-indigo-600">I'm</span> a genius, and <span className="text-indigo-600">you</span> are too.
             </p>
          </div>

          {/* Credit Counter */}
          <div 
            onClick={onOpenStore}
            className="flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer hover:border-indigo-200 transition-all group"
          >
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Créditos</span>
              <span className="text-sm font-black text-slate-900">{credits}</span>
            </div>
            <div className="w-8 h-8 bg-genius-gradient rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {hasImages && (
              <button 
                onClick={goToGallery}
                className="text-slate-500 hover:text-indigo-600 font-bold text-xs uppercase tracking-widest transition-colors mr-2"
              >
                Galeria
              </button>
            )}
            
            {/* Auth Button */}
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Usuário</p>
                  <p className="text-xs font-black text-slate-900 truncate max-w-[120px]">{currentUser.email}</p>
                </div>
                <button 
                  onClick={onLogout}
                  className="px-4 py-2 text-slate-600 hover:text-red-600 font-bold text-xs uppercase tracking-widest transition-colors"
                >
                  Sair
                </button>
              </div>
            ) : (
              <button 
                onClick={onOpenAuth}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95"
              >
                Entrar
              </button>
            )}
            
            <button 
              onClick={onReset}
              className="bg-slate-900 hover:bg-indigo-600 text-white px-7 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center gap-2"
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
