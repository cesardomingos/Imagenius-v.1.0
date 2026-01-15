
import React, { useState, useEffect } from 'react';
import Joyride, { Step, CallBackProps, STATUS } from 'react-joyride';

interface InteractiveTourProps {
  run: boolean;
  onComplete?: () => void;
}

const InteractiveTour: React.FC<InteractiveTourProps> = ({ run, onComplete }) => {
  const [tourRun, setTourRun] = useState(false);

  useEffect(() => {
    setTourRun(run);
  }, [run]);

  const steps: Step[] = [
    {
      target: 'body',
      content: (
        <div className="space-y-2">
          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            Bem-vindo ao Imagenius! 🎨
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Vamos fazer um tour rápido para você conhecer as principais funcionalidades.
          </p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
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

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setTourRun(false);
      // Salvar no localStorage que o tour foi completado
      localStorage.setItem('imagenius_tour_completed', 'true');
      if (onComplete) {
        onComplete();
      }
    }
  };

  return (
    <Joyride
      steps={steps}
      run={tourRun}
      continuous={true}
      showProgress={true}
      showSkipButton={true}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#6366f1', // indigo-500
          textColor: '#1e293b', // slate-800
          overlayColor: 'rgba(0, 0, 0, 0.5)',
          arrowColor: '#ffffff',
          backgroundColor: '#ffffff',
          beaconSize: 36,
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 16,
          padding: 20,
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        buttonNext: {
          backgroundColor: '#6366f1',
          fontSize: 14,
          fontWeight: 'bold',
          padding: '10px 20px',
          borderRadius: 8,
        },
        buttonBack: {
          color: '#64748b',
          marginRight: 10,
          fontSize: 14,
        },
        buttonSkip: {
          color: '#64748b',
          fontSize: 14,
        },
        beacon: {
          inner: {
            backgroundColor: '#6366f1',
            border: '2px solid #ffffff',
          },
          outer: {
            backgroundColor: '#6366f1',
            opacity: 0.2,
          },
        },
      }}
      locale={{
        back: 'Voltar',
        close: 'Fechar',
        last: 'Finalizar',
        next: 'Próximo',
        skip: 'Pular Tour',
      }}
    />
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
    setRun(true);
  };

  const stopTour = () => {
    setRun(false);
  };

  const resetTour = () => {
    localStorage.removeItem('imagenius_tour_completed');
    setRun(true);
  };

  return {
    run,
    startTour,
    stopTour,
    resetTour,
    tourCompleted,
  };
}

