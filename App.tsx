
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
  const [themes, setThemes] = useState<string[]>([]);
  const [currentThemeInput, setCurrentThemeInput] = useState('');
  const [suggestions, setSuggestions] = useState<PromptSuggestion[]>([]);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');

  const handleImageUpload = (base64: string, mimeType: string) => {
    setReferenceImage({ data: base64, mimeType });
    setStep('themes');
  };

  const addTheme = () => {
    if (currentThemeInput.trim() && !themes.includes(currentThemeInput.trim())) {
      setThemes([...themes, currentThemeInput.trim()]);
      setCurrentThemeInput('');
    }
  };

  const removeTheme = (index: number) => {
    setThemes(themes.filter((_, i) => i !== index));
  };

  const handleSuggestPrompts = async () => {
    if (!referenceImage || themes.length === 0) return;
    
    setIsProcessing(true);
    setLoadingMsg('Analisando imagem e cruzando temas...');
    
    try {
      const result = await suggestPrompts(referenceImage.data, referenceImage.mimeType, themes);
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
    setThemes([]);
    setSuggestions([]);
    setStep('upload');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
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
                    <h2 className="text-2xl font-bold text-slate-800">Defina os Temas</h2>
                    <p className="text-slate-500">Adicione conceitos, climas ou elementos que deseja ver.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {referenceImage && (
                    <div className="md:col-span-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Imagem Base</p>
                      <div className="relative group overflow-hidden rounded-2xl border-4 border-white shadow-lg">
                        <img src={`data:${referenceImage.mimeType};base64,${referenceImage.data}`} alt="Preview" className="w-full h-56 object-cover" />
                      </div>
                    </div>
                  )}
                  
                  <div className="md:col-span-2 space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Adicionar Novo Tema</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={currentThemeInput}
                          onChange={(e) => setCurrentThemeInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addTheme()}
                          placeholder="Ex: Cyberpunk, Neve, Estilo Picasso..."
                          className="flex-grow p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        />
                        <button
                          onClick={addTheme}
                          className="bg-indigo-600 text-white px-6 rounded-2xl hover:bg-indigo-700 font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="min-h-[100px] p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                      <p className="text-xs font-semibold text-slate-400 uppercase mb-3">Temas Selecionados</p>
                      <div className="flex flex-wrap gap-2">
                        {themes.length === 0 && <span className="text-slate-400 italic text-sm">Nenhum tema adicionado ainda...</span>}
                        {themes.map((theme, idx) => (
                          <div key={idx} className="bg-white border border-slate-200 px-4 py-2 rounded-full flex items-center gap-2 shadow-sm animate-in zoom-in duration-200">
                            <span className="text-slate-700 font-medium">{theme}</span>
                            <button onClick={() => removeTheme(idx)} className="text-slate-400 hover:text-red-500 font-bold px-1">&times;</button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={handleSuggestPrompts}
                      disabled={themes.length === 0}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg active:scale-[0.98]"
                    >
                      Gerar Idéias de Prompt
                    </button>
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
                    <h2 className="text-2xl font-bold text-slate-800">Escolha os Melhores</h2>
                    <p className="text-slate-500">Selecione uma ou mais idéias para gerar as imagens.</p>
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
                    <p className="text-slate-500">Resultados gerados a partir da sua imagem base.</p>
                  </div>
                  <button 
                    onClick={() => setStep('themes')}
                    className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-5 py-2 rounded-xl font-bold transition-all flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                    Novas Idéias
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
