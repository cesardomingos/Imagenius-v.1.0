
import React, { useState } from 'react';

interface BlogPost {
  id: string;
  title: string;
  description: string;
  category: 'tutorial' | 'case-study' | 'tip';
  readTime: string;
  icon: string;
  tags: string[];
}

const BlogContentSection: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'tutorial' | 'case-study' | 'tip'>('all');

  const posts: BlogPost[] = [
    {
      id: '1',
      title: 'Como Criar Identidade Visual Consistente para sua Marca',
      description: 'Aprenda a usar o Imagenius para manter a coerência visual em todas as suas criações, desde posts de redes sociais até materiais impressos.',
      category: 'tutorial',
      readTime: '5 min',
      icon: '🎨',
      tags: ['Branding', 'Design', 'Consistência']
    },
    {
      id: '2',
      title: 'Case: E-commerce Reduz 90% dos Custos de Fotografia',
      description: 'Veja como uma loja online usou o Imagenius para gerar fotos de produtos profissionais mantendo o mesmo estilo visual em todas as imagens.',
      category: 'case-study',
      readTime: '7 min',
      icon: '📸',
      tags: ['E-commerce', 'Fotografia', 'Produtos']
    },
    {
      id: '3',
      title: 'Dica: Use Prompts em Inglês para Melhores Resultados',
      description: 'Descubra por que descrever suas ideias em inglês produz resultados mais precisos e como aproveitar ao máximo o poder da IA.',
      category: 'tip',
      readTime: '3 min',
      icon: '💡',
      tags: ['Dicas', 'IA', 'Prompts']
    },
    {
      id: '4',
      title: 'Tutorial: Modo Studio - Misturando Múltiplas Referências',
      description: 'Aprenda a usar o Modo Studio para combinar o DNA visual de até 5 imagens diferentes e criar algo completamente novo e único.',
      category: 'tutorial',
      readTime: '8 min',
      icon: '🧪',
      tags: ['Modo Studio', 'Tutorial', 'Avançado']
    },
    {
      id: '5',
      title: 'Case: Agência de Marketing Aumenta Produtividade em 300%',
      description: 'Conheça a história de uma agência que transformou seu workflow usando o Imagenius para gerar conteúdo visual rapidamente.',
      category: 'case-study',
      readTime: '6 min',
      icon: '🚀',
      tags: ['Marketing', 'Produtividade', 'Workflow']
    },
    {
      id: '6',
      title: 'Dica: Melhore Imagens Antigas com Restauração IA',
      description: 'Saiba como usar o template de Restauração para melhorar fotos antigas, remover imperfeições e dar nova vida a memórias importantes.',
      category: 'tip',
      readTime: '4 min',
      icon: '✨',
      tags: ['Restauração', 'Fotos', 'Melhorias']
    }
  ];

  const filteredPosts = selectedCategory === 'all' 
    ? posts 
    : posts.filter(post => post.category === selectedCategory);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'tutorial': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'case-study': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'tip': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'tutorial': return 'Tutorial';
      case 'case-study': return 'Case de Uso';
      case 'tip': return 'Dica';
      default: return category;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white">
          Aprenda e <span className="text-genius-gradient">Inspire-se</span>
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Tutoriais, cases de sucesso e dicas para aproveitar ao máximo o poder do Imagenius
        </p>
      </div>

      {/* Filtros */}
      <div className="flex items-center justify-center gap-3 flex-wrap">
        {(['all', 'tutorial', 'case-study', 'tip'] as const).map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              selectedCategory === category
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            aria-label={`Filtrar por ${category === 'all' ? 'Todos' : getCategoryLabel(category)}`}
          >
            {category === 'all' ? 'Todos' : getCategoryLabel(category)}
          </button>
        ))}
      </div>

      {/* Grid de Posts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPosts.map((post) => (
          <article
            key={post.id}
            className="group relative bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 transition-all hover:shadow-xl overflow-hidden"
          >
            {/* Header do Card */}
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    {post.icon}
                  </div>
                  <div>
                    <span className={`inline-block px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${getCategoryColor(post.category)}`}>
                      {getCategoryLabel(post.category)}
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {post.readTime} de leitura
                    </p>
                  </div>
                </div>
              </div>

              {/* Conteúdo */}
              <div className="space-y-3">
                <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {post.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                  {post.description}
                </p>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 pt-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-lg"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* CTA */}
              <button
                className="w-full mt-4 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 group/btn"
                aria-label={`Ler mais sobre: ${post.title}`}
              >
                <span>Ler Artigo</span>
                <svg className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* CTA Final */}
      <div className="text-center pt-8">
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Quer ver mais conteúdo? Explore nossa galeria de casos de uso
        </p>
        <button
          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black rounded-xl transition-all shadow-lg hover:shadow-xl"
          aria-label="Ver mais casos de uso"
        >
          Ver Todos os Casos de Uso
        </button>
      </div>
    </div>
  );
};

export default React.memo(BlogContentSection);

