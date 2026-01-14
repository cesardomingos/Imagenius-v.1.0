
import React from 'react';

interface AboutPageProps {
  onClose: () => void;
}

interface UserProfile {
  name: string;
  role: string;
  icon: string;
  pains: string[];
  solution: string;
  useCase: string;
}

const AboutPage: React.FC<AboutPageProps> = ({ onClose }) => {
  const profiles: UserProfile[] = [
    {
      name: 'Designer de Marca',
      role: 'Profissional de Branding',
      icon: '🎨',
      pains: [
        'Precisa manter identidade visual consistente em todas as peças',
        'Gasta horas ajustando manualmente cada variação de imagem',
        'Dificuldade em escalar produção visual mantendo qualidade',
        'Custos altos com fotógrafos e designers para cada projeto'
      ],
      solution: 'O Imagenius garante 100% de coerência visual entre todas as criações, permitindo que você crie infinitas variações mantendo o mesmo DNA visual da sua marca.',
      useCase: 'Criar catálogo completo de produtos, posts para redes sociais e materiais de marketing com estilo visual idêntico.'
    },
    {
      name: 'E-commerce Manager',
      role: 'Gestor de E-commerce',
      icon: '📦',
      pains: [
        'Fotos de produtos com estilos diferentes prejudicam a experiência',
        'Custo elevado para fotografar cada novo produto',
        'Tempo de produção muito longo para lançar produtos',
        'Dificuldade em manter padrão visual em marketplaces'
      ],
      solution: 'Gere fotos profissionais de produtos com estilo fotográfico uniforme, reduzindo custos e tempo de produção em até 90%.',
      useCase: 'Criar catálogo completo de produtos com iluminação, fundo e estilo consistentes, prontos para venda online.'
    },
    {
      name: 'Social Media Manager',
      role: 'Gestor de Redes Sociais',
      icon: '📱',
      pains: [
        'Precisa criar conteúdo visual diariamente para manter engajamento',
        'Feed visualmente desorganizado prejudica a identidade da marca',
        'Orçamento limitado para produção de conteúdo visual',
        'Dificuldade em manter coerência entre diferentes plataformas'
      ],
      solution: 'Crie posts visualmente coesos que mantêm a identidade da marca, permitindo produção em massa de conteúdo de qualidade.',
      useCase: 'Gerar semanas de conteúdo para Instagram, TikTok e LinkedIn mantendo o mesmo estilo visual e identidade da marca.'
    },
    {
      name: 'Empreendedor/Startup',
      role: 'Fundador de Startup',
      icon: '🚀',
      pains: [
        'Orçamento limitado para design e produção visual',
        'Precisa de materiais profissionais para investidores e clientes',
        'Tempo escasso para cuidar de cada detalhe visual',
        'Dificuldade em criar identidade visual consistente sem designer'
      ],
      solution: 'Crie apresentações profissionais, pitch decks e materiais de marketing com identidade visual consistente, sem precisar de equipe de design.',
      useCase: 'Desenvolver pitch deck completo, apresentações para investidores e materiais de marketing com estilo visual profissional e coeso.'
    },
    {
      name: 'Restaurante/Gastronomia',
      role: 'Gestor de Restaurante',
      icon: '🍽️',
      pains: [
        'Fotos de pratos inconsistentes prejudicam a percepção do restaurante',
        'Custo alto para fotografar cada novo prato do cardápio',
        'Dificuldade em manter qualidade visual em delivery apps',
        'Tempo de produção muito longo para atualizar cardápio'
      ],
      solution: 'Gere fotos profissionais de comida com estilo fotográfico consistente, criando cardápios visualmente atraentes que aumentam vendas.',
      useCase: 'Criar cardápio completo com fotos profissionais de todos os pratos, mantendo iluminação e estilo consistentes para aumentar conversão.'
    },
    {
      name: 'Desenvolvedor de Jogos',
      role: 'Game Developer',
      icon: '🎮',
      pains: [
        'Precisa de concept art consistente para todo o jogo',
        'Custo elevado para contratar artistas para cada asset',
        'Dificuldade em manter estilo visual coeso entre personagens e ambientes',
        'Tempo de produção muito longo para assets visuais'
      ],
      solution: 'Crie concept art consistente para jogos, mantendo o mesmo estilo visual entre personagens, ambientes e objetos do jogo.',
      useCase: 'Desenvolver concept art completo para jogo, incluindo personagens, ambientes, criaturas e objetos, todos com estilo visual coeso.'
    },
    {
      name: 'Agência de Marketing',
      role: 'Agência Digital',
      icon: '💼',
      pains: [
        'Precisa entregar projetos visuais para múltiplos clientes',
        'Custo elevado de produção visual impacta margem de lucro',
        'Dificuldade em escalar produção sem perder qualidade',
        'Tempo de produção muito longo para atender demanda'
      ],
      solution: 'Escale produção visual mantendo qualidade e coerência, reduzindo custos operacionais e aumentando capacidade de atendimento.',
      useCase: 'Produzir campanhas completas para múltiplos clientes, mantendo identidade visual de cada marca e reduzindo tempo de produção.'
    },
    {
      name: 'Criador de Conteúdo',
      role: 'Content Creator',
      icon: '✨',
      pains: [
        'Precisa criar conteúdo visual constantemente para manter audiência',
        'Dificuldade em manter identidade visual única e reconhecível',
        'Orçamento limitado para produção de conteúdo',
        'Cansaço criativo e falta de inspiração'
      ],
      solution: 'Crie conteúdo visual único e consistente que fortalece sua identidade, permitindo produção em massa sem perder autenticidade.',
      useCase: 'Gerar semanas de conteúdo visual mantendo seu estilo único, criando feed coeso que aumenta reconhecimento e engajamento.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-8 py-6 flex items-center justify-between z-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Para Quem é o Imagenius?
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-bold mt-2">
              Conheça os perfis que mais se beneficiam da coerência visual garantida
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-12 h-12 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-all text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-12">
          {/* Intro */}
          <div className="text-center space-y-4">
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl mx-auto">
              O Imagenius foi criado para profissionais e empresas que precisam de <strong className="text-indigo-600 dark:text-indigo-400">coerência visual garantida</strong> em suas criações. 
              Se você já se frustrou com ferramentas que geram imagens bonitas, mas sem manter o mesmo estilo, o Imagenius é para você.
            </p>
          </div>

          {/* Value Proposition */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-3xl p-8 border border-indigo-200 dark:border-indigo-700">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4">
              🎯 Nossa Proposta de Valor Única
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="text-3xl mb-2">✓</div>
                <h3 className="font-black text-slate-900 dark:text-white">100% Coerência</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Única IA que garante que todas as imagens mantenham o mesmo estilo visual
                </p>
              </div>
              <div className="space-y-2">
                <div className="text-3xl mb-2">⚡</div>
                <h3 className="font-black text-slate-900 dark:text-white">Produção em Massa</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Crie dezenas de variações mantendo identidade visual, em minutos
                </p>
              </div>
              <div className="space-y-2">
                <div className="text-3xl mb-2">💰</div>
                <h3 className="font-black text-slate-900 dark:text-white">Redução de Custos</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Elimine necessidade de fotógrafos e designers para cada projeto
                </p>
              </div>
            </div>
          </div>

          {/* User Profiles */}
          <div className="space-y-8">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white text-center">
              Perfis de Usuários
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              {profiles.map((profile, index) => (
                <div
                  key={index}
                  className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all"
                >
                  {/* Profile Header */}
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-3xl">
                      {profile.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">
                        {profile.name}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-bold">
                        {profile.role}
                      </p>
                    </div>
                  </div>

                  {/* Pains */}
                  <div className="mb-6">
                    <h4 className="text-sm font-black text-red-600 dark:text-red-400 uppercase tracking-wider mb-3">
                      😰 Dores Principais
                    </h4>
                    <ul className="space-y-2">
                      {profile.pains.map((pain, painIndex) => (
                        <li key={painIndex} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <span className="text-red-500 mt-1">•</span>
                          <span>{pain}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Solution */}
                  <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-200 dark:border-indigo-700">
                    <h4 className="text-sm font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">
                      ✨ Como o Imagenius Resolve
                    </h4>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {profile.solution}
                    </p>
                  </div>

                  {/* Use Case */}
                  <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                    <h4 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      🎯 Caso de Uso
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {profile.useCase}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center space-y-6 pt-8 border-t border-slate-200 dark:border-slate-700">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white">
              Pronto para Garantir Coerência Visual?
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Comece agora com 15 créditos grátis e experimente a única IA que garante 100% de coerência visual entre suas criações.
            </p>
            <button
              onClick={onClose}
              className="bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white font-black py-4 px-8 rounded-2xl transition-all shadow-lg hover:scale-105 active:scale-95"
            >
              Começar Agora
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;

