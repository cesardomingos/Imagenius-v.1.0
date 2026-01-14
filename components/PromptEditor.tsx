
import React, { useState } from 'react';
import { PromptSuggestion } from '../types';
import Tooltip from './Tooltip';

interface PromptEditorProps {
  suggestions: PromptSuggestion[];
  onGenerate: (prompts: string[]) => void;
  credits?: number;
  onPromptEdit?: (editedCount: number) => void;
}

const PromptEditor: React.FC<PromptEditorProps> = ({ suggestions, onGenerate, credits = 0, onPromptEdit }) => {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  // Store custom edits for each suggestion
  const [editedPrompts, setEditedPrompts] = useState<Record<number, string>>(
    suggestions.reduce((acc, s) => ({ ...acc, [s.id]: s.text }), {})
  );
  
  // Track edited prompts count
  const [editedCount, setEditedCount] = useState(0);

  const toggleSelection = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleEdit = (id: number, text: string) => {
    const originalText = suggestions.find(s => s.id === id)?.text || '';
    const isEdited = text.trim() !== originalText.trim();
    
    setEditedPrompts(prev => {
      const newPrompts = { ...prev, [id]: text };
      
      // Count how many prompts have been edited
      const edited = Object.entries(newPrompts).filter(([key, value]) => {
        const original = suggestions.find(s => s.id === parseInt(key))?.text || '';
        return value.trim() !== original.trim();
      }).length;
      
      setEditedCount(edited);
      if (onPromptEdit) {
        onPromptEdit(edited);
      }
      
      return newPrompts;
    });
  };

  const handleGenerateClick = () => {
    const promptsToGenerate = selectedIds.map(id => editedPrompts[id]);
    onGenerate(promptsToGenerate);
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {suggestions.map((s) => {
          const isSelected = selectedIds.includes(s.id);
          return (
            <div 
              key={s.id}
              onClick={() => toggleSelection(s.id)}
              className={`group relative p-8 rounded-[2rem] border-2 transition-all duration-300 flex flex-col cursor-pointer ${
                isSelected 
                  ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/30 shadow-2xl shadow-indigo-200 dark:shadow-indigo-900/30 ring-4 ring-indigo-50 dark:ring-indigo-900/20' 
                  : 'border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-600 bg-white dark:bg-slate-800 hover:shadow-xl'
              }`}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 flex items-center justify-center rounded-xl text-xs font-black ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {s.id + 1}
                    </span>
                    <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
                    Exploração Inteligente
                    </span>
                </div>
                <div 
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                    isSelected ? 'bg-indigo-600 text-white scale-110 shadow-lg' : 'bg-slate-50 text-slate-300 group-hover:bg-indigo-100 group-hover:text-indigo-500'
                  }`}
                >
                  {isSelected ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>
                  )}
                </div>
              </div>

              <textarea
                value={editedPrompts[s.id]}
                onClick={(e) => e.stopPropagation()} 
                onChange={(e) => handleEdit(s.id, e.target.value)}
                className={`w-full p-5 text-sm leading-relaxed rounded-2xl outline-none transition-all min-h-[140px] resize-none font-bold ${
                  isSelected 
                    ? 'bg-white dark:bg-slate-700 border border-indigo-200 dark:border-indigo-700 text-black dark:text-white shadow-inner' 
                    : 'bg-slate-50 dark:bg-slate-900/50 border border-transparent text-slate-900 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-700 focus:border-indigo-100 dark:focus:border-indigo-700'
                }`}
                placeholder="Ajuste os detalhes se preferir..."
              />
              
              <div className="mt-5 flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-300 dark:text-slate-600'}`}>
                    {isSelected ? '✓ Selecionado' : 'Pronto para criar'}
                </span>
                {!isSelected && (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity font-bold">Clique para adicionar</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-6 left-0 right-0 pt-8 z-20">
        <div className="bg-white dark:bg-slate-800 rounded-[1.75rem] p-2 shadow-2xl border-2 border-slate-100 dark:border-slate-700">
          {/* Informação de créditos */}
          {selectedIds.length > 0 && (
            <div className="px-6 py-3 mb-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl border border-indigo-100 dark:border-indigo-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-black text-indigo-900 dark:text-indigo-200 uppercase tracking-wider">
                      Créditos a gastar
                    </p>
                    <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                      {selectedIds.length} {selectedIds.length === 1 ? 'crédito' : 'créditos'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Disponível
                  </p>
                  <p className={`text-lg font-black ${credits >= selectedIds.length ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {credits} {credits === 1 ? 'crédito' : 'créditos'}
                  </p>
                </div>
              </div>
              {credits < selectedIds.length && (
                <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-800">
                  <p className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Você precisa de mais {selectedIds.length - credits} {selectedIds.length - credits === 1 ? 'crédito' : 'créditos'}
                  </p>
                </div>
              )}
            </div>
          )}
          
          <button
            onClick={handleGenerateClick}
            disabled={selectedIds.length === 0 || credits < selectedIds.length}
            className="w-full bg-slate-900 dark:bg-slate-800 hover:bg-indigo-600 dark:hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:cursor-not-allowed disabled:text-slate-400 dark:disabled:text-slate-500 text-white font-black py-6 px-10 rounded-[1.5rem] transition-all shadow-xl flex items-center justify-center gap-6 transform active:scale-[0.98] group"
          >
            <div className="flex items-center justify-center bg-white/10 w-10 h-10 rounded-xl group-hover:bg-white/20 transition-colors">
              <span className="text-white text-xl">{selectedIds.length}</span>
            </div>
            <div className="flex-1 text-left">
              <span className="text-xl tracking-tight block">
                {selectedIds.length === 0 
                  ? 'Escolha sua direção' 
                  : selectedIds.length === 1 
                    ? 'Materializar Obra' 
                    : `Materializar ${selectedIds.length} Obras`}
              </span>
              {selectedIds.length > 0 && (
                <span className="text-xs font-bold text-white/70 uppercase tracking-wider block mt-1">
                  {selectedIds.length} {selectedIds.length === 1 ? 'crédito será gasto' : 'créditos serão gastos'}
                </span>
              )}
            </div>
            <svg className="w-6 h-6 animate-bounce-x" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromptEditor;
