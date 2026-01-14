import React, { useState } from 'react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Passo 1: Criar Imagem Âncora',
      description: 'Selecione uma imagem de referência que servirá como base para o estilo visual. Esta imagem definirá a estética que será aplicada em todas as criações.',
      image: '/tutorial_image_1.png',
      imageAlt: 'Tutorial - Criar Imagem Âncora'
    },
    {
      title: 'Passo 2: Definir Temas',
      description: 'Descreva os cenários ou contextos onde você deseja aplicar o estilo da imagem âncora. Você pode adicionar múltiplos temas para criar variações criativas.',
      image: '/tutorial_image_2.jpg',
      imageAlt: 'Tutorial - Definir Temas'
    },
    {
      title: 'Passo 3: Escolher Descrição de Cena',
      description: 'O Imagenius irá sugerir descrições de cena baseadas na sua imagem âncora e nos temas definidos. Você pode escolher uma ou ambas as sugestões, e até mesmo editar a descrição. Se preferir, você pode escrever ou editar a descrição diretamente em inglês para obter resultados ainda melhores.',
      image: '/tutorial_image_3.jpg',
      imageAlt: 'Tutorial - Escolher Descrição de Cena',
      tip: '💡 Dica: Descrever em inglês geralmente produz resultados melhores! Você pode editar as sugestões ou criar suas próprias descrições.'
    },
    {
      title: 'Passo 4: Exemplos de Resultados',
      description: 'Veja exemplos de como o Imagenius transforma seus temas em arte final, mantendo a coerência estética da imagem âncora.',
      images: [
        { src: '/tutorial_image_4.png', alt: 'Exemplo 1 de resultado' },
        { src: '/tutorial_image_5.png', alt: 'Exemplo 2 de resultado' }
      ]
    }
  ];

  if (!isOpen) return null;

  const currentStepData = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (!isLastStep) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">Tutorial: Estética Coerente</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Passo {currentStep + 1} de {steps.length}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-auto p-6 md:p-8">
          <div className="space-y-6">
            {/* Step Title */}
            <div>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-3">{currentStepData.title}</h3>
              <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">{currentStepData.description}</p>
              {currentStepData.tip && (
                <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 rounded-xl">
                  <p className="text-sm font-bold text-indigo-900 dark:text-indigo-200">{currentStepData.tip}</p>
                </div>
              )}
            </div>

            {/* Images */}
            <div className="space-y-4">
              {currentStepData.image ? (
                <div className="relative rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 shadow-lg">
                  <img
                    src={currentStepData.image}
                    alt={currentStepData.imageAlt}
                    className="w-full h-auto"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x600?text=Imagem+Indisponível';
                    }}
                  />
                </div>
              ) : currentStepData.images ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentStepData.images.map((img, idx) => (
                    <div key={idx} className="relative rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 shadow-lg">
                      <img
                        src={img.src}
                        alt={img.alt}
                        className="w-full h-auto"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x600?text=Imagem+Indisponível';
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
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
              className="px-6 py-3 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white font-bold rounded-xl transition-all flex items-center gap-2"
            >
              {isLastStep ? 'Finalizar' : 'Próximo'}
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

export default TutorialModal;

