
import React, { useState, useEffect, useCallback } from 'react';
import { AppStep, GeneratedImage, PromptSuggestion, ProjectMode, ImageData } from './types';
import { suggestPrompts, generateCoherentImage } from './services/geminiService';
import { CONFIG } from './services/config';
import ImageUploader from './components/ImageUploader';
import PromptEditor from './components/PromptEditor';
import Gallery from './components/Gallery';
import Header from './components/Header';
import Loader from './components/Loader';

// Declaração de tipos globais robusta
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep | 'key_setup'>('key_setup');
  const [projectMode, setProjectMode] = useState<ProjectMode>('single');
  const [referenceImages, setReferenceImages] = useState<ImageData[]>([]);
  const [themes, setThemes] = useState<string[]>(['']);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [suggestions, setSuggestions] = useState<PromptSuggestion[]>([]);

  const checkApiKey = useCallback(async () => {
    try {
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setStep(hasKey ? 'mode_selection' : 'key_setup');
      } else {
        setStep('mode_selection');
      }
    } catch (e) {
      setStep('mode_selection');
    }
  }, []);

  useEffect(() => {
    checkApiKey();
  }, [checkApiKey]);

  const handleOpenKeySelector = async () => {
    if (window.aistudio) {
      try {
        await window.aistudio.openSelectKey();
        setStep('mode_selection');
      } catch (err) {
        console.error("Key selection aborted");
      }
    }
  };

  const handleModeSelection = (mode: ProjectMode) => {
    setProjectMode(mode);
    setReferenceImages([]);
    setStep('upload');
  };

  const handleImageUpload = (base64: string, mimeType: string) => {
    if (projectMode === 'single') {
      setReferenceImages([{ data: base64, mimeType }]);
      setStep('themes');
    } else {
      setReferenceImages(prev => [...prev, { data: base64, mimeType }].slice(0, 5));
    }
  };

  const handleSuggestPrompts = async () => {
    const validThemes = themes.filter(t => t.trim() !== '');
    if (referenceImages.length === 0 || validThemes.length === 0) return;
    
    setIsProcessing(true);
    setLoadingMsg('Analizando coerência com segurança...');
    
    try {
      const result = await suggestPrompts(referenceImages, validThemes);
      setSuggestions(result.map((text, idx) => ({ id: idx, text })));
      setStep('prompts');
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateBatch = async (selectedPrompts: string[]) => {
    if (referenceImages.length === 0 || selectedPrompts.length === 0) return;

    setIsProcessing(true);
    const newResults: GeneratedImage[] = [];
    
    for (let i = 0; i < selectedPrompts.length; i++) {
      setLoadingMsg(`Gerando obra ${i + 1} de ${selectedPrompts.length}...`);
      try {
        const imageUrl = await generateCoherentImage(referenceImages, selectedPrompts[i]);
        if (imageUrl) {
          newResults.push({
            id: Math.random().toString(36).substr(2, 9),
            url: imageUrl,
            prompt: selectedPrompts[i],
            timestamp: Date.now()
          });
        }
      } catch (error) {
        handleApiError(error);
      }
    }

    if (newResults.length > 0) {
      setGeneratedImages(prev => [...newResults, ...prev]);
      setStep('gallery');
    }
    
    setIsProcessing(false);
  };

  const handleApiError = (error: any) => {
    if (error instanceof Error && error.message === "API_KEY_ERROR") {
      alert("Sessão expirada. Reconecte sua chave de acesso.");
      setStep('key_setup');
    } else {
      alert("O serviço está temporariamente indisponível. Verifique sua conexão.");
    }
  };

  const resetApp = () => {
    setReferenceImages([]);
    setThemes(['']);
    setSuggestions([]);
    setStep('mode_selection');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <Header onReset={resetApp} hasImages={generatedImages.length > 0} goToGallery={() => setStep('gallery')} />
      
      <main className="flex-grow container mx-auto px-4 py-8 max-w-4xl">
        {isProcessing && <Loader message={loadingMsg} />}

        {!isProcessing && (
          <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-500/10 border border-slate-200 p-6 md:p-12 transition-all">
            
            {step === 'key_setup' && (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-8 animate-in fade-in duration-700">
                <div className="w-24 h-24 bg-indigo-600 rounded-[2rem] shadow-2xl shadow-indigo-200 flex items-center justify-center rotate-3">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
                  </svg>
                </div>
                <div className="max-w-md px-4">
                  <h2 className="text-4xl font-black text-slate-900 leading-tight">Acesso ao <span className="text-indigo-600">{CONFIG.PRODUCT.NAME}</span></h2>
                  <p className="text-slate-500 mt-4 text-lg font-medium">
                    Utilize uma chave segura do Google AI Studio para começar a criar.
                  </p>
                </div>
                <div className="flex flex-col gap-4 w-full max-w-xs">
                  <button 
                    onClick={handleOpenKeySelector}
                    className="w-full bg-slate-900 hover:bg-indigo-600 text-white font-black py-5 px-8 rounded-2xl transition-all shadow-xl active:scale-95 text-lg"
                  >
                    Conectar com Segurança
                  </button>
                  <a 
                    href={`mailto:${CONFIG.PRODUCT.SUPPORT}`}
                    className="text-xs font-bold text-slate-400 hover:text-indigo-600 underline uppercase tracking-widest"
                  >
                    Suporte Técnico
                  </a>
                </div>
              </div>
            )}

            {step === 'mode_selection' && (
              <div className="space-y-12 animate-in fade-in duration-500">
                <div className="text-center max-w-2xl mx-auto">
                  <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">Seu <span className="text-indigo-600">Espaço Criativo</span></h2>
                  <p className="text-slate-500 mt-4 text-xl font-medium italic">Transformando referências em obras inéditas.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <button 
                    onClick={() => handleModeSelection('single')}
                    className="group relative p-8 rounded-[2.5rem] bg-slate-50 border-2 border-transparent hover:border-indigo-600 transition-all text-left hover:shadow-2xl hover:shadow-indigo-200"
                  >
                    <div className="w-16 h-16 bg-white rounded-3xl shadow-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">Referência Única</h3>
                    <p className="text-slate-500 font-medium">Consistência total a partir de um único elemento.</p>
                  </button>

                  <button 
                    onClick={() => handleModeSelection('studio')}
                    className="group relative p-8 rounded-[2.5rem] bg-slate-900 border-2 border-transparent hover:border-indigo-500 transition-all text-left hover:shadow-2xl hover:shadow-indigo-500/30"
                  >
                    <div className="w-16 h-16 bg-white/10 rounded-3xl shadow-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                    </div>
                    <h3 className="text-2xl font-black text-white mb-2">Estúdio de Fusão</h3>
                    <p className="text-slate-400 font-medium">Mescle até 5 referências com controle total.</p>
                  </button>
                </div>
              </div>
            )}

            {step === 'upload' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-5">
                  <button onClick={() => setStep('mode_selection')} className="w-12 h-12 flex items-center justify-center hover:bg-slate-100 rounded-2xl transition-all border border-slate-100">
                    <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
                  </button>
                  <h2 className="text-3xl font-extrabold text-slate-900">Upload de Referências</h2>
                </div>
                <ImageUploader onUpload={handleImageUpload} />
              </div>
            )}

            {step === 'themes' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-5">
                  <button onClick={() => setStep('upload')} className="w-12 h-12 flex items-center justify-center hover:bg-slate-100 rounded-2xl transition-all border border-slate-100">
                    <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
                  </button>
                  <h2 className="text-3xl font-extrabold text-slate-900">Mapeamento Criativo</h2>
                </div>
                {/* Interface de temas */}
                <div className="space-y-4">
                  {themes.map((theme, idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={theme}
                      onChange={(e) => {
                        const newThemes = [...themes];
                        newThemes[idx] = e.target.value;
                        setThemes(newThemes);
                      }}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold"
                      placeholder="Descreva sua ideia..."
                    />
                  ))}
                  <button onClick={handleSuggestPrompts} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black">
                    Gerar Sugestões Pro
                  </button>
                </div>
              </div>
            )}

            {step === 'prompts' && <PromptEditor suggestions={suggestions} onGenerate={handleGenerateBatch} />}
            {step === 'gallery' && <Gallery images={generatedImages} />}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
