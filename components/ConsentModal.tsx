import React, { useState } from 'react';
import PrivacyPolicy from './PrivacyPolicy';
import TermsOfService from './TermsOfService';
import { updatePrivacyConsent } from '../services/supabaseService';

interface ConsentModalProps {
  isOpen: boolean;
  isPolicyUpdate?: boolean;
  onAccept: () => void;
  onDecline?: () => void;
}

const ConsentModal: React.FC<ConsentModalProps> = ({ 
  isOpen, 
  isPolicyUpdate = false,
  onAccept, 
  onDecline 
}) => {
  const [privacyOptIn, setPrivacyOptIn] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTermsOfService, setShowTermsOfService] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAccept = async () => {
    if (!privacyOptIn) {
      setError('Você precisa aceitar os termos para continuar usando a plataforma.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const result = await updatePrivacyConsent(true);
      
      if (result.success) {
        onAccept();
      } else {
        setError(result.error || 'Erro ao salvar consentimento. Tente novamente.');
        setSaving(false);
      }
    } catch (err: any) {
      setError('Erro ao processar consentimento. Tente novamente.');
      setSaving(false);
      console.error(err);
    }
  };

  const handleDecline = () => {
    if (onDecline) {
      onDecline();
    } else {
      // Se não houver callback de decline, apenas fecha
      // Em produção, você pode querer fazer logout do usuário
      onAccept(); // Por enquanto, apenas fecha
    }
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                {isPolicyUpdate ? 'Políticas Atualizadas' : 'Consentimento de Privacidade'}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                {isPolicyUpdate 
                  ? 'Nossas políticas foram atualizadas. Por favor, revise e aceite os novos termos.'
                  : 'Precisamos do seu consentimento para continuar'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-auto p-6 md:p-8">
          <div className="space-y-6">
            {isPolicyUpdate && (
              <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-bold text-blue-900 mb-1">O que mudou?</p>
                    <p className="text-xs text-blue-700">
                      Atualizamos nossa Política de Privacidade e Termos de Uso para melhor refletir nossas práticas e garantir maior transparência sobre como tratamos seus dados pessoais.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <p className="text-slate-700 leading-relaxed">
                Para continuar usando o Imagenius, precisamos do seu consentimento para o tratamento dos seus dados pessoais conforme a Lei Geral de Proteção de Dados (LGPD).
              </p>

              <div className="p-4 bg-slate-50 rounded-xl border-2 border-slate-200">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={privacyOptIn}
                    onChange={(e) => {
                      setPrivacyOptIn(e.target.checked);
                      setError('');
                    }}
                    className="mt-1 w-5 h-5 text-indigo-600 border-2 border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 cursor-pointer"
                  />
                  <span className="text-sm text-slate-700 leading-relaxed">
                    Eu li e concordo com os{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowTermsOfService(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-700 font-bold underline"
                    >
                      Termos de Uso
                    </button>
                    {' '}e{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowPrivacyPolicy(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-700 font-bold underline"
                    >
                      Política de Privacidade
                    </button>
                    {' '}e autorizo o tratamento dos meus dados pessoais conforme a LGPD.
                  </span>
                </label>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                  <p className="text-sm font-bold text-red-600">{error}</p>
                </div>
              )}

              <div className="pt-4 space-y-3">
                <p className="text-xs text-slate-500 leading-relaxed">
                  <strong>Importante:</strong> Ao aceitar, você concorda com o tratamento dos seus dados pessoais para os fins descritos nas políticas. Você pode revogar seu consentimento a qualquer momento através das configurações do seu perfil.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 flex items-center justify-between gap-4">
          {onDecline && (
            <button
              onClick={handleDecline}
              disabled={saving}
              className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-all disabled:opacity-50"
            >
              Recusar
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={handleAccept}
            disabled={saving || !privacyOptIn}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Salvando...
              </>
            ) : (
              'Aceitar e Continuar'
            )}
          </button>
        </div>
      </div>

      {/* Privacy Policy Modal */}
      {showPrivacyPolicy && (
        <PrivacyPolicy onClose={() => setShowPrivacyPolicy(false)} />
      )}

      {/* Terms of Service Modal */}
      {showTermsOfService && (
        <TermsOfService onClose={() => setShowTermsOfService(false)} />
      )}
    </div>
  );
};

export default ConsentModal;

