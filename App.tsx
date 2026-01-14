
import React, { useState, useEffect } from 'react';
import { AppStep, GeneratedImage, PromptSuggestion, ProjectMode, ImageData, PricingPlan } from './types';
import { suggestPrompts, generateCoherentImage } from './services/geminiService';
import { fetchUserCredits, deductCredits, checkAndUpdateTransactionStatus } from './services/supabaseService';
import { startStripeCheckout } from './services/stripeService';
import ImageUploader from './components/ImageUploader';
import PromptEditor from './components/PromptEditor';
import Gallery from './components/Gallery';
import Header from './components/Header';
import Loader from './components/Loader';
import PricingModal from './components/PricingModal';
import AuthModal from './components/AuthModal';
import Toast, { ToastType } from './components/Toast';
import { getCurrentUser, signOut } from './services/supabaseService';
import { UserProfile } from './types';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>('mode_selection');
  const [projectMode, setProjectMode] = useState<ProjectMode>('single');
  const [referenceImages, setReferenceImages] = useState<ImageData[]>([]);
  const [themes, setThemes] = useState<string[]>(['']);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [batchStatus, setBatchStatus] = useState<{ total: number; current: number } | null>(null);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [suggestions, setSuggestions] = useState<PromptSuggestion[]>([]);
  
  // Credit System State
  const [credits, setCredits] = useState<number>(0);
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  
  // Auth State
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Toast/Notification State
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Carrega usuário e créditos iniciais
  useEffect(() => {
    const loadUser = async () => {
      const user = await getCurrentUser();
      setCurrentUser(user);
      const currentCredits = await fetchUserCredits();
      setCredits(currentCredits);
    };
    loadUser();
  }, []);

  // Detectar retorno do checkout do Stripe
  useEffect(() => {
    const handleCheckoutReturn = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const checkoutStatus = urlParams.get('checkout');

      if (checkoutStatus === 'success') {
        // Remover query param da URL
        window.history.replaceState({}, document.title, window.location.pathname);

        // Log para debug (modo desenvolvimento)
        if (import.meta.env.DEV) {
          console.log('✅ Checkout bem-sucedido! Verificando transação...');
        }

        // Verificar status da transação e atualizar créditos
        setIsProcessing(true);
        setLoadingMsg('Verificando pagamento...');

        try {
          // Polling: tentar verificar a transação várias vezes (webhook pode demorar)
          let attempts = 0;
          const maxAttempts = 5;
          let transactionFound = false;

          const checkTransaction = async (): Promise<void> => {
            attempts++;
            
            // Aguardar antes de verificar (primeira tentativa espera 2s, depois 3s)
            if (attempts > 1) {
              await new Promise(resolve => setTimeout(resolve, 3000));
            } else {
              await new Promise(resolve => setTimeout(resolve, 2000));
            }

            const { updated, creditsAdded, transaction } = await checkAndUpdateTransactionStatus();

            if (updated && creditsAdded) {
              transactionFound = true;
              // Atualizar créditos na UI
              const newCredits = await fetchUserCredits();
              setCredits(newCredits);
              
              setToast({
                message: `Pagamento confirmado! ${creditsAdded} créditos adicionados ao seu Atelier.`,
                type: 'success'
              });
              
              setIsProcessing(false);
              setIsStoreOpen(false);
              return;
            }

            // Se ainda não encontrou e não excedeu tentativas, tentar novamente
            if (!transactionFound && attempts < maxAttempts) {
              setLoadingMsg(`Verificando pagamento... (${attempts}/${maxAttempts})`);
              await checkTransaction();
            } else if (!transactionFound) {
              // Após todas as tentativas, informar que está sendo processado
              setToast({
                message: 'Pagamento processado! Seus créditos serão atualizados em breve. Se não aparecerem, atualize a página.',
                type: 'info'
              });
              setIsProcessing(false);
              setIsStoreOpen(false);
            }
          };

          await checkTransaction();
        } catch (error) {
          console.error('Erro ao verificar pagamento:', error);
          setToast({
            message: 'Erro ao verificar pagamento. Verifique seus créditos em alguns instantes ou atualize a página.',
            type: 'warning'
          });
          setIsProcessing(false);
          setIsStoreOpen(false);
        }
      } else if (checkoutStatus === 'cancel') {
        // Remover query param da URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        setToast({
          message: 'Checkout cancelado. Você pode tentar novamente quando quiser.',
          type: 'info'
        });
        setIsStoreOpen(false);
      }
    };

    handleCheckoutReturn();
  }, []);

  const handleAuthSuccess = async (user: UserProfile) => {
    setCurrentUser(user);
    const currentCredits = await fetchUserCredits();
    setCredits(currentCredits);
  };

  const handleLogout = async () => {
    await signOut();
    setCurrentUser(null);
    setCredits(5); // Reset para créditos padrão
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

  const removeImage = (index: number) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== index));
  };

  const addThemeField = () => setThemes([...themes, '']);
  const removeThemeField = (index: number) => {
    setThemes(prev => prev.length > 1 ? prev.filter((_, i) => i !== index) : ['']);
  };
  const updateThemeValue = (index: number, value: string) => {
    const newThemes = [...themes];
    newThemes[index] = value;
    setThemes(newThemes);
  };

  const handleSuggestPrompts = async () => {
    const validThemes = themes.filter(t => t.trim() !== '');
    if (referenceImages.length === 0 || validThemes.length === 0) return;
    
    setIsProcessing(true);
    setLoadingMsg('O Gênio está analisando suas referências...');
    
    try {
      const result = await suggestPrompts(referenceImages, validThemes);
      setSuggestions(result.map((text, idx) => ({ id: idx, text })));
      setStep('prompts');
    } catch (error) {
      console.error(error);
      alert("Houve um erro no processo criativo. Tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateBatch = async (selectedPrompts: string[]) => {
    if (referenceImages.length === 0 || selectedPrompts.length === 0) return;

    // Credit Check and Deduction (Logic moved to service)
    const canProceed = credits >= selectedPrompts.length;
    if (!canProceed) {
      setIsStoreOpen(true);
      return;
    }

    setStep('gallery');
    setBatchStatus({ total: selectedPrompts.length, current: 0 });
    
    let successfulGenerations = 0;
    let creditsDeducted = 0;
    
    for (let i = 0; i < selectedPrompts.length; i++) {
      setBatchStatus(prev => prev ? { ...prev, current: i + 1 } : null);
      try {
        const imageUrl = await generateCoherentImage(referenceImages, selectedPrompts[i]);
        if (imageUrl) {
          const success = await deductCredits(1);
          if (success) {
            const newImg: GeneratedImage = {
              id: (Date.now() + i).toString(),
              url: imageUrl,
              prompt: selectedPrompts[i],
              timestamp: Date.now()
            };
            setGeneratedImages(prev => [newImg, ...prev]);
            setCredits(prev => prev - 1);
            successfulGenerations++;
            creditsDeducted++;
          }
        }
      } catch (error) {
        console.error(`Erro na geração ${i}:`, error);
      }
    }

    setBatchStatus(null);

    // Mostrar toast com feedback sobre créditos gastos
    if (creditsDeducted > 0) {
      const creditText = creditsDeducted === 1 ? 'crédito' : 'créditos';
      const imageText = successfulGenerations === 1 ? 'imagem foi materializada' : 'imagens foram materializadas';
      
      setToast({
        message: `${successfulGenerations} ${imageText}! ${creditsDeducted} ${creditText} ${creditsDeducted === 1 ? 'foi' : 'foram'} gasto${creditsDeducted === 1 ? '' : 's'}.`,
        type: 'success'
      });
    } else if (selectedPrompts.length > 0) {
      // Caso nenhuma imagem tenha sido gerada com sucesso
      setToast({
        message: 'Não foi possível gerar as imagens. Verifique sua conexão e tente novamente.',
        type: 'warning'
      });
    }
  };

  const handlePurchase = async (plan: PricingPlan) => {
    // Verificar se o usuário está autenticado
    if (!currentUser) {
      alert('Você precisa estar logado para fazer uma compra. Faça login primeiro.');
      setIsStoreOpen(false);
      setIsAuthOpen(true);
      return;
    }

    setIsProcessing(true);
    setLoadingMsg(`Conectando ao terminal de pagamento seguro...`);
    
    try {
      // Iniciar Checkout do Stripe (redireciona o usuário)
      // A Edge Function criará a transação pendente usando service_role key
      await startStripeCheckout(plan, currentUser.id);
      
      // Nota: Após o pagamento bem-sucedido, o webhook do Stripe atualizará os créditos
      // O usuário será redirecionado de volta para a aplicação após o checkout
      // Não precisamos fechar o modal aqui, pois o redirecionamento vai acontecer

    } catch (error: any) {
      console.error("Erro no checkout:", error);
      setIsProcessing(false);
      alert(error.message || "Falha ao iniciar pagamento. Tente novamente.");
    }
  };

  const resetApp = () => {
    setReferenceImages([]);
    setThemes(['']);
    setSuggestions([]);
    setStep('mode_selection');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfdff] text-slate-900 selection:bg-indigo-100">
      <Header 
        onReset={resetApp} 
        hasImages={generatedImages.length > 0} 
        goToGallery={() => setStep('gallery')} 
        credits={credits}
        onOpenStore={() => setIsStoreOpen(true)}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
      />
      
      <main className="flex-grow container mx-auto px-4 py-12 max-w-4xl">
        {isStoreOpen && (
          <PricingModal 
            onClose={() => setIsStoreOpen(false)} 
            onSelectPlan={handlePurchase}
            isProcessing={isProcessing}
          />
        )}

        {isAuthOpen && (
          <AuthModal
            isOpen={isAuthOpen}
            onClose={() => setIsAuthOpen(false)}
            onAuthSuccess={handleAuthSuccess}
          />
        )}

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            isVisible={true}
            onClose={() => setToast(null)}
            duration={6000}
          />
        )}

        {isProcessing && <Loader message={loadingMsg} />}

        {!isProcessing && (
          <div className="bg-white rounded-[3rem] shadow-2xl shadow-indigo-500/5 border border-slate-100 p-8 md:p-14 transition-all">
            
            {step === 'mode_selection' && (
              <div className="space-y-16 animate-in fade-in duration-700">
                <div className="text-center space-y-6">
                  <h2 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter">
                    Imagine. Crie. <span className="text-genius-gradient">Materialize.</span>
                  </h2>
                  <p className="text-slate-400 text-lg font-mono-genius uppercase tracking-[0.2em]">"I'm a genius, and you are too."</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <button 
                    onClick={() => handleModeSelection('single')}
                    className="group relative p-10 rounded-[2.5rem] bg-slate-50 border-2 border-transparent hover:border-indigo-500 transition-all text-left hover:shadow-2xl hover:shadow-indigo-100"
                  >
                    <div className="w-16 h-16 bg-white rounded-3xl shadow-lg flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                      <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-3">Estética Única</h3>
                    <p className="text-slate-500 font-medium leading-relaxed">Fidelidade absoluta a partir de uma única imagem de referência.</p>
                  </button>

                  <button 
                    onClick={() => handleModeSelection('studio')}
                    className="group relative p-10 rounded-[2.5rem] bg-slate-900 border-2 border-transparent hover:border-indigo-400 transition-all text-left hover:shadow-2xl hover:shadow-indigo-500/20"
                  >
                    <div className="w-16 h-16 bg-white/10 rounded-3xl shadow-lg flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                    </div>
                    <h3 className="text-2xl font-black text-white mb-3">Fusão Criativa</h3>
                    <p className="text-slate-400 font-medium leading-relaxed">Misture até 5 dimensões visuais: 1 Estilo + 4 Contextos.</p>
                  </button>
                </div>
              </div>
            )}

            {step === 'upload' && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="flex items-center gap-6">
                  <button onClick={() => setStep('mode_selection')} className="w-14 h-14 flex items-center justify-center hover:bg-slate-50 rounded-2xl transition-all border border-slate-100 text-slate-400 hover:text-indigo-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"/></svg>
                  </button>
                  <div className="space-y-1">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight">Defina sua Base</h2>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em]">Enviando Referência Visual</p>
                  </div>
                </div>

                <div className="space-y-10">
                  {projectMode === 'studio' && referenceImages.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
                      {referenceImages.map((img, idx) => (
                        <div key={idx} className="relative group aspect-square rounded-[1.5rem] overflow-hidden border-2 border-slate-100 shadow-sm">
                          <img src={`data:${img.mimeType};base64,${img.data}`} className="w-full h-full object-cover" />
                          <div className={`absolute top-3 left-3 px-2 py-1 text-white text-[9px] font-black rounded-lg backdrop-blur-md ${idx === 0 ? 'bg-indigo-600/80' : 'bg-black/50'}`}>
                            {idx === 0 ? 'ESTILO' : `CONTEXTO ${idx}`}
                          </div>
                          <button 
                            onClick={() => removeImage(idx)}
                            className="absolute top-3 right-3 w-8 h-8 bg-red-500 text-white rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-75 group-hover:scale-100"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                          </button>
                        </div>
                      ))}
                      {referenceImages.length < 5 && (
                        <div className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[1.5rem] bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer group" onClick={() => document.getElementById('file-upload-input')?.click()}>
                           <svg className="w-10 h-10 text-slate-300 group-hover:text-indigo-400 group-hover:scale-110 transition-all duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>
                           <span className="text-[9px] font-black text-slate-400 mt-4 uppercase tracking-widest">Adicionar</span>
                        </div>
                      )}
                    </div>
                  )}

                  <ImageUploader 
                    onUpload={handleImageUpload} 
                    label={projectMode === 'studio' && referenceImages.length > 0 ? "Adicionar Dimensões Visuais" : "Selecione a Imagem Âncora"} 
                  />

                  {referenceImages.length > 0 && (
                    <div className="pt-10 flex justify-center">
                      <button 
                        onClick={() => setStep('themes')}
                        className="bg-slate-900 hover:bg-indigo-600 text-white font-black py-5 px-16 rounded-[1.5rem] transition-all shadow-2xl text-xl flex items-center gap-4 transform hover:-translate-y-1"
                      >
                        Materializar Ideias
                        <svg className="w-6 h-6 animate-bounce-x" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 'themes' && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="flex items-center gap-6">
                  <button onClick={() => setStep('upload')} className="w-14 h-14 flex items-center justify-center hover:bg-slate-50 rounded-2xl transition-all border border-slate-100 text-slate-400 hover:text-indigo-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"/></svg>
                  </button>
                  <div className="space-y-1">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight">Mapeamento Genial</h2>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em]">Transformando Conceitos em Visão</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-14">
                  <div className="md:col-span-4 space-y-6">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Referências Ativas</p>
                    <div className="grid grid-cols-2 gap-3">
                      {referenceImages.map((img, idx) => (
                        <div key={idx} className={`relative rounded-2xl overflow-hidden shadow-xl border-2 transition-transform hover:scale-105 ${idx === 0 ? 'border-indigo-500 ring-4 ring-indigo-50' : 'border-white'}`}>
                           <img src={`data:${img.mimeType};base64,${img.data}`} className="w-full h-24 object-cover" />
                           <div className="absolute inset-0 bg-black/10"></div>
                        </div>
                      ))}
                    </div>
                    <div className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100">
                        <p className="text-[11px] font-bold text-indigo-900 leading-relaxed italic">
                            O Gênio irá fundir o estilo da primeira imagem com os temas abaixo, usando as outras imagens como guias de contexto.
                        </p>
                    </div>
                  </div>
                  
                  <div className="md:col-span-8 space-y-8">
                    <div className="space-y-4">
                      {themes.map((theme, idx) => (
                        <div key={idx} className="flex gap-4 group animate-in slide-in-from-right-8 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                          <input
                            type="text"
                            value={theme}
                            onChange={(e) => updateThemeValue(idx, e.target.value)}
                            placeholder={`Descreva um novo cenário para este estilo...`}
                            className="flex-grow p-6 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all text-black font-bold placeholder:text-slate-300"
                          />
                          <button onClick={() => removeThemeField(idx)} className="w-16 h-16 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                    <button onClick={addThemeField} className="flex items-center gap-3 text-indigo-600 hover:text-indigo-800 font-black text-sm px-6 py-4 bg-indigo-50 rounded-2xl transition-all hover:scale-105 active:scale-95">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
                      Adicionar Nova Camada de Ideia
                    </button>
                    <div className="pt-10 border-t border-slate-50">
                      <button onClick={handleSuggestPrompts} disabled={themes.every(t => t.trim() === '')} className="w-full bg-slate-900 hover:bg-indigo-600 text-white font-black py-6 rounded-[2rem] transition-all shadow-2xl text-xl tracking-tight uppercase group">
                         Projetar Sugestões <span className="text-indigo-400 group-hover:text-white transition-colors italic ml-2">by Imagenius</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 'prompts' && (
              <div className="space-y-12 animate-in fade-in duration-700">
                <div className="flex items-center gap-6">
                  <button onClick={() => setStep('themes')} className="w-14 h-14 flex items-center justify-center hover:bg-slate-50 rounded-2xl transition-all border border-slate-100 text-slate-400 hover:text-indigo-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"/></svg>
                  </button>
                  <div className="space-y-1">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight">A Faísca Final</h2>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em]">Refinando o DNA Artístico</p>
                  </div>
                </div>
                <PromptEditor suggestions={suggestions} onGenerate={handleGenerateBatch} credits={credits} />
              </div>
            )}

            {step === 'gallery' && (
              <div className="space-y-12 animate-in zoom-in-95 duration-700">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                  <div className="space-y-2">
                    <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Galeria de <span className="text-genius-gradient">Gênios</span></h2>
                    {batchStatus && (
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-ping"></div>
                            <p className="text-xs font-black text-indigo-600 uppercase tracking-widest">
                                Materializando Obra {batchStatus.current} de {batchStatus.total}...
                            </p>
                        </div>
                    )}
                  </div>
                  <button onClick={resetApp} className="bg-slate-900 text-white hover:bg-indigo-600 px-10 py-5 rounded-[1.5rem] font-black transition-all shadow-2xl hover:-translate-y-1 active:scale-95">Iniciar Nova Obra</button>
                </div>
                <Gallery 
                    images={generatedImages} 
                    isBatching={!!batchStatus} 
                    pendingCount={batchStatus ? batchStatus.total - generatedImages.length : 0} 
                />
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="bg-white/50 border-t border-slate-100 py-20 mt-20">
        <div className="container mx-auto px-4 text-center space-y-6">
          <div className="flex items-center justify-center gap-6 opacity-80 group grayscale hover:grayscale-0 transition-all duration-700">
             <div className="relative w-10 h-10 flex items-center justify-center">
                <div className="absolute w-2 h-2 bg-genius-gradient rounded-full"></div>
                <div className="absolute inset-0 border-2 border-indigo-600/30 rounded-[40%] animate-orbit-slow"></div>
                <div className="absolute inset-1 border-2 border-purple-500/20 rounded-[40%] rotate-45 animate-orbit-fast"></div>
             </div>
             <span className="font-black text-3xl tracking-tighter">Imagenius</span>
          </div>
          <p className="text-slate-400 text-[10px] font-mono-genius uppercase tracking-[0.5em]">"I'm a genius, and you are too."</p>
          <div className="pt-10 flex justify-center gap-12">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Todos os direitos reservados</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
