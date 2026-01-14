
import React, { useState, useEffect } from 'react';
import { getPromptHistory, deletePromptFromHistory, PromptHistoryItem } from '../services/promptHistoryService';

interface PromptHistoryProps {
  onSelectPrompt: (prompt: string) => void;
  templateId?: string;
  isOpen: boolean;
  onClose: () => void;
}

const PromptHistory: React.FC<PromptHistoryProps> = ({ 
  onSelectPrompt, 
  templateId,
  isOpen,
  onClose 
}) => {
  const [prompts, setPrompts] = useState<PromptHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, templateId]);

  const loadHistory = async () => {
    setIsLoading(true);
    setError(null);
    
    const result = await getPromptHistory(50, templateId);
    
    if (result.success && result.prompts) {
      setPrompts(result.prompts);
    } else {
      setError(result.error || 'Erro ao carregar histórico');
    }
    
    setIsLoading(false);
  };

  const handleSelect = (prompt: string) => {
    onSelectPrompt(prompt);
    onClose();
  };

  const handleDelete = async (e: React.MouseEvent, promptId: string) => {
    e.stopPropagation();
    
    const result = await deletePromptFromHistory(promptId);
    if (result.success) {
      setPrompts(prev => prev.filter(p => p.id !== promptId));
    } else {
      setError(result.error || 'Erro ao deletar prompt');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-700 animate-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            Histórico de Prompts
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

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 dark:text-red-400 font-bold">{error}</p>
              <button
                onClick={loadHistory}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          ) : prompts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 dark:text-slate-400 font-bold">
                Nenhum prompt no histórico ainda.
              </p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
                Os prompts que você usar serão salvos aqui para reutilização.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {prompts.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item.prompt)}
                  className="group relative p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600 hover:border-indigo-500 dark:hover:border-indigo-400 hover:shadow-lg cursor-pointer transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <p className="flex-1 text-slate-700 dark:text-slate-300 italic leading-relaxed">
                      "{item.prompt}"
                    </p>
                    <button
                      onClick={(e) => handleDelete(e, item.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all text-red-600 dark:text-red-400"
                      title="Deletar"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
                    <span>{new Date(item.createdAt).toLocaleDateString('pt-BR')}</span>
                    {item.templateId && (
                      <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full">
                        {item.templateId}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-black rounded-xl transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromptHistory;

