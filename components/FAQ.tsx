
import React, { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
  category: 'geral' | 'creditos' | 'tecnico' | 'pagamento';
}

const FAQ_DATA: FAQItem[] = [
  {
    category: 'geral',
    question: 'O que é o Imagenius?',
    answer: 'O Imagenius é uma plataforma de geração de imagens com IA que garante 100% de coerência visual entre todas as suas criações. Diferente de outras ferramentas, o Imagenius mantém o mesmo estilo visual em todas as imagens geradas, ideal para manter identidade de marca e criar conteúdo consistente.'
  },
  {
    category: 'geral',
    question: 'Como funciona a "Preservação de DNA"?',
    answer: 'A Preservação de DNA é nossa tecnologia exclusiva que captura a essência visual de uma imagem de referência e aplica esse mesmo estilo em todas as variações geradas. Isso garante que todas as suas imagens mantenham a mesma identidade visual, cores, iluminação e estética.'
  },
  {
    category: 'geral',
    question: 'Posso usar imagens geradas comercialmente?',
    answer: 'Sim! Todas as imagens geradas pelo Imagenius podem ser usadas para fins comerciais, incluindo marketing, produtos, redes sociais e qualquer outro uso comercial. Você tem total propriedade sobre as imagens criadas.'
  },
  {
    category: 'creditos',
    question: 'Os créditos expiram?',
    answer: 'Não! Seus créditos nunca expiram. Você pode comprar créditos hoje e usá-los quando quiser, no seu próprio ritmo. Não há pressa para usar seus créditos.'
  },
  {
    category: 'creditos',
    question: 'Quantos créditos preciso para gerar uma imagem?',
    answer: 'Cada imagem gerada consome 1 crédito, independentemente do modo usado (Preservar DNA ou Fundir Ideias). Isso vale tanto para gerações individuais quanto para lotes de imagens.'
  },
  {
    category: 'creditos',
    question: 'Posso comprar mais créditos depois?',
    answer: 'Sim! Você pode comprar mais créditos a qualquer momento. Os novos créditos se somam aos que você já possui, e todos permanecem válidos indefinidamente.'
  },
  {
    category: 'creditos',
    question: 'Como ganho créditos grátis?',
    answer: 'Você ganha 15 créditos grátis ao criar sua conta! Além disso, você pode ganhar créditos extras através do programa de afiliados, compartilhando seu código de referência com amigos.'
  },
  {
    category: 'tecnico',
    question: 'Quais formatos de imagem são suportados?',
    answer: 'Aceitamos imagens nos formatos JPG, PNG e WEBP. As imagens geradas são fornecidas em alta qualidade e podem ser baixadas em formato PNG.'
  },
  {
    category: 'tecnico',
    question: 'Qual o tamanho máximo de imagem que posso fazer upload?',
    answer: 'Recomendamos imagens de até 10MB. Imagens muito grandes podem ser redimensionadas automaticamente para otimizar o processamento.'
  },
  {
    category: 'tecnico',
    question: 'Quantas imagens de referência posso usar?',
    answer: 'No modo "Preservar DNA", você usa 1 imagem de referência. No modo "Fundir Ideias", você pode usar até 5 imagens de referência para criar combinações únicas de estilos.'
  },
  {
    category: 'pagamento',
    question: 'Quais formas de pagamento aceitam?',
    answer: 'Aceitamos pagamentos via cartão de crédito (através do Stripe) e PIX. Pagamentos via PIX têm bônus de créditos extras!'
  },
  {
    category: 'pagamento',
    question: 'O pagamento é seguro?',
    answer: 'Sim! Todos os pagamentos são processados através do Stripe, uma das plataformas de pagamento mais seguras do mundo. Não armazenamos informações de cartão de crédito em nossos servidores.'
  },
  {
    category: 'pagamento',
    question: 'Quando recebo os créditos após o pagamento?',
    answer: 'Créditos são liberados instantaneamente após a confirmação do pagamento. Para pagamentos via PIX, a liberação é automática assim que o pagamento é confirmado. Para cartão de crédito, a liberação é imediata após a aprovação.'
  },
  {
    category: 'pagamento',
    question: 'Posso cancelar minha assinatura?',
    answer: 'Sim, você pode cancelar sua assinatura a qualquer momento. Seus créditos já adquiridos permanecem válidos e não expiram, mesmo após o cancelamento.'
  }
];

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'all' | FAQItem['category']>('all');

  const categories = [
    { id: 'all' as const, name: 'Todas', icon: '📋' },
    { id: 'geral' as const, name: 'Geral', icon: '❓' },
    { id: 'creditos' as const, name: 'Créditos', icon: '💎' },
    { id: 'tecnico' as const, name: 'Técnico', icon: '⚙️' },
    { id: 'pagamento' as const, name: 'Pagamento', icon: '💳' }
  ];

  const filteredFAQs = selectedCategory === 'all' 
    ? FAQ_DATA 
    : FAQ_DATA.filter(faq => faq.category === selectedCategory);

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white">
          Perguntas Frequentes
        </h2>
        <p className="text-slate-500 dark:text-slate-400 font-bold">
          Tire suas dúvidas sobre o Imagenius
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-3 justify-center">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => {
              setSelectedCategory(category.id);
              setOpenIndex(null);
            }}
            className={`px-4 py-2 rounded-xl font-bold transition-all ${
              selectedCategory === category.id
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span className="mr-2">{category.icon}</span>
            {category.name}
          </button>
        ))}
      </div>

      {/* FAQ Items */}
      <div className="space-y-4">
        {filteredFAQs.map((faq, index) => (
          <div
            key={index}
            className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden transition-all hover:border-indigo-300 dark:hover:border-indigo-600"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full p-6 text-left flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <h3 className="font-black text-slate-900 dark:text-white text-lg flex-1">
                {faq.question}
              </h3>
              <svg
                className={`w-6 h-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0 transition-transform ${
                  openIndex === index ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openIndex === index && (
              <div className="px-6 pb-6">
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Contact Support */}
      <div className="mt-12 p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-200 dark:border-indigo-800 text-center">
        <p className="text-slate-700 dark:text-slate-300 font-bold mb-2">
          Ainda tem dúvidas?
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Entre em contato conosco através do suporte e responderemos o mais rápido possível.
        </p>
      </div>
    </div>
  );
};

export default FAQ;

