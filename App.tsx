
import React, { useState } from 'react';
import { AppStep, GeneratedImage, PromptSuggestion } from './types';
import { suggestPrompts, generateCoherentImage } from './services/geminiService';
import ImageUploader from './components/ImageUploader';
import PromptEditor from './components/PromptEditor';
import Gallery from './components/Gallery';
import Header from './components/Header';
import Loader from './components/Loader';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>('upload');
  const [referenceImage, setReferenceImage] = useState<{data: string, mimeType: string} | null>(null);
  const [themes, setThemes] = useState<string[]>(['']);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [suggestions, setSuggestions] = useState<PromptSuggestion[]>([]);

  const handleImageUpload = (base64: string, mimeType: string) => {
    setReferenceImage({ data: base64, mimeType });
    setStep('themes');
  };

  const addThemeField = () => {
    setThemes([...themes, '']);
  };

  const removeThemeField = (index: number) => {
    if (themes.length > 1) {
      setThemes(themes.filter((_, i) => i !== index));
    } else {
      setThemes(['']);
    }
  };

  const updateThemeValue = (index: number, value: string) => {
    const newThemes = [...themes];
    newThemes[index] = value;
    setThemes(newThemes);
  };

  const handleSuggestPrompts = async () => {
    const validThemes = themes.filter(t => t.trim() !== '');
    if (!referenceImage || validThemes.length === 0) return;
    
    setIsProcessing(true);
    setLoadingMsg('Analisando imagem e gerando variações para cada ideia...');
    
    try {
      const result = await suggestPrompts(referenceImage.data, referenceImage.mimeType, validThemes);
      setSuggestions(result.map((text, idx) => ({ id: idx, text })));
      setStep('prompts');
    } catch (error) {
      console.error(error);
      alert("Erro ao sugerir prompts. Tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateBatch = async (selectedPrompts: string[]) => {
    if (!referenceImage || selectedPrompts.length === 0) return;

    setIsProcessing(true);
    const newResults: GeneratedImage[] = [];
    
    for (let i = 0; i < selectedPrompts.length; i++) {
      setLoadingMsg(`Gerando imagem ${i + 1} de ${selectedPrompts.length}...`);
      try {
        const imageUrl = await generateCoherentImage(referenceImage.data, referenceImage.mimeType, selectedPrompts[i]);
        if (imageUrl) {
          newResults.push({
            id: (Date.now() + i).toString(),
            url: imageUrl,
            prompt: selectedPrompts[i],
            timestamp: Date.now()
          });
        }
      } catch (error) {
        console.error(`Erro na geração ${i}:`, error);
      }
    }

    if (newResults.length > 0) {
      setGeneratedImages(prev => [...newResults, ...prev]);
      setStep('gallery');
    } else {
      alert("Falha ao gerar as imagens. Tente refinar seus prompts.");
    }
    
    setIsProcessing(false);
  };

  const resetApp = () => {
    setReferenceImage(null);
    setThemes(['']);
    setSuggestions([]);
    setStep('upload');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-black">
      <Header onReset={resetApp} hasImages={generatedImages.length > 0} goToGallery={() => setStep('gallery')} />
      
      <main className="flex-grow container mx-auto px-4 py-8 max-w-4xl">
        {isProcessing && <Loader message={loadingMsg} />}

        {!isProcessing && (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 md:p-10 transition-all">
            {step === 'upload' && (
              <div className="space-y-8">
                <div className="text-center max-w-lg mx-auto">
                  <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Comece com uma Referência</h2>
                  <p className="text-slate-500 mt-3 text-lg">Faça o upload de uma imagem para manter o estilo e a coerência visual.</p>
                </div>
                <ImageUploader onUpload={handleImageUpload} />
              </div>
            )}

            {step === 'themes' && (
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <button onClick={() => setStep('upload')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
                  </button>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">Suas Ideias</h2>
                    <p className="text-slate-500">Liste os temas ou conceitos que deseja explorar.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {referenceImage && (
                    <div className="md:col-span-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Imagem Base</p>
                      <div className="relative group overflow-hidden rounded-2xl border border-slate-200 shadow-md">
                        <img src={`data:${referenceImage.mimeType};base64,${referenceImage.data}`} alt="Preview" className="w-full h-56 object-cover" />
                      </div>
                    </div>
                  )}
                  
                  <div className="md:col-span-2 space-y-4">
                    <p className="text-sm font-semibold text-slate-700">Ideias e Temas:</p>
                    <div className="space-y-3">
                      {themes.map((theme, idx) => (
                        <div key={idx} className="flex gap-2 animate-in slide-in-from-left-2 duration-200">
                          <input
                            type="text"
                            value={theme}
                            onChange={(e) => updateThemeValue(idx, e.target.value)}
                            placeholder={`Ex: Ideia ${idx + 1}...`}
                            className="flex-grow p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-black font-medium"
                          />
                          <button
                            onClick={() => removeThemeField(idx)}
                            className="p-4 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-colors"
                            title="Remover"
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={addThemeField}
                      className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-bold text-sm px-2 py-1 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                      Adicionar outra ideia
                    </button>

                    <div className="pt-6">
                      <button
                        onClick={handleSuggestPrompts}
                        disabled={themes.every(t => t.trim() === '')}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg active:scale-[0.98]"
                      >
                        Gerar 2 Prompts por Ideia
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 'prompts' && (
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <button onClick={() => setStep('themes')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
                  </button>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">Selecione para Criar</h2>
                    <p className="text-slate-500">Clique nos cards para selecionar quais imagens deseja gerar.</p>
                  </div>
                </div>
                <PromptEditor suggestions={suggestions} onGenerate={handleGenerateBatch} />
              </div>
            )}

            {step === 'gallery' && (
              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">Galeria Coerente</h2>
                    <p className="text-slate-500">Resultados baseados na sua imagem de referência.</p>
                  </div>
                  <button 
                    onClick={() => setStep('themes')}
                    className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-5 py-2 rounded-xl font-bold transition-all flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                    Novas Ideias
                  </button>
                </div>
                <Gallery images={generatedImages} />
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="container mx-auto px-4 text-center text-slate-400 text-sm">
          Coherent AI Tool • Criado com Google Gemini • {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
};

export default App;
