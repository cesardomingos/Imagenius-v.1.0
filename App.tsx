
import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { AppStep, GeneratedImage, PromptSuggestion, ProjectMode, ImageData, PricingPlan, TemplateId, getTemplateById } from './types';
import { suggestPrompts, generateCoherentImage } from './services/geminiService';
import { fetchUserCredits, deductCredits, checkAndUpdateTransactionStatus, getCurrentUser, signOut, checkPrivacyConsent } from './services/supabaseService';
import { startStripeCheckout } from './services/stripeService';
import { saveUserArt, fetchUserArts } from './services/communityService';
import ImageUploader from './components/ImageUploader';
import PromptEditor from './components/PromptEditor';
import ComparisonSection from './components/ComparisonSection';
import TemplateSelector from './components/TemplateSelector';
import EnhanceRestoreUI, { EnhanceRestoreOptions } from './components/EnhanceRestoreUI';
import AboutPage from './components/AboutPage';
import Header from './components/Header';
import Loader, { ProgressInfo } from './components/Loader';
import OfflineBanner from './components/OfflineBanner';
import ConfirmationModal from './components/ConfirmationModal';
import SocialProofSection from './components/SocialProofSection';
import SuccessStories from './components/SuccessStories';
import BlogContentSection from './components/BlogContentSection';
import GenerationPreview from './components/GenerationPreview';
import PromptHistory from './components/PromptHistory';
import ImageComparison from './components/ImageComparison';
import KeyboardShortcutsHelp from './components/KeyboardShortcutsHelp';
import Tooltip from './components/Tooltip';
import { useKeyboardShortcuts, useKeyboardHelp, type KeyboardShortcut } from './hooks/useKeyboardShortcuts';
import { savePromptToHistory } from './services/promptHistoryService';
import { useNetworkStatus } from './utils/networkStatus';
import { migrateSensitiveData } from './utils/storage';
import { clearExpiredCache } from './utils/requestCache';
import AuthModal from './components/AuthModal';
import Toast, { ToastType } from './components/Toast';
import TutorialModal from './components/TutorialModal';
import OnboardingWizard from './components/OnboardingWizard';
import UseCasesModal from './components/UseCasesModal';
import ResetPassword from './components/ResetPassword';
import ConsentModal from './components/ConsentModal';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import AchievementToast from './components/AchievementToast';
import SEO from './components/SEO';
import { GallerySkeleton } from './components/SkeletonLoader';
import InteractiveTour, { useInteractiveTour } from './components/InteractiveTour';

// Lazy load componentes pesados
const Gallery = lazy(() => import('./components/Gallery'));
const CommunityGallery = lazy(() => import('./components/CommunityGallery'));
const PricingModal = lazy(() => import('./components/PricingModal'));
const UserProfileModal = lazy(() => import('./components/UserProfile'));
const AchievementsGallery = lazy(() => import('./components/AchievementsGallery'));
import { UserProfile, AchievementId } from './types';
import { AchievementLevel } from './types/achievements';
import { 
  checkImageGenerationAchievements, 
  checkVisualAlchemistAchievement,
  checkPurchaseAchievements 
} from './services/achievementService';
import { analyticsEvents } from './utils/analytics';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>('mode_selection');
  const [projectMode, setProjectMode] = useState<ProjectMode>('single');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId | null>(null);
  const [referenceImages, setReferenceImages] = useState<ImageData[]>([]);
  const [themes, setThemes] = useState<string[]>(['']);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [batchStatus, setBatchStatus] = useState<{ total: number; current: number } | null>(null);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [loadingProgress, setLoadingProgress] = useState<{ current: number; total: number; stage: string } | null>(null);
  
  // Gallery Pagination State
  const [galleryPage, setGalleryPage] = useState(1);
  const [galleryTotal, setGalleryTotal] = useState(0);
  const [galleryPageSize] = useState(20);
  const [suggestions, setSuggestions] = useState<PromptSuggestion[]>([]);
  
  // Credit System State
  const [credits, setCredits] = useState<number>(0);
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  
  // Auth State
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Tutorial State
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  
  // Onboarding State
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Use Cases Modal State
  const [isUseCasesOpen, setIsUseCasesOpen] = useState(false);
  const [prefilledTheme, setPrefilledTheme] = useState<string | null>(null);

  // User Profile State
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // About Page State
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  
  // Consent Modal State
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [isPolicyUpdate, setIsPolicyUpdate] = useState(false);

  // Legal Documents State
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTermsOfService, setShowTermsOfService] = useState(false);

  // Confirmation Modal State
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [pendingReset, setPendingReset] = useState<(() => void) | null>(null);

  // Check if we're on the reset password page
  const isResetPasswordPage = window.location.pathname === '/reset-password' || 
                               window.location.search.includes('type=recovery');

  // Interactive Tour
  const { run: tourRun, startTour, stopTour, tourCompleted } = useInteractiveTour();

  // Toast/Notification State
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  
  // Achievement State
  const [unlockedAchievement, setUnlockedAchievement] = useState<{ id: AchievementId; level?: AchievementLevel } | null>(null);
  const [hasNewAchievement, setHasNewAchievement] = useState(false);

  // Network Status
  const { isOnline, wasOffline } = useNetworkStatus();
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);

  // Confirmation Modal State
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info';
  } | null>(null);

  // Prompt History State
  const [isPromptHistoryOpen, setIsPromptHistoryOpen] = useState(false);

  // Image Comparison State
  const [comparisonImages, setComparisonImages] = useState<{
    original: string;
    generated: string;
  } | null>(null);

  // Preview State (imagem gerada aguardando confirmação antes de gastar crédito)
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    prompt: string;
    referenceImageUrl?: string;
  } | null>(null);

  // Keyboard Shortcuts
  const keyboardShortcuts: KeyboardShortcut[] = [
    {
      key: 's',
      ctrl: true,
      action: () => {
        // Salvar imagem atual (se houver uma selecionada)
        if (generatedImages.length > 0) {
          const link = document.createElement('a');
          link.href = generatedImages[0].url;
          link.download = `imagenius-${Date.now()}.png`;
          link.click();
        }
      },
      description: 'Salvar imagem atual'
    },
    {
      key: 'Escape',
      action: () => {
        // Fechar modais
        setIsStoreOpen(false);
        setIsAuthOpen(false);
        setIsTutorialOpen(false);
        setIsOnboardingOpen(false);
        setIsUseCasesOpen(false);
        setIsAboutOpen(false);
        setIsProfileOpen(false);
        setIsPromptHistoryOpen(false);
        setComparisonImages(null);
        setConfirmationModal(null);
      },
      description: 'Fechar modais'
    },
    {
      key: 'k',
      ctrl: true,
      action: () => {
        // Focar busca de templates (se estiver na página de seleção)
        if (step === 'mode_selection') {
          const searchInput = document.querySelector('input[placeholder*="Buscar templates"]') as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
          }
        }
      },
      description: 'Focar busca de templates'
    },
    {
      key: 'n',
      ctrl: true,
      action: () => {
        // Novo projeto (reset)
        resetApp();
      },
      description: 'Iniciar novo projeto'
    }
  ];

  const { isVisible: isKeyboardHelpVisible, setIsVisible: setKeyboardHelpVisible, shortcuts: helpShortcuts } = useKeyboardHelp(keyboardShortcuts);
  useKeyboardShortcuts(keyboardShortcuts);

  // Listener para evento de mostrar ajuda de teclado
  useEffect(() => {
    const handleShowHelp = () => {
      setKeyboardHelpVisible(true);
    };
    window.addEventListener('showKeyboardHelp', handleShowHelp);
    return () => {
      window.removeEventListener('showKeyboardHelp', handleShowHelp);
    };
  }, [setKeyboardHelpVisible]);

  useEffect(() => {
    if (!isOnline) {
      setShowOfflineBanner(true);
    } else if (wasOffline) {
      // Manter banner por alguns segundos após voltar online
      setTimeout(() => setShowOfflineBanner(false), 3000);
    }
  }, [isOnline, wasOffline]);

  // Função para carregar histórico de artes do usuário
  const loadUserArts = useCallback(async (page: number = 1, skipIfProcessing: boolean = true) => {
    // Só carregar se o usuário estiver logado
    if (!currentUser) {
      return;
    }
    
    try {
      const result = await fetchUserArts(100, page, galleryPageSize);
      // Converter CommunityArt para GeneratedImage
      const convertedImages: GeneratedImage[] = result.arts.map(art => ({
        id: art.id,
        url: art.image_url,
        prompt: art.prompt,
        timestamp: new Date(art.created_at).getTime()
      }));
      
      // Usar setState com função para acessar o estado atual
      setGeneratedImages(prev => {
        if (page === 1) {
          // Não sobrescrever imagens que estão sendo geradas se skipIfProcessing for true
          // Verificar se há imagens com timestamp muito recente (últimos 30 segundos) = provavelmente sendo geradas
          const recentImages = prev.filter(img => {
            const age = Date.now() - img.timestamp;
            return age < 30000; // 30 segundos
          });
          
          if (skipIfProcessing && recentImages.length > 0) {
            // Mesclar com imagens já geradas na sessão atual
            const existingIds = new Set(prev.map(img => img.id));
            const newImages = convertedImages.filter(img => !existingIds.has(img.id));
            return [...prev, ...newImages];
          } else {
            return convertedImages;
          }
        } else {
          return [...prev, ...convertedImages];
        }
      });
      
      setGalleryTotal(result.total);
      setGalleryPage(page);
    } catch (error: any) {
      console.error('Erro ao carregar histórico de artes:', error);
      // Não mostrar erro 404 como crítico - pode ser que o usuário não tenha imagens ainda
      if (error?.status !== 404) {
        setToast({
          message: 'Erro ao carregar histórico. As imagens geradas nesta sessão ainda estão disponíveis.',
          type: 'warning'
        });
      }
    }
  }, [galleryPageSize, currentUser]);

  // Migrar dados sensíveis para sessionStorage na inicialização
  useEffect(() => {
    migrateSensitiveData();
    // Limpar cache expirado na inicialização para evitar problemas de quota
    clearExpiredCache();
  }, []);

  // Carrega usuário, créditos e histórico de artes iniciais
  // Usar useRef para garantir que só execute uma vez na montagem
  const hasLoadedInitialData = React.useRef(false);
  useEffect(() => {
    // Só executar uma vez na montagem do componente
    if (hasLoadedInitialData.current) return;
    
    const loadUser = async () => {
      hasLoadedInitialData.current = true;
      const user = await getCurrentUser();
      setCurrentUser(user);
      const currentCredits = await fetchUserCredits();
      setCredits(currentCredits);
      
      // Carregar histórico de artes se o usuário estiver logado
      if (user) {
        loadUserArts(1, false);
        
        // Verificar se precisa de consentimento de privacidade
        const consentCheck = await checkPrivacyConsent();
        if (consentCheck.needsConsent) {
          setIsPolicyUpdate(consentCheck.isPolicyUpdate);
          setShowConsentModal(true);
        }
      }
    };
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Array vazio - só executa uma vez na montagem

  // Iniciar tour na primeira visita
  useEffect(() => {
    // Verificar novamente se foi completado (pode ter mudado)
    const tourCompletedCheck = localStorage.getItem('imagenius_tour_completed') === 'true';
    
    if (step === 'mode_selection' && !tourCompletedCheck && !tourRun) {
      // Aguardar um pouco para garantir que a página carregou completamente
      const timer = setTimeout(() => {
        // Verificar novamente antes de iniciar
        const checkAgain = localStorage.getItem('imagenius_tour_completed') === 'true';
        if (!checkAgain) {
          startTour();
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [step, tourCompleted, tourRun, startTour]);

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
              
              // Verificar achievements de compra
              if (transaction) {
                const { hasAchievement } = await import('./services/achievementService');
                const isFirstPurchase = !(await hasAchievement('art_patron'));
                
                const purchaseAchievements = await checkPurchaseAchievements(
                  isFirstPurchase,
                  transaction.plan_id
                );
                
                if (purchaseAchievements.length > 0) {
                  // Buscar nível do achievement desbloqueado
                  const { getUserAchievementLevel } = await import('./services/achievementService');
                  const level = await getUserAchievementLevel(purchaseAchievements[0]);
                  setUnlockedAchievement({ id: purchaseAchievements[0], level: level || 'gold' });
                  setHasNewAchievement(true);
                }
              }
              
              // Track analytics - purchase completed
              if (transaction) {
                analyticsEvents.creditsPurchased(
                  transaction.plan_id || 'unknown',
                  transaction.amount || 0,
                  'BRL'
                );
              }

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
    // Carregar histórico de artes após login
    await loadUserArts();
    
    // Verificar se precisa de consentimento de privacidade
    const consentCheck = await checkPrivacyConsent();
    if (consentCheck.needsConsent) {
      setIsPolicyUpdate(consentCheck.isPolicyUpdate);
      setShowConsentModal(true);
    }
  };

  const handleLogout = async () => {
    await signOut();
    setCurrentUser(null);
    setCredits(15); // Reset para créditos padrão
    setGeneratedImages([]); // Limpar galeria ao fazer logout
    setHasNewAchievement(false);
  };

  const handleModeSelection = (mode: ProjectMode) => {
    setProjectMode(mode);
    setSelectedTemplate(null);
    setReferenceImages([]);
    setStep('upload');
  };

  const handleTemplateSelection = (templateId: TemplateId) => {
    const template = getTemplateById(templateId);
    if (!template) return;

    setSelectedTemplate(templateId);
    setProjectMode(template.mode);
    
    // Templates Enhance e Restore têm UI especial
    if (template.requiresSpecialUI) {
      setStep('upload');
      setThemes(template.defaultThemes || ['']);
    } else {
      setStep('upload');
      setThemes(template.defaultThemes || ['']);
    }
  };

  const handleImageUpload = async (base64: string, mimeType: string) => {
    if (projectMode === 'single') {
      setReferenceImages([{ data: base64, mimeType }]);
      // Se houver um tema pré-preenchido, aplicá-lo
      if (prefilledTheme) {
        setThemes([prefilledTheme]);
        setPrefilledTheme(null); // Limpar após usar
      }
      setStep('themes');
    } else {
      const newImages = [...referenceImages, { data: base64, mimeType }].slice(0, 5);
      setReferenceImages(newImages);
      
      // Verificar achievement "Alquimista Visual" quando usar 5 imagens no modo studio
      if (currentUser && newImages.length === 5 && projectMode === 'studio') {
        const unlocked = await checkVisualAlchemistAchievement();
        if (unlocked) {
          setUnlockedAchievement({ id: unlocked, level: 'gold' });
          setHasNewAchievement(true);
          // Atualizar créditos se ganhou recompensa
          const updatedCredits = await fetchUserCredits();
          setCredits(updatedCredits);
        }
      }
    }
  };

  const handleUseCaseSelect = (theme: string) => {
    // Definir modo como 'single' e iniciar o fluxo
    setProjectMode('single');
    setReferenceImages([]);
    setPrefilledTheme(theme);
    setStep('upload');
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
    
    // Verificar conexão
    if (!isOnline) {
      setToast({
        message: 'Você está offline. Verifique sua conexão e tente novamente.',
        type: 'error'
      });
      return;
    }
    
    // Verificar créditos (visitantes têm 2 créditos de test drive)
    const currentCredits = await fetchUserCredits();
    if (currentCredits < 1) {
      if (!currentUser) {
        setToast({
          message: 'Você usou todos os seus 2 créditos de teste! Faça login ou crie uma conta para continuar.',
          type: 'warning'
        });
        setIsAuthOpen(true);
      } else {
        setIsStoreOpen(true);
      }
      return;
    }
    
    setIsProcessing(true);
    setLoadingProgress({ current: 1, total: 3, stage: 'Analisando imagens de referência' });
    setLoadingMsg('O Gênio está analisando suas referências...');
    
    try {
      // Simular progresso durante análise
      await new Promise(resolve => setTimeout(resolve, 500));
      setLoadingProgress({ current: 2, total: 3, stage: 'Gerando prompts especializados' });
      
      const result = await suggestPrompts(referenceImages, validThemes, selectedTemplate || undefined);
      
      setLoadingProgress({ current: 3, total: 3, stage: 'Finalizando' });
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setSuggestions(result.map((text, idx) => ({ id: idx, text })));
      setStep('prompts');
      setLoadingProgress(null);
    } catch (error: any) {
      console.error(error);
      setToast({
        message: error.message || "Houve um erro no processo criativo. Tente novamente.",
        type: 'error'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEnhanceRestoreGenerate = async (options: EnhanceRestoreOptions) => {
    if (!referenceImages[0]) return;

    // Verificar conexão
    if (!isOnline) {
      setToast({
        message: 'Você está offline. Verifique sua conexão e tente novamente.',
        type: 'error'
      });
      return;
    }

    // Verificar créditos (visitantes têm 2 créditos de test drive)
    const currentCredits = await fetchUserCredits();
    if (currentCredits < 1) {
      if (!currentUser) {
        setToast({
          message: 'Você usou todos os seus 2 créditos de teste! Faça login ou crie uma conta para continuar.',
          type: 'warning'
        });
        setIsAuthOpen(true);
      } else {
        setIsStoreOpen(true);
      }
      return;
    }

    // Construir prompt baseado nas opções
    const intensityText = {
      low: 'sutilmente',
      medium: 'moderadamente',
      high: 'intensamente'
    }[options.intensity];

    const enhancements = options.specificEnhancements?.join(', ') || 
      (selectedTemplate === 'enhance' ? 'melhorar qualidade geral' : 'restaurar imagem');

    const prompt = selectedTemplate === 'enhance'
      ? `Melhore ${intensityText} a imagem: ${enhancements}. ${options.preserveOriginal ? 'Preserve o estilo original.' : ''}`
      : `Restaure ${intensityText} a imagem: ${enhancements}. ${options.preserveOriginal ? 'Preserve o estilo original.' : ''}`;

    setIsProcessing(true);
    setLoadingMsg(selectedTemplate === 'enhance' ? 'Melhorando imagem...' : 'Restaurando imagem...');
    setLoadingProgress({ current: 1, total: 4, stage: 'Analisando estilo e referências' });

    try {
      // Simular progresso durante análise
      await new Promise(resolve => setTimeout(resolve, 800));
      setLoadingProgress({ current: 2, total: 4, stage: 'Processando imagem' });
      
      await new Promise(resolve => setTimeout(resolve, 600));
      setLoadingProgress({ current: 3, total: 4, stage: 'Materializando arte' });
      
      const imageUrl = await generateCoherentImage([referenceImages[0]], prompt, projectMode);
      
      setLoadingProgress({ current: 4, total: 4, stage: 'Finalizando' });
      await new Promise(resolve => setTimeout(resolve, 300));
      if (imageUrl) {
        // Mostrar preview antes de gastar crédito
        const referenceUrl = referenceImages.length > 0 
          ? `data:${referenceImages[0].mimeType};base64,${referenceImages[0].data}`
          : undefined;
        setPreviewImage({
          url: imageUrl,
          prompt,
          referenceImageUrl: referenceUrl
        });
        setStep('gallery');
      }
    } catch (error: any) {
      setToast({
        message: error.message || 'Erro ao processar imagem. Tente novamente.',
        type: 'error'
      });
    } finally {
      setIsProcessing(false);
      setLoadingProgress(null);
    }
  };

  const handleAcceptPreview = async () => {
    if (!previewImage) return;

    const success = await deductCredits(1);
    if (success) {
      let artId: string | undefined;
      if (currentUser) {
        const saveResult = await saveUserArt(previewImage.url, previewImage.prompt);
        if (saveResult.success && saveResult.artId) {
          artId = saveResult.artId;
        }
      }

      const newImg: GeneratedImage = {
        id: artId || Date.now().toString(),
        url: previewImage.url,
        prompt: previewImage.prompt,
        timestamp: Date.now(),
        referenceImageUrl: previewImage.referenceImageUrl
      };
      setGeneratedImages(prev => [newImg, ...prev]);
      setCredits(prev => prev - 1);
      setPreviewImage(null);

      // Track analytics
      analyticsEvents.imageGenerated(projectMode, previewImage.prompt.length);
      
      setToast({
        message: 'Imagem salva com sucesso! 1 crédito foi gasto.',
        type: 'success'
      });
    } else {
      setToast({
        message: 'Erro ao processar crédito. Tente novamente.',
        type: 'error'
      });
    }
  };

  const handleRejectPreview = () => {
    setPreviewImage(null);
    setToast({
      message: 'Imagem descartada. Nenhum crédito foi gasto.',
      type: 'info'
    });
  };

  const handleGenerateBatch = async (selectedPrompts: string[]) => {
    if (referenceImages.length === 0 || selectedPrompts.length === 0) return;

    // Verificar conexão
    if (!isOnline) {
      setToast({
        message: 'Você está offline. Verifique sua conexão e tente novamente.',
        type: 'error'
      });
      return;
    }

    // Credit Check and Deduction (Logic moved to service)
    const canProceed = credits >= selectedPrompts.length;
    if (!canProceed) {
      setIsStoreOpen(true);
      return;
    }

    // Abrir galeria imediatamente para mostrar progresso
    setStep('gallery');
    setBatchStatus({ total: selectedPrompts.length, current: 0 });
    setIsProcessing(true);
    setLoadingMsg('Gerando imagens...');
    
    let successfulGenerations = 0;
    let creditsDeducted = 0;
    const isFirstImage = generatedImages.length === 0;
    
    for (let i = 0; i < selectedPrompts.length; i++) {
      setBatchStatus(prev => prev ? { ...prev, current: i + 1 } : null);
      const totalStages = 4;
      
      // Progresso para cada imagem individual
      setLoadingProgress({ 
        current: 1, 
        total: totalStages, 
        stage: `Analisando referências (${i + 1}/${selectedPrompts.length})` 
      });
      await new Promise(resolve => setTimeout(resolve, 400));
      
      setLoadingProgress({ 
        current: 2, 
        total: totalStages, 
        stage: `Processando prompt (${i + 1}/${selectedPrompts.length})` 
      });
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setLoadingProgress({ 
        current: 3, 
        total: totalStages, 
        stage: `Materializando arte (${i + 1}/${selectedPrompts.length})` 
      });
      
      try {
        const imageUrl = await generateCoherentImage(referenceImages, selectedPrompts[i], projectMode);
        
        setLoadingProgress({ 
          current: 4, 
          total: totalStages, 
          stage: `Finalizando (${i + 1}/${selectedPrompts.length})` 
        });
        await new Promise(resolve => setTimeout(resolve, 200));
        if (imageUrl) {
          const success = await deductCredits(1);
          if (success) {
            // Salvar arte no banco se o usuário estiver logado
            let artId: string | undefined;
            if (currentUser) {
              const saveResult = await saveUserArt(imageUrl, selectedPrompts[i]);
              if (saveResult.success && saveResult.artId) {
                artId = saveResult.artId;
              }
            }

            // Salvar URL da imagem de referência se disponível
            const referenceUrl = referenceImages.length > 0 
              ? `data:${referenceImages[0].mimeType};base64,${referenceImages[0].data}`
              : undefined;

            const newImg: GeneratedImage = {
              id: artId || (Date.now() + i).toString(),
              url: imageUrl,
              prompt: selectedPrompts[i],
              timestamp: Date.now(),
              referenceImageUrl: referenceUrl
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

    // Finalizar processamento
    setBatchStatus(null);
    setIsProcessing(false);
    setLoadingProgress(null);
    setLoadingMsg('');

    // Verificar achievements relacionados à geração de imagens
    if (currentUser && successfulGenerations > 0) {
      // Calcular imagens geradas nas últimas 24h
      const now = Date.now();
      const oneDayAgo = now - (24 * 60 * 60 * 1000);
      const recentImages = generatedImages.filter(img => img.timestamp >= oneDayAgo).length + successfulGenerations;
      
      const unlocked = await checkImageGenerationAchievements(
        isFirstImage && successfulGenerations > 0,
        recentImages
      );
      
      if (unlocked.length > 0) {
        // Buscar nível do achievement desbloqueado
        const { getUserAchievementLevel } = await import('./services/achievementService');
        const level = await getUserAchievementLevel(unlocked[0]);
        setUnlockedAchievement({ id: unlocked[0], level: level || 'bronze' });
        setHasNewAchievement(true);
      }
    }

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
    // Track analytics - purchase intent
    analyticsEvents.modalOpened('pricing');
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

  const performReset = () => {
    try {
      // Sempre garantir que volta para a home, mesmo em caso de erro
      // Limpar todos os estados que possam estar travando
      setPrefilledTheme(null);
      setProjectMode('single');
      setReferenceImages([]);
      setThemes(['']);
      setSuggestions([]);
      setGeneratedImages([]);
      setBatchStatus(null);
      setLoadingProgress(null);
      setIsProcessing(false);
      setLoadingMsg('');
      setToast(null);
      setPreviewImage(null);
      
      // Fechar todos os modais
      setIsStoreOpen(false);
      setIsAuthOpen(false);
      setIsTutorialOpen(false);
      setIsOnboardingOpen(false);
      setIsUseCasesOpen(false);
      setIsProfileOpen(false);
      setShowConsentModal(false);
      setShowPrivacyPolicy(false);
      setShowTermsOfService(false);
      setShowResetConfirm(false);
      
      // Sempre voltar para a home (página inicial)
      setStep('mode_selection');
    } catch (error) {
      // Em caso de qualquer erro, ainda assim garantir que volta para a home
      console.error('Erro ao resetar aplicação:', error);
      try {
        setStep('mode_selection');
        setGeneratedImages([]);
        setIsProcessing(false);
        setToast(null);
      } catch (fallbackError) {
        // Último recurso: recarregar a página para garantir reset completo
        console.error('Erro crítico ao resetar, recarregando página:', fallbackError);
        window.location.href = '/';
      }
    }
  };

  const resetApp = () => {
    // Mostrar confirmação apenas se houver processos ativos (geração em andamento)
    if (isProcessing) {
      // Mostrar modal de confirmação quando há processos ativos
      setPendingReset(() => performReset);
      setShowResetConfirm(true);
    } else {
      // Resetar diretamente se não houver processos ativos
      performReset();
    }
  };

  // If we're on the reset password page, show only that component
  if (isResetPasswordPage) {
    return (
      <ResetPassword 
        onSuccess={() => {
          window.location.href = '/';
        }}
      />
    );
  }

  // Determinar meta tags baseado no step atual
  const getSEOTags = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const baseDescription = "Transforme suas ideias em imagens incríveis com IA. Gere, melhore e restaure imagens com tecnologia de ponta.";
    
    switch (step) {
      case 'gallery':
        return {
          title: 'Minha Galeria | Imagenius',
          description: 'Veja todas as suas criações geradas com IA',
          url: `${baseUrl}/gallery`
        };
      case 'upload':
        return {
          title: 'Gerar Imagem | Imagenius',
          description: 'Envie sua imagem e transforme-a com IA',
          url: `${baseUrl}/upload`
        };
      default:
        return {
          title: "Imagenius | I'm a genius, and you are too.",
          description: baseDescription,
          url: baseUrl
        };
    }
  };

  const seoTags = getSEOTags();

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfdff] dark:bg-slate-900 text-slate-900 dark:text-slate-100 selection:bg-indigo-100 dark:selection:bg-indigo-900 transition-colors duration-300">
      <SEO
        title={seoTags.title}
        description={seoTags.description}
        url={seoTags.url}
        image={`${typeof window !== 'undefined' ? window.location.origin : ''}/og-image.png`}
      />
      <Header 
        onReset={resetApp} 
        hasImages={generatedImages.length > 0} 
        goToGallery={() => {
          setStep('gallery');
          // Recarregar histórico ao navegar para a galeria (resetar para página 1)
          // Só recarregar se não estiver processando (para não interferir com geração em andamento)
          if (currentUser && !isProcessing) {
            setGalleryPage(1);
            loadUserArts(1, true);
          }
        }} 
        credits={credits}
        onOpenStore={() => setIsStoreOpen(true)}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        onOpenProfile={() => {
          setIsProfileOpen(true);
          setHasNewAchievement(false);
        }}
        hasNewAchievement={hasNewAchievement}
        onOpenAbout={() => setIsAboutOpen(true)}
        onOpenTutorial={() => setIsTutorialOpen(true)}
      />
      
      <main className="flex-grow container mx-auto px-2 sm:px-4 py-6 sm:py-8 md:py-12 pb-20 sm:pb-24 md:pb-12 max-w-4xl md:max-w-6xl lg:max-w-7xl">
        {isStoreOpen && (
          <Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"><div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div></div>}>
            <PricingModal 
              onClose={() => setIsStoreOpen(false)} 
              onSelectPlan={handlePurchase}
              isProcessing={isProcessing}
            />
          </Suspense>
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

        {/* Achievement Toast */}
        {unlockedAchievement && (
          <AchievementToast
            achievementId={unlockedAchievement.id}
            level={unlockedAchievement.level}
            isVisible={!!unlockedAchievement}
            onClose={() => setUnlockedAchievement(null)}
          />
        )}

        {isTutorialOpen && (
          <TutorialModal
            isOpen={isTutorialOpen}
            onClose={() => setIsTutorialOpen(false)}
          />
        )}

        {isOnboardingOpen && (
          <OnboardingWizard
            isOpen={isOnboardingOpen}
            onComplete={() => {
              setIsOnboardingOpen(false);
              if (currentUser) {
                setCredits(prev => prev + 5);
                setToast({
                  message: 'Bem-vindo! Você ganhou 5 créditos de boas-vindas!',
                  type: 'success'
                });
              }
            }}
            onSkip={() => {
              setIsOnboardingOpen(false);
              localStorage.setItem('onboarding_completed', 'true');
            }}
          />
        )}

        {isUseCasesOpen && (
          <UseCasesModal
            isOpen={isUseCasesOpen}
            onClose={() => setIsUseCasesOpen(false)}
            onSelectUseCase={handleUseCaseSelect}
          />
        )}

        {isAboutOpen && (
          <AboutPage
            onClose={() => setIsAboutOpen(false)}
          />
        )}

        {confirmationModal && (
          <ConfirmationModal
            isOpen={confirmationModal.isOpen}
            title={confirmationModal.title}
            message={confirmationModal.message}
            onConfirm={confirmationModal.onConfirm}
            onCancel={() => setConfirmationModal(null)}
            variant={confirmationModal.variant || 'warning'}
          />
        )}

        {isProfileOpen && currentUser && (
          <Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"><div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div></div>}>
            <UserProfileModal
              isOpen={isProfileOpen}
              onClose={() => setIsProfileOpen(false)}
              onLogout={handleLogout}
            />
          </Suspense>
        )}

        {showConsentModal && currentUser && (
          <ConsentModal
            isOpen={showConsentModal}
            isPolicyUpdate={isPolicyUpdate}
            onAccept={() => {
              setShowConsentModal(false);
              setIsPolicyUpdate(false);
            }}
          />
        )}

        {/* Mostrar Loader apenas quando não estiver na galeria (para não bloquear visualização de progresso) */}
        {isProcessing && step !== 'gallery' && <Loader message={loadingMsg} progress={loadingProgress} />}

        {!isProcessing && (
          <div className="bg-white dark:bg-slate-800 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[3rem] shadow-2xl shadow-indigo-500/5 dark:shadow-indigo-500/10 border border-slate-100 dark:border-slate-700 p-3 sm:p-6 md:p-8 lg:p-14 transition-all">
            
            {step === 'mode_selection' && (
              <div className="space-y-6 sm:space-y-8 md:space-y-10 animate-in fade-in duration-700">
                {/* Hero Section */}
                <div className="text-center space-y-3 sm:space-y-4 md:space-y-5">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-slate-900 dark:text-white tracking-tighter px-2 sm:px-4">
                    Crie imagens que mantêm o mesmo estilo. <span className="text-genius-gradient">Sempre.</span>
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg md:text-xl font-bold max-w-2xl mx-auto px-4">
                    A única IA que garante 100% de coerência visual entre todas as suas criações
                  </p>
                  <div className="flex items-center justify-center gap-4 pt-4">
                    <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-full border border-indigo-200 dark:border-indigo-700">
                      <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                        <i className="ri-check-line inline-block mr-1"></i> Coerência Visual Garantida
                      </span>
                    </div>
                    <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-full border border-indigo-200 dark:border-indigo-700">
                      <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                        <i className="ri-gift-line inline-block mr-1"></i> 15 Créditos Grátis
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botões de Tutorial e Exemplos */}
                <div className="flex justify-center gap-3 sm:gap-4 flex-wrap">
                  <button
                    onClick={() => setIsTutorialOpen(true)}
                    className="group flex items-center gap-3 px-6 py-4 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border-2 border-indigo-200 dark:border-indigo-700 hover:border-indigo-300 dark:hover:border-indigo-600 text-indigo-700 dark:text-indigo-300 font-bold rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-6 h-6 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <span>Como funciona a Preservação de DNA?</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setIsUseCasesOpen(true)}
                    className="group flex items-center gap-3 px-6 py-4 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 border-2 border-purple-200 dark:border-purple-700 hover:border-purple-300 dark:hover:border-purple-600 text-purple-700 dark:text-purple-300 font-bold rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-6 h-6 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span>Exemplos de Uso</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>

                {/* Botões Preservar DNA e Fundir Ideias */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 lg:gap-8 px-4 sm:px-0" data-tour="mode-selection">
                  <Tooltip 
                    content="Use esta opção quando quiser criar múltiplas imagens mantendo exatamente o mesmo estilo visual. Ideal para manter identidade de marca, criar variações de um produto ou gerar conteúdo consistente."
                    position="top"
                  >
                  <button 
                    onClick={() => handleModeSelection('single')}
                    className="group relative p-4 sm:p-6 md:p-8 lg:p-10 rounded-[1.25rem] sm:rounded-[1.5rem] md:rounded-[2rem] lg:rounded-[2.5rem] bg-slate-50 dark:bg-slate-800 border-2 border-transparent hover:border-indigo-500 dark:hover:border-indigo-400 transition-all text-left hover:shadow-2xl hover:shadow-indigo-100 dark:hover:shadow-indigo-900/20"
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-white dark:bg-slate-700 rounded-2xl sm:rounded-3xl shadow-lg flex items-center justify-center mb-4 sm:mb-6 md:mb-8 group-hover:scale-110 transition-transform duration-500">
                      <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-2 sm:mb-3">Preservar DNA</h3>
                    <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium leading-relaxed">Fidelidade absoluta ao estilo. O Gênio captura a alma de uma única imagem para criar variações que mantêm a mesma identidade visual.</p>
                    </button>
                  </Tooltip>

                  <button 
                    onClick={() => handleModeSelection('studio')}
                    disabled={true}
                    className="group relative p-6 sm:p-8 md:p-10 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] bg-slate-900 dark:bg-slate-950 border-2 border-transparent opacity-50 cursor-not-allowed transition-all text-left"
                  >
                    <div className="w-16 h-16 bg-white/10 dark:bg-slate-800/50 rounded-3xl shadow-lg flex items-center justify-center mb-8">
                      <svg className="w-8 h-8 text-white dark:text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                    </div>
                    <h3 className="text-2xl font-black text-white dark:text-slate-100 mb-3">Fundir Ideias</h3>
                    <p className="text-slate-400 dark:text-slate-300 font-medium leading-relaxed">O laboratório do alquimista. Misture o DNA de várias referências (até 5) para criar algo inédito, unindo estilos, luzes e contextos.</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-3">Em breve</p>
                  </button>
                </div>

                {/* Template Selector */}
                <div data-tour="templates">
                  <TemplateSelector 
                    onSelectTemplate={handleTemplateSelection}
                  />
                </div>

                {/* Seção de Comparação */}
                <ComparisonSection />

                {/* Casos de Sucesso */}
                <SuccessStories />

                {/* Seção de Blog/Conteúdo */}
                <div className="pt-8 md:pt-10 mt-8 md:mt-10 border-t border-slate-200 dark:border-slate-700">
                  <BlogContentSection />
                </div>

                {/* Galeria da Comunidade */}
                <div className="pt-8 md:pt-10 mt-8 md:mt-10 border-t border-slate-200 dark:border-slate-700">
                  <Suspense fallback={<GallerySkeleton count={6} />}>
                    <CommunityGallery />
                  </Suspense>
                </div>
              </div>
            )}

            {step === 'upload' && selectedTemplate && (selectedTemplate === 'enhance' || selectedTemplate === 'restore') ? (
              <EnhanceRestoreUI
                templateId={selectedTemplate}
                referenceImage={referenceImages[0] || null}
                onImageSelect={(img) => {
                  if (img) {
                    setReferenceImages([img]);
                  } else {
                    setReferenceImages([]);
                  }
                }}
                onGenerate={handleEnhanceRestoreGenerate}
                onBack={() => {
                  setSelectedTemplate(null);
                  setReferenceImages([]);
                  setStep('mode_selection');
                }}
              />
            ) : step === 'upload' && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="flex items-center gap-6">
                  <button onClick={() => {
                    setSelectedTemplate(null);
                    setStep('mode_selection');
                  }} className="w-14 h-14 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 rounded-2xl transition-all border border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"/></svg>
                  </button>
                  <div className="space-y-1">
                    <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                      {selectedTemplate ? getTemplateById(selectedTemplate)?.name : 'Defina sua Base'}
                    </h2>
                    <p className="text-slate-400 dark:text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">
                      {selectedTemplate ? getTemplateById(selectedTemplate)?.description : 'Enviando Referência Visual'}
                    </p>
                  </div>
                </div>

                <div className="space-y-10">
                  {projectMode === 'studio' && referenceImages.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
                      {referenceImages.map((img, idx) => (
                        <div key={idx} className="relative group aspect-square rounded-[1.5rem] overflow-hidden border-2 border-slate-100 dark:border-slate-700 shadow-sm">
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
                        <div className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[1.5rem] bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer group" onClick={() => document.getElementById('file-upload-input')?.click()}>
                           <svg className="w-10 h-10 text-slate-300 dark:text-slate-600 group-hover:text-indigo-400 dark:group-hover:text-indigo-500 group-hover:scale-110 transition-all duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>
                           <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 mt-4 uppercase tracking-widest">Adicionar</span>
                        </div>
                      )}
                    </div>
                  )}

                  <ImageUploader 
                    onUpload={handleImageUpload} 
                    label={projectMode === 'studio' && referenceImages.length > 0 ? "Adicionar Dimensões Visuais" : "Selecione a Imagem Âncora"}
                    onError={(error) => {
                      setToast({
                        message: error,
                        type: 'error'
                      });
                    }}
                  />

                  {referenceImages.length > 0 && (
                    <div className="pt-10 flex justify-center">
                      <button 
                        onClick={() => setStep('themes')}
                        className="bg-slate-900 dark:bg-slate-800 hover:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-black py-5 px-16 rounded-[1.5rem] transition-all shadow-2xl text-xl flex items-center gap-4 transform hover:-translate-y-1"
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
                  <button onClick={() => setStep('upload')} className="w-14 h-14 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 rounded-2xl transition-all border border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"/></svg>
                  </button>
                  <div className="space-y-1">
                    <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Mapeamento Genial</h2>
                    <p className="text-slate-400 dark:text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">Transformando Conceitos em Visão</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-14">
                  <div className="md:col-span-4 space-y-4 md:space-y-6">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">Referências Ativas</p>
                    <div className="grid grid-cols-2 gap-3">
                      {referenceImages.map((img, idx) => (
                        <div key={idx} className={`relative rounded-2xl overflow-hidden shadow-xl border-2 transition-transform hover:scale-105 ${idx === 0 ? 'border-indigo-500 dark:border-indigo-400 ring-4 ring-indigo-50 dark:ring-indigo-900/30' : 'border-white dark:border-slate-700'}`}>
                           <img src={`data:${img.mimeType};base64,${img.data}`} className="w-full h-24 object-cover" />
                           <div className="absolute inset-0 bg-black/10"></div>
                        </div>
                      ))}
                    </div>
                    <div className="p-6 bg-indigo-50/50 dark:bg-indigo-900/30 rounded-3xl border border-indigo-100 dark:border-indigo-800">
                        <p className="text-[11px] font-bold text-indigo-900 dark:text-indigo-200 leading-relaxed italic">
                            O Gênio irá fundir o estilo da primeira imagem com os temas abaixo, usando as outras imagens como guias de contexto.
                        </p>
                    </div>
                  </div>
                  
                  <div className="md:col-span-8 space-y-4 md:space-y-8">
                    <div className="space-y-4">
                      {themes.map((theme, idx) => (
                        <div key={idx} className="flex gap-4 group animate-in slide-in-from-right-8 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                          <input
                            type="text"
                            value={theme}
                            onChange={(e) => updateThemeValue(idx, e.target.value)}
                            placeholder={`Descreva um novo cenário para este estilo...`}
                            className="flex-grow p-6 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-[1.5rem] focus:ring-8 focus:ring-indigo-500/5 dark:focus:ring-indigo-500/10 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none transition-all text-black dark:text-white font-bold placeholder:text-slate-300 dark:placeholder:text-slate-500"
                          />
                          <button onClick={() => removeThemeField(idx)} className="w-16 h-16 flex items-center justify-center text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-2xl transition-all">
                             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                    <button onClick={addThemeField} className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-black text-sm px-6 py-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl transition-all hover:scale-105 active:scale-95">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
                      Adicionar Nova Camada de Ideia
                    </button>
                    <div className="pt-10 border-t border-slate-50 dark:border-slate-700">
                      <button onClick={handleSuggestPrompts} disabled={themes.every(t => t.trim() === '')} className="w-full bg-slate-900 dark:bg-slate-800 hover:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-black py-6 rounded-[2rem] transition-all shadow-2xl text-xl tracking-tight uppercase group">
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
                <PromptEditor 
                  suggestions={suggestions} 
                  onGenerate={handleGenerateBatch} 
                  credits={credits}
                  onPromptEdit={async (editedCount) => {
                    if (currentUser && editedCount >= 5) {
                      const { checkArtDirectorAchievement } = await import('./services/achievementService');
                      const unlocked = await checkArtDirectorAchievement(editedCount);
                      if (unlocked) {
                        // Buscar nível do achievement desbloqueado
                        const { getUserAchievementLevel } = await import('./services/achievementService');
                        const level = await getUserAchievementLevel(unlocked);
                        setUnlockedAchievement({ id: unlocked, level: level || 'bronze' });
                        setHasNewAchievement(true);
                      }
                    }
                  }}
                />
              </div>
            )}

            {step === 'gallery' && previewImage && (
              <div className="space-y-8 animate-in zoom-in-95 duration-700">
                <div className="text-center space-y-4">
                  <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white">
                    Preview da Imagem Gerada
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400">
                    Revise a imagem antes de gastar 1 crédito
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {previewImage.referenceImageUrl && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Imagem Original
                      </h3>
                      <div className="rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700">
                        <img 
                          src={previewImage.referenceImageUrl} 
                          alt="Original" 
                          className="w-full h-auto"
                        />
                      </div>
                    </div>
                  )}
                  <div className="space-y-3">
                    <h3 className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Imagem Gerada
                    </h3>
                    <div className="rounded-2xl overflow-hidden border-2 border-indigo-500 dark:border-indigo-400 shadow-xl">
                      <img 
                        src={previewImage.url} 
                        alt="Gerada" 
                        className="w-full h-auto"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-3">
                    Prompt Aplicado
                  </label>
                  <p className="text-slate-800 dark:text-slate-200 font-medium italic leading-relaxed">
                    "{previewImage.prompt}"
                  </p>
                </div>

                <div className="flex items-center justify-center gap-4 pt-4">
                  <button
                    onClick={handleRejectPreview}
                    className="px-8 py-4 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-black rounded-xl transition-all shadow-lg hover:scale-105 active:scale-95"
                  >
                    Descartar (Gratuito)
                  </button>
                  <button
                    onClick={handleAcceptPreview}
                    className="px-8 py-4 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white font-black rounded-xl transition-all shadow-lg hover:scale-105 active:scale-95 flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Aceitar e Gastar 1 Crédito
                  </button>
                </div>
              </div>
            )}

            {step === 'gallery' && !previewImage && (
              <div className="space-y-12 animate-in zoom-in-95 duration-700">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                  <div className="space-y-2">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter">Galeria de <span className="text-genius-gradient">Gênios</span></h2>
                    {batchStatus && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-ping"></div>
                                <p className="text-xs font-black text-indigo-600 uppercase tracking-widest">
                                    Materializando Obra {batchStatus.current} de {batchStatus.total}...
                                </p>
                            </div>
                            {/* Barra de progresso */}
                            <div className="w-full max-w-md bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                <div 
                                    className="bg-indigo-600 h-full rounded-full transition-all duration-300 ease-out"
                                    style={{ width: `${(batchStatus.current / batchStatus.total) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    )}
                    {!batchStatus && currentUser && (
                      <p className="text-sm text-slate-500 font-medium">
                        Seu histórico pessoal de criações
                      </p>
                    )}
                  </div>
                  <div className="flex gap-3">
                    {currentUser && !isProcessing && (
                      <button 
                        onClick={() => loadUserArts(1, false)} 
                        className="bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-50 px-6 py-5 rounded-[1.5rem] font-black transition-all shadow-lg hover:-translate-y-1 active:scale-95 flex items-center gap-2"
                        title="Atualizar histórico"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                        </svg>
                        Atualizar
                      </button>
                    )}
                    <button onClick={resetApp} className="bg-slate-900 dark:bg-slate-800 text-white hover:bg-indigo-600 dark:hover:bg-indigo-700 px-10 py-5 rounded-[1.5rem] font-black transition-all shadow-2xl hover:-translate-y-1 active:scale-95">Iniciar Nova Obra</button>
                  </div>
                </div>
                <Suspense fallback={<GallerySkeleton count={6} />}>
                  <Gallery 
                      images={generatedImages} 
                      isBatching={!!batchStatus} 
                      pendingCount={batchStatus ? batchStatus.total - generatedImages.length : 0} 
                  />
                </Suspense>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="bg-white/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 py-20">
        <div className="container mx-auto px-4 text-center space-y-6">
          <div className="flex items-center justify-center gap-6 opacity-80 group grayscale hover:grayscale-0 transition-all duration-700">
             <div className="relative w-10 h-10 flex items-center justify-center">
                <div className="absolute w-2 h-2 bg-genius-gradient rounded-full"></div>
                <div className="absolute inset-0 border-2 border-indigo-600/30 rounded-[40%] animate-orbit-slow"></div>
                <div className="absolute inset-1 border-2 border-purple-500/20 rounded-[40%] rotate-45 animate-orbit-fast"></div>
             </div>
             <span className="font-black text-3xl tracking-tighter">Imagenius</span>
          </div>
          <p className="text-slate-400 dark:text-slate-500 text-[10px] font-mono-genius uppercase tracking-[0.5em]">I'm a genius, and you are too</p>
          
          {/* Legal Links */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            <button
              onClick={() => setShowPrivacyPolicy(true)}
              className="text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors uppercase tracking-wider"
            >
              Política de Privacidade
            </button>
            <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">•</span>
            <button
              onClick={() => setShowTermsOfService(true)}
              className="text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors uppercase tracking-wider"
            >
              Termos de Uso
            </button>
          </div>

          <div className="pt-6 flex justify-center gap-12">
              <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">Todos os direitos reservados</span>
          </div>
        </div>
      </footer>

      {/* Privacy Policy Modal */}
      {showPrivacyPolicy && (
        <PrivacyPolicy onClose={() => setShowPrivacyPolicy(false)} />
      )}

      {/* Terms of Service Modal */}
      {showTermsOfService && (
        <TermsOfService onClose={() => setShowTermsOfService(false)} />
      )}

      {/* Reset Confirmation Modal */}
      <ConfirmationModal
        isOpen={showResetConfirm}
        title="Iniciar Nova Obra?"
        message="Você tem imagens geradas que serão perdidas. Deseja realmente iniciar uma nova obra?"
        confirmText="Sim, Iniciar Nova"
        cancelText="Cancelar"
        variant="warning"
        onConfirm={() => {
          if (pendingReset) {
            pendingReset();
            setPendingReset(null);
          }
        }}
        onCancel={() => {
          setShowResetConfirm(false);
          setPendingReset(null);
        }}
      />

      {/* Interactive Tour */}
      <InteractiveTour 
        run={tourRun} 
        onComplete={() => {
          // Tour completed - parar o tour
          stopTour();
        }}
      />
    </div>
  );
};

export default App;
