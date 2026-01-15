import React, { useState, useEffect, useRef } from 'react';

interface InteractiveTourProps {
  run: boolean;
  onComplete?: () => void;
}

interface Step {
  target: string;
  content: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const InteractiveTour: React.FC<InteractiveTourProps> = ({ run, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const steps: Step[] = [
    {
      target: 'body',
      content: (
        <div className="space-y-2">
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            Bem-vindo ao Imagenius! <i className="ri-palette-line text-indigo-600 dark:text-indigo-400"></i>
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Vamos fazer um tour rápido para você conhecer as principais funcionalidades.
          </p>
        </div>
      ),
      placement: 'center',
    },
    {
      target: '[data-tour="logo"]',
      content: (
        <div className="space-y-2">
          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            Logo e Navegação
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Clique no logo para voltar à página inicial a qualquer momento.
          </p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '[data-tour="credits"]',
      content: (
        <div className="space-y-2">
          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            Seus Créditos
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Aqui você vê quantos créditos tem disponíveis. 1 crédito = 1 imagem gerada. Clique para comprar mais.
          </p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '[data-tour="mode-selection"]',
      content: (
        <div className="space-y-2">
          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            Escolha o Modo
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            <strong>Preservar DNA:</strong> Mantém o estilo de uma imagem de referência.<br />
            <strong>Fundir Ideias:</strong> Combina até 5 imagens para criar algo novo.
          </p>
        </div>
      ),
      placement: 'top',
    },
    {
      target: '[data-tour="templates"]',
      content: (
        <div className="space-y-2">
          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            Templates Prontos
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Escolha um template para começar rapidamente ou crie seu próprio estilo.
          </p>
        </div>
      ),
      placement: 'top',
    },
    {
      target: '[data-tour="upload"]',
      content: (
        <div className="space-y-2">
          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            Faça Upload da Imagem
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Arraste e solte ou clique para selecionar uma imagem de referência. Esta será a base do seu estilo visual.
          </p>
        </div>
      ),
      placement: 'top',
    },
  ];

  useEffect(() => {
    // Verificar se o tour já foi completado
    const tourCompleted = localStorage.getItem('imagenius_tour_completed') === 'true';
    
    if (run && !isVisible && !tourCompleted) {
      setIsVisible(true);
      setCurrentStep(0);
    } else if (!run || tourCompleted) {
      setIsVisible(false);
      setCurrentStep(0);
    }
  }, [run, isVisible]);

  useEffect(() => {
    if (!isVisible || currentStep >= steps.length) return;

    const updatePosition = () => {
      const step = steps[currentStep];
      if (!step) return;

      if (step.placement === 'center') {
        setPosition({
          top: window.innerHeight / 2,
          left: window.innerWidth / 2,
        });
        return;
      }

      const targetElement = document.querySelector(step.target);
      if (!targetElement) {
        // Se o elemento não existe, pular para o próximo step
        if (currentStep < steps.length - 1) {
          setTimeout(() => setCurrentStep(currentStep + 1), 500);
        } else {
          handleComplete();
        }
        return;
      }

      // Fazer scroll suave até o elemento se necessário
      const rect = targetElement.getBoundingClientRect();
      const isElementVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
      
      if (!isElementVisible) {
        targetElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
        // Aguardar o scroll completar antes de posicionar
        setTimeout(() => {
          updatePositionAfterScroll();
        }, 500);
      } else {
        updatePositionAfterScroll();
      }

      function updatePositionAfterScroll() {
        const updatedRect = targetElement.getBoundingClientRect();
        const tooltipWidth = 320;
        const tooltipHeight = 200;
        const spacing = 20;

        let top = 0;
        let left = 0;

        switch (step.placement) {
          case 'top':
            top = updatedRect.top - tooltipHeight - spacing;
            left = updatedRect.left + updatedRect.width / 2 - tooltipWidth / 2;
            break;
          case 'bottom':
            top = updatedRect.bottom + spacing;
            left = updatedRect.left + updatedRect.width / 2 - tooltipWidth / 2;
            break;
          case 'left':
            top = updatedRect.top + updatedRect.height / 2 - tooltipHeight / 2;
            left = updatedRect.left - tooltipWidth - spacing;
            break;
          case 'right':
            top = updatedRect.top + updatedRect.height / 2 - tooltipHeight / 2;
            left = updatedRect.right + spacing;
            break;
          default:
            top = updatedRect.top + updatedRect.height / 2 - tooltipHeight / 2;
            left = updatedRect.left + updatedRect.width / 2 - tooltipWidth / 2;
        }

        // Ajustar para não sair da tela
        top = Math.max(20, Math.min(top, window.innerHeight - tooltipHeight - 20));
        left = Math.max(20, Math.min(left, window.innerWidth - tooltipWidth - 20));

        setPosition({ top, left });
      }

      // Destacar elemento
      (targetElement as HTMLElement).style.zIndex = '10000';
      (targetElement as HTMLElement).style.position = 'relative';
      (targetElement as HTMLElement).classList.add('tour-highlight');
    };

      // Aguardar um pouco para garantir que o DOM está pronto
      const timer = setTimeout(() => {
        updatePosition();
      }, 100);

      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
        // Remover highlight
        const targetElement = document.querySelector(steps[currentStep]?.target);
        if (targetElement) {
          (targetElement as HTMLElement).classList.remove('tour-highlight');
          (targetElement as HTMLElement).style.zIndex = '';
          (targetElement as HTMLElement).style.position = '';
        }
      };
  }, [currentStep, isVisible, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    setIsVisible(false);
    setCurrentStep(0);
    localStorage.setItem('imagenius_tour_completed', 'true');
    // Forçar atualização do estado para parar o tour
    if (onComplete) {
      onComplete();
    }
  };

  if (!isVisible || currentStep >= steps.length) return null;

  const step = steps[currentStep];
  const isCenter = step.placement === 'center';

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[10000]"
        style={{
          background: isCenter
            ? 'rgba(0, 0, 0, 0.5)'
            : 'rgba(0, 0, 0, 0.5)',
        }}
        onClick={handleSkip}
      />

      {/* Spotlight (para steps não-center) */}
      {!isCenter && (
        <div
          className="fixed inset-0 z-[10001] pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${position.left + 160}px ${position.top + 100}px, transparent 100px, rgba(0, 0, 0, 0.5) 200px)`,
          }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-[10002] w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border-2 border-indigo-500 p-6"
        style={{
          top: isCenter ? '50%' : `${position.top}px`,
          left: isCenter ? '50%' : `${position.left}px`,
          transform: isCenter ? 'translate(-50%, -50%)' : 'none',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Content */}
        <div className="space-y-4">
          {step.content}

          {/* Progress */}
          <div className="flex items-center gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full transition-all ${
                  index === currentStep
                    ? 'bg-indigo-600'
                    : index < currentStep
                    ? 'bg-indigo-300'
                    : 'bg-slate-200 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              onClick={handleSkip}
              className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
            >
              Pular Tour
            </button>
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
                >
                  Voltar
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-sm font-bold rounded-xl transition-all"
              >
                {currentStep === steps.length - 1 ? 'Finalizar' : 'Próximo'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .tour-highlight {
          outline: 3px solid #6366f1 !important;
          outline-offset: 4px !important;
          border-radius: 8px !important;
        }
      `}</style>
    </>
  );
};

export default InteractiveTour;

/**
 * Hook para verificar se o tour já foi completado
 */
export function useTourCompleted(): boolean {
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const tourCompleted = localStorage.getItem('imagenius_tour_completed') === 'true';
    setCompleted(tourCompleted);
  }, []);

  return completed;
}

/**
 * Hook para gerenciar o estado do tour
 */
export function useInteractiveTour() {
  const [run, setRun] = useState(false);
  const tourCompleted = useTourCompleted();

  const startTour = () => {
    // Verificar se já foi completado antes de iniciar
    const completed = localStorage.getItem('imagenius_tour_completed') === 'true';
    if (!completed) {
      setRun(true);
    }
  };

  const stopTour = () => {
    setRun(false);
  };

  const resetTour = () => {
    localStorage.removeItem('imagenius_tour_completed');
    setRun(true);
  };

  // Atualizar run quando tourCompleted mudar
  useEffect(() => {
    if (tourCompleted && run) {
      setRun(false);
    }
  }, [tourCompleted, run]);

  return {
    run,
    startTour,
    stopTour,
    resetTour,
    tourCompleted,
  };
}
