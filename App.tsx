
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
    setLoadingMsg('Imagenius está processando suas ideias...');
    
    try {
      const result = await suggestPrompts(referenceImage.data, referenceImage.mimeType, validThemes);
      setSuggestions(result.map((text, idx) => ({ id: idx, text })));
      setStep('prompts');
    } catch (error) {
      console.error(error);
      alert("Houve um pequeno erro ao processar. Tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateBatch = async (selectedPrompts: string[]) => {
    if (!referenceImage || selectedPrompts.length === 0) return;

    setIsProcessing(true);
    const newResults: GeneratedImage[] = [];
    
    for (let i = 0; i < selectedPrompts.length; i++) {
      setLoadingMsg(`Gerando obra ${i + 1} de ${selectedPrompts.length}...`);
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
      alert("Falha ao gerar as imagens. Tente ajustar seus temas.");
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
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <Header onReset={resetApp} hasImages={generatedImages.length > 0} goToGallery={() => setStep('gallery')} />
      
      <main className="flex-grow container mx-auto px-4 py-8 max-w-4xl">
        {isProcessing && <Loader message={loadingMsg} />}

        {!isProcessing && (
          <div className="bg-white rounded-[2rem] shadow-2xl shadow-indigo-500/5 border border-slate-200 p-6 md:p-12 transition-all">
            {step === 'upload' && (
              <div className="space-y-10">
                <div className="text-center max-w-lg mx-auto">
                  <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Visão <span className="text-indigo-600">Referencial</span></h2>
                  <p className="text-slate-500 mt-4 text-lg font-medium">Envie a imagem que guiará o gênio criativo.</p>
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
                  <div>
                    <h2 className="text-3xl font-extrabold text-slate-900">Mapeamento de Ideias</h2>
                    <p className="text-slate-500 font-medium">Cada ideia resultará em 2 variações inteligentes.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                  {referenceImage && (
                    <div className="md:col-span-4 lg:col-span-3">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Base de Referência</p>
                      <div className="relative group overflow-hidden rounded-3xl border-4 border-white shadow-xl rotate-[-1deg]">
                        <img src={`data:${referenceImage.mimeType};base64,${referenceImage.data}`} alt="Preview" className="w-full h-64 object-cover" />
                      </div>
                    </div>
                  )}
                  
                  <div className="md:col-span-8 lg:col-span-9 space-y-6">
                    <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                       <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></span>
                       Insira suas ideias:
                    </p>
                    <div className="space-y-3">
                      {themes.map((theme, idx) => (
                        <div key={idx} className="flex gap-3 group animate-in slide-in-from-left-4 duration-300" style={{ animationDelay: `${idx * 100}ms` }}>
                          <input
                            type="text"
                            value={theme}
                            onChange={(e) => updateThemeValue(idx, e.target.value)}
                            placeholder={`Explorar ideia ${idx + 1}...`}
                            className="flex-grow p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-black font-bold placeholder:text-slate-400"
                          />
                          <button
                            onClick={() => removeThemeField(idx)}
                            className="p-4 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all group-hover:text-slate-500"
                            title="Descartar"
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={addThemeField}
                      className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-extrabold text-sm px-4 py-2 bg-indigo-50 rounded-xl transition-all w-fit"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
                      Nova Ideia
                    </button>

                    <div className="pt-8 border-t border-slate-100">
                      <button
                        onClick={handleSuggestPrompts}
                        disabled={themes.every(t => t.trim() === '')}
                        className="w-full bg-slate-900 hover:bg-indigo-600 disabled:bg-slate-200 text-white font-black py-5 px-8 rounded-[1.5rem] transition-all shadow-xl active:scale-[0.98] text-lg uppercase tracking-tight"
                      >
                        Sugerir Prompts
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 'prompts' && (
              <div className="space-y-10 animate-in fade-in duration-500">
                <div className="flex items-center gap-5">
                  <button onClick={() => setStep('themes')} className="w-12 h-12 flex items-center justify-center hover:bg-slate-100 rounded-2xl transition-all border border-slate-100">
                    <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
                  </button>
                  <div>
                    <h2 className="text-3xl font-extrabold text-slate-900">Refinamento Imagenius</h2>
                    <p className="text-slate-500 font-medium">Toque nos cards para selecionar os caminhos criativos.</p>
                  </div>
                </div>
                <PromptEditor suggestions={suggestions} onGenerate={handleGenerateBatch} />
              </div>
            )}

            {step === 'gallery' && (
              <div className="space-y-10">
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-4xl font-black text-slate-900">Sua <span className="text-indigo-600">Criação</span></h2>
                    <p className="text-slate-500 font-medium">Resultados exclusivos mantendo a alma da sua referência.</p>
                  </div>
                  <button 
                    onClick={() => setStep('themes')}
                    className="bg-slate-900 text-white hover:bg-indigo-600 px-6 py-3 rounded-2xl font-bold transition-all flex items-center gap-3 shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>
                    Gerar Outras
                  </button>
                </div>
                <Gallery images={generatedImages} />
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-10 mt-10">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
             <div className="w-6 h-6 bg-slate-900 rounded-md flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L14.4 9.2H22L15.8 13.8L18.2 21L12 16.4L5.8 21L8.2 13.8L2 9.2H9.6L12 2Z" /></svg>
             </div>
             <span className="font-extrabold text-slate-900 tracking-tighter">Image<span className="text-indigo-600">nius</span></span>
          </div>
          <p className="text-slate-400 text-sm font-medium">
            Desenvolvido com Inteligência Coerente via Google Gemini &bull; {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
