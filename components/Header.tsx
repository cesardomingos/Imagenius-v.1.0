
import React from 'react';

interface HeaderProps {
  onReset: () => void;
  hasImages: boolean;
  goToGallery: () => void;
}

const Header: React.FC<HeaderProps> = ({ onReset, hasImages, goToGallery }) => {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5 cursor-pointer group" onClick={onReset}>
          <div className="relative w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105">
             <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 opacity-50"></div>
             <svg className="w-5 h-5 text-white relative z-10" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L14.4 9.2H22L15.8 13.8L18.2 21L12 16.4L5.8 21L8.2 13.8L2 9.2H9.6L12 2Z" />
             </svg>
          </div>
          <h1 className="font-extrabold text-2xl tracking-tighter text-slate-900">
            Image<span className="text-indigo-600">nius</span>
          </h1>
        </div>

        <nav className="flex items-center gap-4">
          {hasImages && (
            <button 
              onClick={goToGallery}
              className="text-slate-600 hover:text-indigo-600 font-semibold text-sm transition-colors"
            >
              Galeria
            </button>
          )}
          <button 
            onClick={onReset}
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-2 rounded-xl text-sm font-bold transition-all border border-indigo-100"
          >
            Novo Início
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
