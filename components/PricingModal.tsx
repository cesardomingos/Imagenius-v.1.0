
import React, { useState, useEffect } from 'react';
import { PricingPlan } from '../types';
import BaseModal from './BaseModal';

interface PricingModalProps {
  onClose: () => void;
  onSelectPlan: (plan: PricingPlan) => void;
  isProcessing?: boolean;
}

const PLANS: PricingPlan[] = [
  // Planos Avulsos (one-time)
  { 
    id: 'starter', 
    name: 'Aprendiz', 
    credits: 20, 
    price: 'R$ 11,90',
    type: 'one-time',
    pixBonus: 5 // +5 créditos ao pagar via PIX
  },
  { 
    id: 'genius', 
    name: 'Gênio', 
    credits: 100, 
    price: 'R$ 19,90', 
    popular: true,
    type: 'one-time',
    pixBonus: 20 // +20 créditos ao pagar via PIX
  },
  { 
    id: 'master', 
    name: 'Imortal', 
    credits: 400, 
    price: 'R$ 59,90',
    type: 'one-time',
    pixBonus: 100 // +100 créditos ao pagar via PIX
  },
  // Assinaturas
  { 
    id: 'subscription-monthly', 
    name: 'Assinatura Genius Mensal', 
    credits: 200, 
    price: 'R$ 19,90',
    type: 'subscription',
    interval: 'month'
  },
  { 
    id: 'subscription-yearly', 
    name: 'Assinatura Genius Anual', 
    credits: 200, 
    price: 'R$ 14,90',
    type: 'subscription',
    interval: 'year',
    popular: false
  },
];

const PricingModal: React.FC<PricingModalProps> = ({ onClose, onSelectPlan, isProcessing = false }) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // Reset selectedPlanId quando o processamento terminar ou o modal fechar
  useEffect(() => {
    if (!isProcessing) {
      setSelectedPlanId(null);
    }
  }, [isProcessing]);

  const handlePlanClick = async (plan: PricingPlan) => {
    if (isProcessing || selectedPlanId) return; // Prevenir cliques múltiplos
    
    setSelectedPlanId(plan.id);
    try {
      await onSelectPlan(plan);
      // Nota: Não resetamos aqui porque o redirecionamento do Stripe vai acontecer
      // O reset será feito pelo useEffect quando isProcessing mudar
    } catch (error) {
      console.error('Erro ao selecionar plano:', error);
      setSelectedPlanId(null); // Reset em caso de erro
    }
  };

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      size="xl"
      showCloseButton={true}
      className="p-0"
    >

      <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
          {/* Banner Lateral */}
          <div className="lg:col-span-4 bg-slate-900 p-6 sm:p-8 md:p-10 lg:p-12 flex flex-col justify-between text-white relative overflow-hidden min-h-[200px] sm:min-h-[300px] lg:min-h-auto">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="relative z-10 space-y-4 sm:space-y-6">
               <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-indigo-500/50 rounded-xl sm:rounded-2xl flex items-center justify-center">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div>
               </div>
               <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tighter leading-tight">Potencialize sua <span className="text-indigo-400">Genialidade.</span></h2>
               <p className="text-slate-400 text-xs sm:text-sm font-medium leading-relaxed italic">"I'm a genius, and you are too. Mas até gênios precisam de combustível."</p>
            </div>

            <div className="relative z-10 space-y-3 sm:space-y-4 pt-6 sm:pt-8 lg:pt-12">
               <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-indigo-500/20 rounded-md flex items-center justify-center">
                    <svg className="w-3 h-3 text-indigo-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                  </div>
                  <span className="text-xs font-bold text-slate-300">Pagamento Seguro via Stripe</span>
               </div>
               <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-indigo-500/20 rounded-md flex items-center justify-center">
                    <svg className="w-3 h-3 text-indigo-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                  </div>
                  <span className="text-xs font-bold text-slate-300">Liberação instantânea via PIX</span>
               </div>
            </div>
          </div>

        {/* Opções de Planos */}
        <div className="lg:col-span-8 p-4 sm:p-6 md:p-8 lg:p-14 bg-white dark:bg-slate-800 overflow-y-auto">
            {/* Planos Avulsos */}
            <div className="mb-8">
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mb-4">Pacotes de Créditos</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                {PLANS.filter(p => p.type === 'one-time').map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                const isDisabled = isProcessing || (selectedPlanId !== null && !isSelected);
                
                return (
                <div 
                  key={plan.id}
                  onClick={() => !isDisabled && handlePlanClick(plan)}
                  className={`relative p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-[2rem] md:rounded-[2.5rem] border-2 transition-all flex flex-col justify-between min-h-[200px] sm:min-h-[240px] ${
                    isDisabled 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'cursor-pointer group'
                  } ${
                    plan.popular 
                      ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/10 dark:bg-indigo-900/20 shadow-xl shadow-indigo-100 dark:shadow-indigo-900/30' 
                      : 'border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-600'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-3 sm:px-4 py-1 sm:py-1.5 rounded-full shadow-lg whitespace-nowrap">
                      Mais Escolhido
                    </div>
                  )}

                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{plan.credits}</span>
                      <span className="text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">
                        {plan.type === 'subscription' ? 'Imagens/mês' : 'Imagens'}
                      </span>
                    </div>
                    {plan.type === 'subscription' && plan.interval && (
                      <div className="text-[9px] sm:text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                        {plan.interval === 'month' ? 'Cobrança Mensal' : 'Cobrança Anual'}
                      </div>
                    )}
                    {plan.type === 'one-time' && plan.pixBonus && (
                      <div className="text-[9px] sm:text-[10px] font-bold text-green-600 dark:text-green-400">
                        🎁 +{plan.pixBonus} créditos ao pagar via PIX
                      </div>
                    )}
                  </div>

                  <div className="mt-6 sm:mt-8 md:mt-10 space-y-3 sm:space-y-4">
                    <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{plan.price}</div>
                    <button 
                      disabled={isDisabled}
                      className={`w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                        isDisabled 
                          ? 'bg-slate-400 cursor-not-allowed' 
                          : plan.popular 
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 group-hover:scale-[1.05] active:scale-95' 
                            : 'bg-slate-900 text-white group-hover:scale-[1.05] active:scale-95'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Processando...</span>
                        </>
                      ) : (
                        'Selecionar'
                      )}
                    </button>
                  </div>
                </div>
                );
                })}
              </div>
            </div>

            {/* Assinaturas */}
            <div className="mb-8">
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mb-4">Assinaturas</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                {PLANS.filter(p => p.type === 'subscription').map((plan) => {
                  const isSelected = selectedPlanId === plan.id;
                  const isDisabled = isProcessing || (selectedPlanId !== null && !isSelected);
                  
                  return (
                  <div 
                    key={plan.id}
                    onClick={() => !isDisabled && handlePlanClick(plan)}
                    className={`relative p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-[2rem] md:rounded-[2.5rem] border-2 transition-all flex flex-col justify-between min-h-[200px] sm:min-h-[240px] ${
                      isDisabled 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'cursor-pointer group'
                    } ${
                      plan.popular 
                        ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/10 dark:bg-indigo-900/20 shadow-xl shadow-indigo-100 dark:shadow-indigo-900/30' 
                        : 'border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-600'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-3 sm:px-4 py-1 sm:py-1.5 rounded-full shadow-lg whitespace-nowrap">
                        Mais Escolhido
                      </div>
                    )}

                    <div className="space-y-3 sm:space-y-4">
                      <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">{plan.name}</h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{plan.credits}</span>
                        <span className="text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">
                          {plan.type === 'subscription' ? 'Imagens/mês' : 'Imagens'}
                        </span>
                      </div>
                      {plan.type === 'subscription' && plan.interval && (
                        <div className="text-[9px] sm:text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                          {plan.interval === 'month' ? 'Cobrança Mensal' : 'Cobrança Anual'}
                        </div>
                      )}
                    </div>

                    <div className="mt-6 sm:mt-8 md:mt-10 space-y-3 sm:space-y-4">
                      <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{plan.price}</div>
                      <button 
                        disabled={isDisabled}
                        className={`w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                          isDisabled 
                            ? 'bg-slate-400 cursor-not-allowed' 
                            : plan.popular 
                              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 group-hover:scale-[1.05] active:scale-95' 
                              : 'bg-slate-900 text-white group-hover:scale-[1.05] active:scale-95'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Processando...</span>
                          </>
                        ) : (
                          'Assinar'
                        )}
                      </button>
                    </div>
                  </div>
                )})}
              </div>
            </div>

            <div className="mt-6 sm:mt-8 md:mt-12 flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 md:p-8 bg-slate-50 dark:bg-slate-900/50 rounded-xl sm:rounded-2xl gap-4 sm:gap-6">
               <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl shadow-sm flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Ambiente Blindado</p>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium">Suas informações estão protegidas por criptografia de ponta.</p>
                  </div>
               </div>
               <div className="flex items-center gap-3 sm:gap-4 grayscale opacity-40 w-full sm:w-auto justify-center sm:justify-end">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-4 sm:h-5" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_Pix_Brasil.png" alt="PIX" className="h-4 sm:h-5" />
               </div>
            </div>
          </div>
        </div>
    </BaseModal>
  );
};

export default PricingModal;
