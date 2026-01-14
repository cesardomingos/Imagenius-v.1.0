
import React, { useState } from 'react';
import { PricingPlan } from '../types';
import { startStripeCheckout } from '../services/stripeService';

interface PricingPageProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onOpenAuth: () => void;
  plans: PricingPlan[];
  onPurchase?: (plan: PricingPlan) => Promise<void>;
}

const PricingPage: React.FC<PricingPageProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenAuth,
  plans
}) => {
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePurchase = async (plan: PricingPlan) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    setIsProcessing(true);
    setSelectedPlan(plan);
    try {
      if (onPurchase) {
        await onPurchase(plan);
      } else {
        await startStripeCheckout(plan.id);
      }
    } catch (error: any) {
      console.error('Erro ao iniciar checkout:', error);
      setSelectedPlan(null);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  const popularPlan = plans.find(p => p.popular);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/95 backdrop-blur-sm">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-7xl w-full border border-slate-200 dark:border-slate-700 animate-in zoom-in duration-200">
          {/* Header */}
          <div className="p-6 md:p-8 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-2">
                Escolha seu Plano
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-bold">
                Créditos que nunca expiram. Use quando quiser.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-500 dark:text-slate-400"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Pricing Cards */}
          <div className="p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {plans.map((plan) => {
                const isSelected = selectedPlan?.id === plan.id;
                const isDisabled = isProcessing && !isSelected;
                
                return (
                  <div
                    key={plan.id}
                    className={`relative p-6 md:p-8 rounded-2xl border-2 transition-all ${
                      plan.popular
                        ? 'border-indigo-500 dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20 shadow-xl scale-105'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-600'
                    } ${isDisabled ? 'opacity-50' : ''}`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-indigo-600 dark:bg-indigo-500 text-white text-xs font-black rounded-full">
                        MAIS POPULAR
                      </div>
                    )}

                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                        {plan.name}
                      </h3>
                      <div className="flex items-baseline justify-center gap-2 mb-4">
                        <span className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white">
                          {plan.price}
                        </span>
                        {plan.type === 'subscription' && (
                          <span className="text-sm text-slate-500 dark:text-slate-400 font-bold">
                            /{plan.interval === 'month' ? 'mês' : 'ano'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                          {plan.credits}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 font-bold">
                          créditos
                        </span>
                      </div>
                      {plan.pixBonus && (
                        <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-black inline-block">
                          +{plan.pixBonus} créditos via PIX
                        </div>
                      )}
                    </div>

                    <ul className="space-y-3 mb-6">
                      <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Créditos nunca expiram
                      </li>
                      <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Suporte prioritário
                      </li>
                      <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Acesso a todos os templates
                      </li>
                    </ul>

                    <button
                      onClick={() => handlePurchase(plan)}
                      disabled={isDisabled}
                      className={`w-full py-4 rounded-xl font-black text-white transition-all ${
                        plan.popular
                          ? 'bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600'
                          : 'bg-slate-900 dark:bg-slate-700 hover:bg-indigo-600 dark:hover:bg-indigo-500'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isSelected && isProcessing ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processando...
                        </span>
                      ) : (
                        'Comprar Agora'
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* FAQ Section */}
            <div className="mt-12 pt-12 border-t border-slate-200 dark:border-slate-700">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-8 text-center">
                Perguntas Frequentes
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-black text-slate-900 dark:text-white mb-2">
                      Os créditos expiram?
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Não! Seus créditos nunca expiram. Use quando quiser, no seu ritmo.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 dark:text-white mb-2">
                      Posso comprar mais créditos depois?
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Sim! Você pode comprar mais créditos a qualquer momento. Eles se somam aos que você já tem.
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-black text-slate-900 dark:text-white mb-2">
                      Quais formas de pagamento aceitam?
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Aceitamos cartão de crédito e PIX. Pagamentos via PIX têm bônus de créditos extras!
                    </p>
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 dark:text-white mb-2">
                      Posso cancelar minha assinatura?
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Sim, você pode cancelar a qualquer momento. Seus créditos já adquiridos permanecem válidos.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;

