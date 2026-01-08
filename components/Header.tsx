
import React from 'react';

interface HeaderProps {
  onReset: () => void;
  hasImages: boolean;
  goToGallery: () => void;
}

const Header: React.FC<HeaderProps> = ({ onReset, hasImages, goToGallery }) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={onReset}>
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </div>
          <h1 className="font-bold text-xl text-slate-800 hidden sm:block">Coherent AI</h1>
        </div>

        <nav className="flex items-center gap-4">
          {hasImages && (
            <button 
              onClick={goToGallery}
              className="text-slate-600 hover:text-indigo-600 font-medium transition-colors"
            >
              Ver Galeria
            </button>
          )}
          <button 
            onClick={onReset}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium transition-all"
          >
            Novo Projeto
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
