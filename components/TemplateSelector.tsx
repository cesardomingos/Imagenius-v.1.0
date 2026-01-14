
import React from 'react';
import { Template, TemplateId, getAllTemplates, getTemplatesByCategory } from '../config/templates';

interface TemplateSelectorProps {
  onSelectTemplate: (templateId: TemplateId) => void;
  onBack?: () => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ onSelectTemplate, onBack }) => {
  const templates = getAllTemplates();
  const businessTemplates = getTemplatesByCategory('business');
  const commercialTemplates = getTemplatesByCategory('commercial');
  const creativeTemplates = getTemplatesByCategory('creative');
  const restorationTemplates = getTemplatesByCategory('restoration');

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
              <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                {template.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-black text-slate-900 dark:text-white mb-2 text-lg">
                  {template.name}
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
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

      <div className="space-y-12">
        {businessTemplates.length > 0 && renderTemplateGrid(businessTemplates, '💼 Negócios')}
        {commercialTemplates.length > 0 && renderTemplateGrid(commercialTemplates, '📈 Comercial')}
        {creativeTemplates.length > 0 && renderTemplateGrid(creativeTemplates, '🎨 Criativo')}
        {restorationTemplates.length > 0 && renderTemplateGrid(restorationTemplates, '🔧 Restauração')}
      </div>
    </div>
  );
};

export default TemplateSelector;

