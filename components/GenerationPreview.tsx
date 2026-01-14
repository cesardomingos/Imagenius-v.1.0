
import React from 'react';
import { ImageData } from '../types';

interface GenerationPreviewProps {
  referenceImages: ImageData[];
  prompt: string;
  mode: 'single' | 'studio';
  onConfirm: () => void;
  onAdjust: () => void;
}

const GenerationPreview: React.FC<GenerationPreviewProps> = ({
  referenceImages,
  prompt,
  mode,
  onConfirm,
  onAdjust
}) => {
  const mainImage = referenceImages[0];

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h3 className="text-3xl font-black text-slate-900 dark:text-white">
          Preview da Geração
        </h3>
        <p className="text-slate-500 dark:text-slate-400 font-medium">
          Veja como ficará sua criação antes de gerar
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Imagem de Referência */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center">
              <span className="text-xl">🧬</span>
            </div>
            <div>
              <h4 className="font-black text-slate-900 dark:text-white">Referência</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {mode === 'single' ? 'Imagem Âncora' : 'Estilo Principal'}
              </p>
            </div>
          </div>
          <div className="relative rounded-2xl overflow-hidden border-2 border-indigo-200 dark:border-indigo-700 shadow-lg">
            <img
              src={`data:${mainImage.mimeType};base64,${mainImage.data}`}
              alt="Referência"
              className="w-full h-auto"
            />
          </div>
        </div>

        {/* Preview Simulado */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center">
              <span className="text-xl">✨</span>
            </div>
            <div>
              <h4 className="font-black text-slate-900 dark:text-white">Resultado Esperado</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Aplicando: {prompt.substring(0, 50)}...
              </p>
            </div>
          </div>
          <div className="relative rounded-2xl overflow-hidden border-2 border-green-200 dark:border-green-700 shadow-lg">
            <img
              src={`data:${mainImage.mimeType};base64,${mainImage.data}`}
              alt="Preview"
              className="w-full h-auto opacity-90"
            />
            {/* Overlay simulando o resultado */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 pointer-events-none" />
            <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-sm rounded-xl p-3">
              <p className="text-white text-xs font-bold italic line-clamp-2">
                "{prompt}"
              </p>
            </div>
            <div className="absolute top-4 right-4 bg-indigo-600 text-white text-xs font-black px-3 py-1 rounded-lg">
              PREVIEW
            </div>
          </div>
        </div>
      </div>

      {/* Prompt */}
      <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
        <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-3">
          Prompt que será aplicado
        </label>
        <p className="text-slate-800 dark:text-slate-200 font-medium italic leading-relaxed">
          "{prompt}"
        </p>
      </div>

      {/* Ações */}
      <div className="flex items-center justify-center gap-4 pt-4">
        <button
          onClick={onAdjust}
          className="px-6 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-all"
        >
          Ajustar Prompt
        </button>
        <button
          onClick={onConfirm}
          className="px-8 py-3 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white font-black rounded-xl transition-all shadow-lg hover:scale-105 active:scale-95"
        >
          Gerar Agora
        </button>
      </div>
    </div>
  );
};

export default GenerationPreview;

