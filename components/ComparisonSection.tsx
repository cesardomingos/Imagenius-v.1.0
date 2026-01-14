
import React, { useState } from 'react';

const ComparisonSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'before' | 'after'>('before');

  return (
    <div className="mt-16 space-y-8">
      <div className="text-center space-y-4">
        <h3 className="text-3xl font-black text-slate-900 dark:text-white">
          Por que <span className="text-genius-gradient">Imagenius</span>?
        </h3>
        <p className="text-slate-600 dark:text-slate-400 font-medium max-w-2xl mx-auto">
          Outras ferramentas geram imagens aleatórias. Imagenius mantém a coerência visual perfeita.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Outras Ferramentas */}
        <div className={`p-8 rounded-3xl border-2 transition-all ${
          activeTab === 'before' 
            ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/20' 
            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
        }`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/50 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <h4 className="text-xl font-black text-slate-900 dark:text-white">Outras Ferramentas</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">Resultados inconsistentes</p>
            </div>
          </div>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="text-slate-700 dark:text-slate-300">Estilo muda a cada geração</span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="text-slate-700 dark:text-slate-300">Personagens não mantêm aparência</span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="text-slate-700 dark:text-slate-300">Precisa refazer várias vezes</span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="text-slate-700 dark:text-slate-300">Perda de identidade visual</span>
            </li>
          </ul>
        </div>

        {/* Imagenius */}
        <div className={`p-8 rounded-3xl border-2 transition-all ${
          activeTab === 'after' 
            ? 'border-indigo-200 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-900/20' 
            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
        }`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h4 className="text-xl font-black text-slate-900 dark:text-white">Imagenius</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">Coerência visual garantida</p>
            </div>
          </div>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-slate-700 dark:text-slate-300">Estilo preservado em todas as gerações</span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-slate-700 dark:text-slate-300">Personagens mantêm identidade</span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-slate-700 dark:text-slate-300">Resultado perfeito na primeira tentativa</span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-slate-700 dark:text-slate-300">100% de coerência visual</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="text-center pt-4">
        <p className="text-sm text-slate-500 dark:text-slate-400 italic">
          "A única ferramenta que garante identidade visual consistente em todas as suas criações"
        </p>
      </div>
    </div>
  );
};

export default ComparisonSection;

