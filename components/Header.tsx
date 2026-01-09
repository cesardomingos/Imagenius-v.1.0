
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
        <div className="flex items-center gap-3 cursor-pointer group" onClick={onReset}>
          {/* Custom Symbol: Brain + Shutter (Genius + Image) */}
          <div className="relative w-10 h-10 flex items-center justify-center transition-transform group-hover:scale-110 duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl shadow-lg shadow-indigo-200 rotate-3 group-hover:rotate-6 transition-transform"></div>
            <svg className="w-6 h-6 text-white relative z-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Brain-like outer shape */}
              <path d="M12 2C7.58 2 4 5.58 4 10C4 12.5 5.15 14.73 6.94 16.21C7.6 16.76 8 17.58 8 18.44V20C8 21.1 8.9 22 10 22H14C15.1 22 16 21.1 16 20V18.44C16 17.58 16.4 16.76 17.06 16.21C18.85 14.73 20 12.5 20 10C20 5.58 16.42 2 12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              {/* Camera Shutter Iris in the center */}
              <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 7V10L14.5 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M9.5 8.5L12 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M14.5 8.5L12 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          
          <h1 className="font-black text-2xl tracking-tighter leading-none">
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Ima</span>
            <span className="text-slate-900">genius</span>
          </h1>
        </div>

        <nav className="flex items-center gap-4">
          {hasImages && (
            <button 
              onClick={goToGallery}
              className="text-slate-600 hover:text-indigo-600 font-bold text-sm transition-colors px-3 py-2"
            >
              Galeria
            </button>
          )}
          <button 
            onClick={onReset}
            className="bg-slate-900 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-black transition-all shadow-md active:scale-95"
          >
            Novo Projeto
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
