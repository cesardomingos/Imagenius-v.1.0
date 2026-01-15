
import React, { useState } from 'react';
import { ImageData } from '../types';

interface EnhanceRestoreUIProps {
  templateId: 'enhance' | 'restore';
  referenceImage: ImageData | null;
  onImageSelect: (image: ImageData | null) => void;
  onGenerate: (options: EnhanceRestoreOptions) => void;
  onBack?: () => void;
}

export interface EnhanceRestoreOptions {
  intensity: 'low' | 'medium' | 'high';
  preserveOriginal: boolean;
  specificEnhancements?: string[];
}

const EnhanceRestoreUI: React.FC<EnhanceRestoreUIProps> = ({
  templateId,
  referenceImage,
  onImageSelect,
  onGenerate,
  onBack
}) => {
  const [intensity, setIntensity] = useState<'low' | 'medium' | 'high'>('medium');
  const [preserveOriginal, setPreserveOriginal] = useState(true);
  const [selectedEnhancements, setSelectedEnhancements] = useState<string[]>([]);

  const isEnhance = templateId === 'enhance';
  
  const enhancementOptions = isEnhance
    ? [
        'Aumentar resolução',
        'Melhorar nitidez',
        'Aprimorar cores',
        'Reduzir ruído',
        'Melhorar contraste',
        'Corrigir exposição'
      ]
    : [
        'Remover arranhões',
        'Corrigir rasgos',
        'Colorizar foto antiga',
        'Remover manchas',
        'Reconstruir partes faltantes',
        'Corrigir desbotamento'
      ];

  const handleEnhancementToggle = (option: string) => {
    setSelectedEnhancements(prev =>
      prev.includes(option)
        ? prev.filter(o => o !== option)
        : [...prev, option]
    );
  };

  const handleGenerate = () => {
    if (!referenceImage) return;
    
    onGenerate({
      intensity,
      preserveOriginal,
      specificEnhancements: selectedEnhancements.length > 0 ? selectedEnhancements : undefined
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {onBack && (
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack} 
            className="w-14 h-14 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 rounded-2xl transition-all border border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <div className="space-y-1">
            <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              {isEnhance ? 'Enhance' : 'Restore'}
            </h2>
            <p className="text-slate-400 dark:text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">
              {isEnhance ? 'Melhore a qualidade da imagem' : 'Restaure imagens antigas ou danificadas'}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload/Preview */}
        <div className="space-y-6">
          <div>
            <label className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-3">
              {isEnhance ? 'Imagem para Melhorar' : 'Imagem para Restaurar'}
            </label>
            {referenceImage ? (
              <div className="relative rounded-2xl overflow-hidden border-2 border-indigo-200 dark:border-indigo-700 shadow-lg">
                <img
                  src={`data:${referenceImage.mimeType};base64,${referenceImage.data}`}
                  alt="Preview"
                  className="w-full h-auto"
                />
                <button
                  onClick={() => onImageSelect(null)}
                  className="absolute top-3 right-3 w-10 h-10 bg-red-500 text-white rounded-xl flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div
                onClick={() => document.getElementById('enhance-restore-upload')?.click()}
                className="border-4 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-12 text-center cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors bg-slate-50 dark:bg-slate-800"
              >
                <svg className="w-16 h-16 text-slate-400 dark:text-slate-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <p className="text-slate-600 dark:text-slate-400 font-bold">
                  Clique para fazer upload
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                  PNG, JPG, JPEG ou WEBP
                </p>
                <input
                  id="enhance-restore-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const result = event.target?.result as string;
                        const base64Data = result.split(',')[1];
                        onImageSelect({ data: base64Data, mimeType: file.type } as ImageData);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Opções */}
        <div className="space-y-6">
          {/* Intensidade */}
          <div>
            <label className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-3">
              Intensidade
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['low', 'medium', 'high'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setIntensity(level)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    intensity === level
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600'
                  }`}
                >
                  <div className="font-black text-sm mb-1">
                    {level === 'low' ? 'Baixa' : level === 'medium' ? 'Média' : 'Alta'}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {level === 'low' ? 'Sutil' : level === 'medium' ? 'Balanceado' : 'Máximo'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Melhorias Específicas */}
          <div>
            <label className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-3">
              {isEnhance ? 'Melhorias Específicas' : 'Correções Específicas'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {enhancementOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => handleEnhancementToggle(option)}
                  className={`p-3 rounded-xl border-2 text-left transition-all text-sm ${
                    selectedEnhancements.includes(option)
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {selectedEnhancements.includes(option) ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <div className="w-5 h-5 border-2 border-current rounded" />
                    )}
                    <span className="font-bold">{option}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Preservar Original */}
          <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <input
              type="checkbox"
              id="preserve-original"
              checked={preserveOriginal}
              onChange={(e) => setPreserveOriginal(e.target.checked)}
              className="w-5 h-5 text-indigo-600 rounded"
            />
            <label htmlFor="preserve-original" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              Preservar estilo original
            </label>
          </div>

          {/* Botão Gerar */}
          <button
            onClick={handleGenerate}
            disabled={!referenceImage}
            className="w-full bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-black py-4 rounded-xl transition-all shadow-lg hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
          >
            <i className={`text-xl ${isEnhance ? 'ri-sparkling-line' : 'ri-tools-line'}`}></i>
            <span>{isEnhance ? 'Melhorar Imagem' : 'Restaurar Imagem'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhanceRestoreUI;

