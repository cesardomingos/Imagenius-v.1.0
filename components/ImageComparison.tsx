
import React, { useState } from 'react';

interface ImageComparisonProps {
  originalUrl: string;
  generatedUrl: string;
  onClose: () => void;
}

const ImageComparison: React.FC<ImageComparisonProps> = ({
  originalUrl,
  generatedUrl,
  onClose
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-6xl w-full border border-slate-200 dark:border-slate-700 animate-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            Comparação: Original vs Gerado
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-500 dark:text-slate-400"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div className="relative w-full aspect-video bg-slate-100 dark:bg-slate-900 rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700">
            {/* Imagem Original (fundo) */}
            <div className="absolute inset-0">
              <img
                src={originalUrl}
                alt="Original"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Imagem Gerada (sobreposta com clip) */}
            <div
              className="absolute inset-0"
              style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
              <img
                src={generatedUrl}
                alt="Gerado"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Slider Control */}
            <div
              className="absolute inset-0 cursor-ew-resize"
              onMouseMove={handleMouseMove}
              onTouchMove={handleTouchMove}
              onMouseDown={(e) => {
                handleMouseMove(e);
                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMouseMove as any);
                  document.removeEventListener('mouseup', handleMouseUp);
                };
                document.addEventListener('mousemove', handleMouseMove as any);
                document.addEventListener('mouseup', handleMouseUp);
              }}
            >
              {/* Linha Divisória */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-white dark:bg-slate-800 shadow-2xl z-10"
                style={{ left: `${sliderPosition}%` }}
              >
                {/* Handle */}
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white dark:bg-slate-800 rounded-full border-4 border-indigo-600 dark:border-indigo-400 shadow-xl flex items-center justify-center cursor-grab active:cursor-grabbing"
                >
                  <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Labels */}
            <div className="absolute top-4 left-4 px-3 py-1 bg-black/70 text-white rounded-lg text-sm font-black">
              Original
            </div>
            <div className="absolute top-4 right-4 px-3 py-1 bg-indigo-600 text-white rounded-lg text-sm font-black">
              Gerado
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              onClick={() => setSliderPosition(0)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm transition-colors"
            >
              Ver Original
            </button>
            <button
              onClick={() => setSliderPosition(50)}
              className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-xl font-bold text-sm transition-colors"
            >
              Comparar
            </button>
            <button
              onClick={() => setSliderPosition(100)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm transition-colors"
            >
              Ver Gerado
            </button>
          </div>

          <p className="text-center mt-4 text-xs text-slate-500 dark:text-slate-400">
            Arraste a linha divisória ou use os botões para comparar as imagens
          </p>
        </div>
      </div>
    </div>
  );
};

export default ImageComparison;

