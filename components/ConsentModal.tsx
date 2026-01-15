import React, { useState } from 'react';
import PrivacyPolicy from './PrivacyPolicy';
import TermsOfService from './TermsOfService';
import { updatePrivacyConsent } from '../services/supabaseService';
import BaseModal from './BaseModal';

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
    <BaseModal
      isOpen={isOpen}
      onClose={onDecline || onAccept}
      size="md"
      showCloseButton={false}
      title={
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
      }
    >
      <div className="flex flex-col h-full">
        {/* Content */}
        <div className="flex-1 overflow-y-auto -mx-6 -my-6 px-6 py-6">
          <div className="space-y-6">
            {isPolicyUpdate && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-1">O que mudou?</p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Atualizamos nossa Política de Privacidade e Termos de Uso para melhor refletir nossas práticas e garantir maior transparência sobre como tratamos seus dados pessoais.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                Para continuar usando o Imagenius, precisamos do seu consentimento para o tratamento dos seus dados pessoais conforme a Lei Geral de Proteção de Dados (LGPD).
              </p>

              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={privacyOptIn}
                    onChange={(e) => {
                      setPrivacyOptIn(e.target.checked);
                      setError('');
                    }}
                    className="mt-1 w-5 h-5 text-indigo-600 border-2 border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 cursor-pointer"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    Eu li e concordo com os{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowTermsOfService(true);
                      }}
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold underline"
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
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold underline"
                    >
                      Política de Privacidade
                    </button>
                    {' '}e autorizo o tratamento dos meus dados pessoais conforme a LGPD.
                  </span>
                </label>
              </div>

              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl">
                  <p className="text-sm font-bold text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <div className="pt-4 space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  <strong>Importante:</strong> Ao aceitar, você concorda com o tratamento dos seus dados pessoais para os fins descritos nas políticas. Você pode revogar seu consentimento a qualquer momento através das configurações do seu perfil.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 dark:border-slate-700 -mx-6 -mb-6 px-6 py-4 flex items-center justify-between gap-4">
          {onDecline && (
            <button
              onClick={handleDecline}
              disabled={saving}
              className="px-6 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-all disabled:opacity-50"
            >
              Recusar
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={handleAccept}
            disabled={saving || !privacyOptIn}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
    </BaseModal>
  );
};

export default ConsentModal;

