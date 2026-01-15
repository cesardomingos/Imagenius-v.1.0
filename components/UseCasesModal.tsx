import React from 'react';
import BaseModal from './BaseModal';

interface UseCase {
  id: string;
  title: string;
  description: string;
  exampleTheme: string;
  icon: React.ReactNode;
}

interface UseCasesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUseCase: (theme: string) => void;
}

const UseCasesModal: React.FC<UseCasesModalProps> = ({ isOpen, onClose, onSelectUseCase }) => {
  const useCases: UseCase[] = [
    {
      id: 'mascots',
      title: 'Variações de Mascotes',
      description: 'Crie diferentes versões do seu mascote mantendo a identidade visual. Perfeito para campanhas, redes sociais e materiais promocionais.',
      exampleTheme: 'mascote em uma praia tropical ao pôr do sol, estilo cartoon moderno, cores vibrantes',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'professional-photos',
      title: 'Variações de Fotos Profissionais',
      description: 'Transforme suas fotos profissionais em diferentes contextos e estilos, mantendo sua identidade visual.',
      exampleTheme: 'foto profissional em ambiente corporativo moderno, iluminação natural, fundo neutro elegante',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    {
      id: 'product-variations',
      title: 'Variações de Produtos',
      description: 'Crie diferentes apresentações do seu produto em diversos contextos e ambientes.',
      exampleTheme: 'produto em ambiente minimalista, iluminação de estúdio, fundo branco, estilo clean',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },
    {
      id: 'artwork-styles',
      title: 'Estilos de Arte',
      description: 'Aplique diferentes estilos artísticos à sua obra mantendo a essência original.',
      exampleTheme: 'arte em estilo impressionista, pinceladas visíveis, paleta de cores suaves, atmosfera onírica',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      )
    },
    {
      id: 'character-design',
      title: 'Design de Personagens',
      description: 'Crie variações de personagens em diferentes poses, expressões e contextos narrativos.',
      exampleTheme: 'personagem em pose heroica, expressão determinada, ambiente épico, iluminação dramática',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    {
      id: 'brand-identity',
      title: 'Identidade Visual de Marca',
      description: 'Mantenha a consistência da sua marca em diferentes aplicações e contextos visuais.',
      exampleTheme: 'identidade visual em aplicação de embalagem, cores da marca, tipografia elegante, layout moderno',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      )
    },
    {
      id: 'social-media',
      title: 'Conteúdo para Redes Sociais',
      description: 'Crie variações do seu conteúdo visual para diferentes formatos e plataformas sociais.',
      exampleTheme: 'conteúdo em formato stories, elementos gráficos modernos, cores vibrantes, tipografia impactante',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      )
    },
    {
      id: 'interior-design',
      title: 'Design de Interiores',
      description: 'Visualize diferentes estilos e ambientes mantendo a essência do seu projeto.',
      exampleTheme: 'interior moderno minimalista, iluminação natural, mobiliário contemporâneo, plantas decorativas',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    }
  ];

  const handleUseCaseSelect = (theme: string) => {
    onSelectUseCase(theme);
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white">Exemplos de Uso</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Descubra como o Imagenius pode transformar suas ideias</p>
        </div>
      }
    >
      {/* Content */}
      <div className="flex-1 overflow-y-auto -mx-6 -my-6">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {useCases.map((useCase) => (
              <div
                key={useCase.id}
                className="group relative p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 transition-all hover:shadow-xl"
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                    {useCase.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">
                      {useCase.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                      {useCase.description}
                    </p>
                    <div className="mb-4 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                        Exemplo de Tema:
                      </p>
                      <p className="text-sm text-slate-700 dark:text-slate-300 italic">
                        "{useCase.exampleTheme}"
                      </p>
                    </div>
                    <button
                      onClick={() => handleUseCaseSelect(useCase.exampleTheme)}
                      className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-95"
                    >
                      Usar esta sugestão
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>
      </div>
    </BaseModal>
  );
};

export default UseCasesModal;

