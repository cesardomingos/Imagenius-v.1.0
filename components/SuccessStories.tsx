
import React from 'react';

interface SuccessStory {
  id: string;
  name: string;
  role: string;
  company: string;
  image: string;
  quote: string;
  results: string[];
  category: 'ecommerce' | 'marketing' | 'design' | 'startup';
}

const STORIES: SuccessStory[] = [
  {
    id: '1',
    name: 'Maria Silva',
    role: 'Diretora de Marketing',
    company: 'TechStart Brasil',
    image: '👩‍💼',
    quote: 'O Imagenius revolucionou nossa produção de conteúdo. Conseguimos manter a identidade visual da marca em todas as campanhas, economizando horas de trabalho e garantindo consistência perfeita.',
    results: [
      'Redução de 70% no tempo de produção de imagens',
      'Aumento de 40% no engajamento nas redes sociais',
      'Economia de R$ 15.000/mês em design'
    ],
    category: 'marketing'
  },
  {
    id: '2',
    name: 'João Santos',
    role: 'Fundador',
    company: 'E-commerce Premium',
    image: '👨‍💻',
    quote: 'Como e-commerce, precisávamos de fotos de produtos consistentes e profissionais. O Imagenius nos permitiu criar centenas de variações mantendo o mesmo estilo, elevando a qualidade visual da nossa loja.',
    results: [
      '500+ fotos de produtos geradas em 1 semana',
      'Aumento de 25% na taxa de conversão',
      'Redução de 80% nos custos com fotografia'
    ],
    category: 'ecommerce'
  },
  {
    id: '3',
    name: 'Ana Costa',
    role: 'Designer Gráfica',
    company: 'Agência Criativa',
    image: '👩‍🎨',
    quote: 'O modo "Fundir Ideias" é incrível! Consigo combinar estilos de diferentes referências para criar algo completamente único. Isso abriu novas possibilidades criativas que eu nem imaginava.',
    results: [
      '3x mais projetos entregues por mês',
      'Clientes 100% satisfeitos com resultados',
      'Portfólio expandido com estilos únicos'
    ],
    category: 'design'
  },
  {
    id: '4',
    name: 'Carlos Oliveira',
    role: 'CEO',
    company: 'Startup Inovadora',
    image: '👨‍🚀',
    quote: 'Para uma startup, cada real conta. O Imagenius nos permitiu criar todo o material visual do nosso pitch deck e apresentações mantendo um estilo profissional e coeso, sem precisar contratar uma agência.',
    results: [
      'Pitch deck completo criado em 2 dias',
      'Economia de R$ 8.000 em design',
      'Investidores impressionados com qualidade visual'
    ],
    category: 'startup'
  }
];

const SuccessStories: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-12">
      <div className="text-center space-y-4">
        <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white">
          Casos de <span className="text-genius-gradient">Sucesso</span>
        </h2>
        <p className="text-slate-500 dark:text-slate-400 font-bold max-w-2xl mx-auto">
          Veja como nossos usuários estão transformando seus negócios com o Imagenius
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {STORIES.map((story) => (
          <div
            key={story.id}
            className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all shadow-lg hover:shadow-xl"
          >
            {/* Header */}
            <div className="flex items-start gap-4 mb-6">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">
                {story.image}
              </div>
              <div className="flex-1">
                <h3 className="font-black text-slate-900 dark:text-white text-lg mb-1">
                  {story.name}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-bold">
                  {story.role}
                </p>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-wider">
                  {story.company}
                </p>
              </div>
            </div>

            {/* Quote */}
            <blockquote className="mb-6 pl-4 border-l-4 border-indigo-500 dark:border-indigo-400">
              <p className="text-slate-700 dark:text-slate-300 italic leading-relaxed">
                "{story.quote}"
              </p>
            </blockquote>

            {/* Results */}
            <div className="space-y-3">
              <h4 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-wider">
                Resultados Alcançados:
              </h4>
              <ul className="space-y-2">
                {story.results.map((result, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {result}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-12 text-center p-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl text-white">
        <h3 className="text-2xl md:text-3xl font-black mb-4">
          Seja o próximo caso de sucesso!
        </h3>
        <p className="text-indigo-100 mb-6 font-bold max-w-2xl mx-auto">
          Junte-se a centenas de profissionais que já estão transformando seus negócios com o Imagenius
        </p>
        <button className="bg-white text-indigo-600 font-black px-8 py-4 rounded-2xl hover:scale-105 transition-transform shadow-xl">
          Começar Agora
        </button>
      </div>
    </div>
  );
};

export default SuccessStories;

