
import React, { useState, useMemo } from 'react';
import { Template, TemplateId, getAllTemplates, getTemplatesByCategory } from '../config/templates';
import { useDebounce } from '../hooks/useDebounce';

interface TemplateSelectorProps {
  onSelectTemplate: (templateId: TemplateId) => void;
  onBack?: () => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ onSelectTemplate, onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Debounce da busca para melhorar performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  const allTemplates = getAllTemplates();
  const businessTemplates = getTemplatesByCategory('business');
  const commercialTemplates = getTemplatesByCategory('commercial');
  const creativeTemplates = getTemplatesByCategory('creative');
  const restorationTemplates = getTemplatesByCategory('restoration');

  // Filtrar templates baseado em busca e categoria
  const filteredTemplates = useMemo(() => {
    let filtered = allTemplates;

    // Filtro por categoria
    if (selectedCategory) {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    // Filtro por busca (nome ou descrição) - usando valor com debounce
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(query) || 
        t.description.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [allTemplates, debouncedSearchQuery, selectedCategory]);

  // Agrupar templates filtrados por categoria
  const groupedFilteredTemplates = useMemo(() => {
    const grouped: Record<string, Template[]> = {
      business: [],
      commercial: [],
      creative: [],
      restoration: []
    };

    filteredTemplates.forEach(template => {
      if (grouped[template.category]) {
        grouped[template.category].push(template);
      }
    });

    return grouped;
  }, [filteredTemplates]);

  const renderTemplateGrid = (templates: Template[], title: string) => (
    <div className="space-y-6">
      <h3 className="text-2xl font-black text-slate-900 dark:text-white">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelectTemplate(template.id)}
            className="group relative p-6 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 bg-white dark:bg-slate-800 hover:shadow-xl transition-all text-left"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg sm:rounded-xl flex items-center justify-center text-xl sm:text-2xl group-hover:scale-110 transition-transform">
                {template.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-black text-slate-900 dark:text-white mb-1 sm:mb-2 text-base sm:text-lg">
                  {template.name}
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {template.description}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 font-bold">
              <span>Começar</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const categories = [
    { id: null, name: 'Todos', icon: '📋' },
    { id: 'business', name: 'Negócios', icon: '💼' },
    { id: 'commercial', name: 'Comercial', icon: '📈' },
    { id: 'creative', name: 'Criativo', icon: '🎨' },
    { id: 'restoration', name: 'Restauração', icon: '🔧' }
  ];

  const categoryLabels: Record<string, string> = {
    business: '💼 Negócios',
    commercial: '📈 Comercial',
    creative: '🎨 Criativo',
    restoration: '🔧 Restauração'
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {onBack && (
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack} 
            className="w-14 h-14 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 rounded-2xl transition-all border border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <div className="space-y-1">
            <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Escolha um Template
            </h2>
            <p className="text-slate-400 dark:text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">
              Agentes Especializados para Cada Necessidade
            </p>
          </div>
        </div>
      )}

      {/* Barra de Busca e Filtros */}
      <div className="space-y-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl sm:rounded-2xl focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none text-slate-900 dark:text-white font-bold placeholder-slate-400 dark:placeholder-slate-500 text-sm sm:text-base"
          />
          <svg className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Filtros de Categoria */}
        <div className="flex flex-wrap gap-3">
          {categories.map((category) => (
            <button
              key={category.id || 'all'}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-xl font-black text-sm transition-all ${
                selectedCategory === category.id
                  ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-lg'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span className="mr-2">{category.icon}</span>
              {category.name}
            </button>
          ))}
        </div>

        {/* Contador de Resultados */}
        {searchQuery || selectedCategory ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 font-bold">
            {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} encontrado{filteredTemplates.length !== 1 ? 's' : ''}
          </p>
        ) : null}
      </div>

      {/* Templates Filtrados */}
      <div className="space-y-12">
        {searchQuery || selectedCategory ? (
          // Mostrar templates filtrados agrupados
          Object.entries(groupedFilteredTemplates).map(([category, templates]) => 
            templates.length > 0 && renderTemplateGrid(templates, categoryLabels[category] || category)
          )
        ) : (
          // Mostrar todos os templates agrupados normalmente
          <>
            {businessTemplates.length > 0 && renderTemplateGrid(businessTemplates, '💼 Negócios')}
            {commercialTemplates.length > 0 && renderTemplateGrid(commercialTemplates, '📈 Comercial')}
            {creativeTemplates.length > 0 && renderTemplateGrid(creativeTemplates, '🎨 Criativo')}
            {restorationTemplates.length > 0 && renderTemplateGrid(restorationTemplates, '🔧 Restauração')}
          </>
        )}

        {/* Mensagem quando não há resultados */}
        {filteredTemplates.length === 0 && (searchQuery || selectedCategory) && (
          <div className="text-center py-12">
            <p className="text-slate-500 dark:text-slate-400 font-bold">
              Nenhum template encontrado. Tente outra busca.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(TemplateSelector);

