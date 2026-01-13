
import React from 'react';
import { PricingPlan } from '../types';

interface PricingModalProps {
  onClose: () => void;
  onSelectPlan: (plan: PricingPlan) => void;
}

const PLANS: PricingPlan[] = [
  { id: 'starter', name: 'Aprendiz', credits: 20, price: 'R$ 19,90' },
  { id: 'genius', name: 'Gênio', credits: 100, price: 'R$ 69,90', popular: true },
  { id: 'master', name: 'Imortal', credits: 300, price: 'R$ 149,90' },
];

const PricingModal: React.FC<PricingModalProps> = ({ onClose, onSelectPlan }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="relative bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        <div className="absolute top-8 right-8 z-10">
           <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-2xl transition-all">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
           </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Banner Lateral */}
          <div className="lg:col-span-4 bg-slate-900 p-12 flex flex-col justify-between text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="relative z-10 space-y-6">
               <div className="w-12 h-12 border-2 border-indigo-500/50 rounded-2xl flex items-center justify-center">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div>
               </div>
               <h2 className="text-4xl font-black tracking-tighter leading-tight">Potencialize sua <span className="text-indigo-400">Genialidade.</span></h2>
               <p className="text-slate-400 text-sm font-medium leading-relaxed italic">"I'm a genius, and you are too. Mas até gênios precisam de combustível."</p>
            </div>

            <div className="relative z-10 space-y-4 pt-12">
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
          <div className="lg:col-span-8 p-8 md:p-14 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {PLANS.map((plan) => (
                <div 
                  key={plan.id}
                  onClick={() => onSelectPlan(plan)}
                  className={`relative p-8 rounded-[2.5rem] border-2 transition-all cursor-pointer group flex flex-col justify-between ${
                    plan.popular 
                      ? 'border-indigo-600 bg-indigo-50/10 shadow-xl shadow-indigo-100' 
                      : 'border-slate-100 hover:border-indigo-200'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                      Mais Escolhido
                    </div>
                  )}

                  <div className="space-y-4">
                    <h3 className="text-lg font-black text-slate-900">{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900">{plan.credits}</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase">Imagens</span>
                    </div>
                  </div>

                  <div className="mt-10 space-y-4">
                    <div className="text-2xl font-black text-slate-900">{plan.price}</div>
                    <button className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                      plan.popular ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-900 text-white'
                    } group-hover:scale-[1.05]`}>
                      Selecionar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 flex flex-col md:flex-row items-center justify-between p-8 bg-slate-50 rounded-[2rem] gap-6">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center">
                    <svg className="w-6 h-6 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Ambiente Blindado</p>
                    <p className="text-[11px] text-slate-400 font-medium">Suas informações estão protegidas por criptografia de ponta.</p>
                  </div>
               </div>
               <div className="flex items-center gap-4 grayscale opacity-40">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-5" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_Pix_Brasil.png" alt="PIX" className="h-5" />
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingModal;
