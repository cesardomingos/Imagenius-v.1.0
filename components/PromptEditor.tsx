
import React, { useState } from 'react';
import { PromptSuggestion } from '../types';

interface PromptEditorProps {
  suggestions: PromptSuggestion[];
  onGenerate: (prompts: string[]) => void;
}

const MAX_PROMPT_LENGTH = 1000;

const PromptEditor: React.FC<PromptEditorProps> = ({ suggestions, onGenerate }) => {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [editedPrompts, setEditedPrompts] = useState<Record<number, string>>(
    suggestions.reduce((acc, s) => ({ ...acc, [s.id]: s.text }), {})
  );

  const toggleSelection = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleEdit = (id: number, text: string) => {
    // Limite de segurança para o tamanho do prompt
    if (text.length <= MAX_PROMPT_LENGTH) {
      setEditedPrompts(prev => ({ ...prev, [id]: text }));
    }
  };

  const handleGenerateClick = () => {
    const promptsToGenerate = selectedIds.map(id => editedPrompts[id]);
    onGenerate(promptsToGenerate);
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {suggestions.map((s) => {
          const isSelected = selectedIds.includes(s.id);
          const currentLength = editedPrompts[s.id].length;
          
          return (
            <div 
              key={s.id}
              onClick={() => toggleSelection(s.id)}
              className={`group relative p-8 rounded-[2rem] border-2 transition-all duration-300 flex flex-col cursor-pointer ${
                isSelected 
                  ? 'border-indigo-600 bg-indigo-50/50 shadow-2xl shadow-indigo-200 ring-4 ring-indigo-50' 
                  : 'border-slate-100 hover:border-indigo-200 bg-white hover:shadow-xl'
              }`}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 flex items-center justify-center rounded-xl text-xs font-black ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {s.id + 1}
                    </span>
                    <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`}>
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

              <div className="relative">
                <textarea
                  value={editedPrompts[s.id]}
                  onClick={(e) => e.stopPropagation()} 
                  onChange={(e) => handleEdit(s.id, e.target.value)}
                  className={`w-full p-5 text-sm leading-relaxed rounded-2xl outline-none transition-all min-h-[140px] resize-none font-bold ${
                    isSelected 
                      ? 'bg-white border border-indigo-200 text-black shadow-inner' 
                      : 'bg-slate-50 border border-transparent text-slate-900 focus:bg-white focus:border-indigo-100'
                  }`}
                  placeholder="Ajuste os detalhes se preferir..."
                />
                <div className={`absolute bottom-3 right-3 text-[9px] font-black ${currentLength > MAX_PROMPT_LENGTH * 0.9 ? 'text-red-500' : 'text-slate-300'}`}>
                  {currentLength}/{MAX_PROMPT_LENGTH}
                </div>
              </div>
              
              <div className="mt-5 flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-indigo-600' : 'text-slate-300'}`}>
                    {isSelected ? '✓ Selecionado' : 'Pronto para criar'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-6 left-0 right-0 pt-8 z-20">
        <button
          onClick={handleGenerateClick}
          disabled={selectedIds.length === 0}
          className="w-full bg-slate-900 hover:bg-indigo-600 disabled:bg-slate-200 disabled:shadow-none text-white font-black py-6 px-10 rounded-[1.75rem] transition-all shadow-2xl flex items-center justify-center gap-6 transform active:scale-[0.98] group"
        >
          <span className="text-xl tracking-tight">
            {selectedIds.length === 0 ? 'Escolha sua direção' : (selectedIds.length === 1 ? 'Gerar Selecionada' : `Materializar ${selectedIds.length} Obras`)}
          </span>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default PromptEditor;
