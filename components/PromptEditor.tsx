
import React, { useState } from 'react';
import { PromptSuggestion } from '../types';

interface PromptEditorProps {
  suggestions: PromptSuggestion[];
  onGenerate: (prompts: string[]) => void;
}

const PromptEditor: React.FC<PromptEditorProps> = ({ suggestions, onGenerate }) => {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  // Store custom edits for each suggestion
  const [editedPrompts, setEditedPrompts] = useState<Record<number, string>>(
    suggestions.reduce((acc, s) => ({ ...acc, [s.id]: s.text }), {})
  );

  const toggleSelection = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleEdit = (id: number, text: string) => {
    setEditedPrompts(prev => ({ ...prev, [id]: text }));
  };

  const handleGenerateClick = () => {
    const promptsToGenerate = selectedIds.map(id => editedPrompts[id]);
    onGenerate(promptsToGenerate);
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {suggestions.map((s) => {
          const isSelected = selectedIds.includes(s.id);
          return (
            <div 
              key={s.id}
              onClick={() => toggleSelection(s.id)}
              className={`group relative p-6 rounded-3xl border-2 transition-all duration-300 flex flex-col cursor-pointer ${
                isSelected 
                  ? 'border-indigo-600 bg-indigo-50 shadow-md ring-4 ring-indigo-50' 
                  : 'border-slate-100 hover:border-slate-200 bg-white hover:shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className={`text-xs font-black uppercase tracking-widest ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`}>
                  Sugestão #{s.id + 1}
                </span>
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isSelected ? 'bg-indigo-600 text-white scale-110 shadow-lg' : 'bg-slate-100 text-slate-300 group-hover:bg-slate-200'
                  }`}
                >
                  {isSelected ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                  )}
                </div>
              </div>

              <textarea
                value={editedPrompts[s.id]}
                onClick={(e) => e.stopPropagation()} // Permite clicar no textarea sem desmarcar o card
                onChange={(e) => handleEdit(s.id, e.target.value)}
                className={`w-full p-4 text-sm rounded-xl outline-none transition-colors min-h-[120px] resize-none font-medium ${
                  isSelected 
                    ? 'bg-white border border-indigo-200 text-black' 
                    : 'bg-slate-50 border border-transparent text-slate-900 focus:bg-white focus:border-slate-200'
                }`}
                placeholder="Edite o prompt se desejar..."
              />
              
              <p className="mt-3 text-[11px] font-bold uppercase tracking-tight">
                {isSelected ? (
                  <span className="text-indigo-600">✓ Selecionado</span>
                ) : (
                  <span className="text-slate-400 group-hover:text-slate-500">Clique para selecionar</span>
                )}
              </p>
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-4 left-0 right-0 pt-6">
        <button
          onClick={handleGenerateClick}
          disabled={selectedIds.length === 0}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:shadow-none text-white font-black py-5 px-8 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-4 transform active:scale-[0.98]"
        >
          <div className="flex items-center justify-center bg-white/20 w-8 h-8 rounded-lg">
            <span className="text-white text-lg">{selectedIds.length}</span>
          </div>
          <span className="text-lg">
            {selectedIds.length === 0 ? 'Selecione pelo menos um' : (selectedIds.length === 1 ? 'Gerar Imagem Selecionada' : `Gerar ${selectedIds.length} Imagens em Lote`)}
          </span>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default PromptEditor;
