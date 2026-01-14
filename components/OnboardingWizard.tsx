
import React, { useState } from 'react';

interface OnboardingWizardProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip?: () => void;
}

type UseCase = 'branding' | 'art' | 'products' | 'social' | null;

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ isOpen, onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedUseCase, setSelectedUseCase] = useState<UseCase>(null);

  const useCases = [
    {
      id: 'branding' as UseCase,
      title: 'Branding & Identidade',
      description: 'Mantenha identidade visual consistente em todas as peças',
      icon: '🎨',
      example: 'Logos, materiais de marketing, apresentações com mesmo estilo'
    },
    {
      id: 'art' as UseCase,
      title: 'Arte & Ilustração',
      description: 'Crie séries de arte com estilo unificado',
      icon: '🖼️',
      example: 'Personagens que não mudam, séries temáticas consistentes'
    },
    {
      id: 'products' as UseCase,
      title: 'E-commerce',
      description: 'Fotos de produtos com mesmo estilo fotográfico',
      icon: '📦',
      example: 'Catálogo com iluminação e estilo uniformes'
    },
    {
      id: 'social' as UseCase,
      title: 'Social Media',
      description: 'Feed com estética visual unificada',
      icon: '📱',
      example: 'Posts que mantêm identidade visual do perfil'
    }
  ];

  const steps = [
    {
      title: 'Bem-vindo ao Imagenius!',
      content: (
        <div className="space-y-6 text-center">
          <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mx-auto">
            <span className="text-5xl">✨</span>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">
              Crie imagens que mantêm o mesmo estilo. Sempre.
            </h3>
            <p className="text-slate-600 dark:text-slate-400 font-medium">
              Vamos te guiar em 3 passos rápidos para você começar a criar.
            </p>
          </div>
        </div>
      )
    },
    {
      title: 'O que você quer criar?',
      content: (
        <div className="space-y-6">
          <p className="text-center text-slate-600 dark:text-slate-400 font-medium">
            Escolha o caso de uso que mais se aplica a você:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {useCases.map((useCase) => (
              <button
                key={useCase.id}
                onClick={() => setSelectedUseCase(useCase.id)}
                className={`p-6 rounded-2xl border-2 text-left transition-all ${
                  selectedUseCase === useCase.id
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 shadow-lg'
                    : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600'
                }`}
              >
                <div className="flex items-start gap-4">
                  <span className="text-4xl">{useCase.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-black text-slate-900 dark:text-white mb-1">
                      {useCase.title}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                      {useCase.description}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 italic">
                      {useCase.example}
                    </p>
                  </div>
                  {selectedUseCase === useCase.id && (
                    <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )
    },
    {
      title: 'Preservar DNA vs Fundir Ideias',
      content: (
        <div className="space-y-6">
          <p className="text-center text-slate-600 dark:text-slate-400 font-medium mb-6">
            Entenda a diferença entre os dois modos:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl border-2 border-indigo-200 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-900/20">
              <h4 className="font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="text-2xl">🧬</span>
                Preservar DNA
              </h4>
              <p className="text-sm text-slate-700 dark:text-slate-300 mb-4">
                Fidelidade absoluta ao estilo de uma única imagem de referência.
              </p>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Mantém identidade visual</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Ideal para séries consistentes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Perfeito para branding</span>
                </li>
              </ul>
            </div>
            <div className="p-6 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
              <h4 className="font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="text-2xl">⚗️</span>
                Fundir Ideias
              </h4>
              <p className="text-sm text-slate-700 dark:text-slate-300 mb-4">
                Mistura o DNA de várias referências para criar algo inédito.
              </p>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-500 mt-0.5">+</span>
                  <span>Combina até 5 estilos</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-500 mt-0.5">+</span>
                  <span>Criações únicas e inovadoras</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-500 mt-0.5">+</span>
                  <span>Experimentos criativos</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Pronto para começar!',
      content: (
        <div className="space-y-6 text-center">
          <div className="w-24 h-24 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-12 h-12 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">
              Você ganhou 5 créditos de boas-vindas! 🎁
            </h3>
            <p className="text-slate-600 dark:text-slate-400 font-medium">
              Agora você tem 20 créditos para começar a criar. Vamos lá!
            </p>
          </div>
        </div>
      )
    }
  ];

  if (!isOpen) return null;

  const currentStepData = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      // Salvar que onboarding foi completado
      localStorage.setItem('onboarding_completed', 'true');
      onComplete();
    } else {
      // No step 1, só avança se selecionou um caso de uso
      if (currentStep === 1 && !selectedUseCase) {
        return;
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center">
              <span className="text-2xl">🎓</span>
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">Onboarding</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Passo {currentStep + 1} de {steps.length}</p>
            </div>
          </div>
          {onSkip && !isLastStep && (
            <button
              onClick={onSkip}
              className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-bold"
            >
              Pular
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-grow overflow-auto p-6 md:p-8">
          <div className="space-y-6">
            <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-6">
              {currentStepData.title}
            </h3>
            {currentStepData.content}
          </div>
        </div>

        {/* Footer with Navigation */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          {/* Progress Indicators */}
          <div className="flex items-center gap-2">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'bg-indigo-600 dark:bg-indigo-400 w-8'
                    : 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500'
                }`}
                aria-label={`Ir para passo ${index + 1}`}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-3">
            {!isFirstStep && (
              <button
                onClick={handlePrevious}
                className="px-6 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Anterior
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={currentStep === 1 && !selectedUseCase}
              className="px-6 py-3 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center gap-2"
            >
              {isLastStep ? 'Começar a Criar!' : 'Próximo'}
              {!isLastStep && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;

