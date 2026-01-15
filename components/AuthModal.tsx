import React, { useState, useEffect } from 'react';
import { signIn, signUp, resetPassword, resendConfirmationEmail } from '../services/supabaseService';
import { UserProfile } from '../types';
import { getReferralCodeFromUrl } from '../services/referralService';
import PrivacyPolicy from './PrivacyPolicy';
import TermsOfService from './TermsOfService';
import BaseModal from './BaseModal';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserProfile) => void;
}

type AuthMode = 'login' | 'signup';

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [privacyOptIn, setPrivacyOptIn] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTermsOfService, setShowTermsOfService] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetPasswordSent, setResetPasswordSent] = useState(false);
  const [showResendConfirmation, setShowResendConfirmation] = useState(false);
  const [confirmationEmailSent, setConfirmationEmailSent] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);

  // Capturar código de referência da URL quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      const code = getReferralCodeFromUrl();
      setReferralCode(code);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          setError('As senhas não coincidem');
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('A senha deve ter pelo menos 6 caracteres');
          setIsLoading(false);
          return;
        }
      }

      // Autenticação via Supabase
      const result = mode === 'login' 
        ? await signIn(email, password)
        : await signUp(email, password, privacyOptIn, referralCode || undefined);

      if (result.error) {
        // No signup, verificar se o erro é porque já existe uma conta (possivelmente não confirmada)
        if (mode === 'signup' && result.error === 'EMAIL_ALREADY_EXISTS') {
          // Mostrar opção de reenviar email de confirmação
          setShowResendConfirmation(true);
          setError('');
        } else {
          // Para login ou outros erros, mostrar erro normalmente
          setError(result.error);
        }
        setIsLoading(false);
        return;
      }

      if (result.user) {
        onAuthSuccess(result.user);
        handleClose();
      } else if (mode === 'signup') {
        // Após cadastro bem-sucedido, mostrar mensagem de confirmação
        setError('');
        setShowResendConfirmation(true);
        setConfirmationEmailSent(true);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer autenticação. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setPrivacyOptIn(false);
    setMode('login');
    onClose();
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError('');
    setPassword('');
    setConfirmPassword('');
    setShowForgotPassword(false);
    setResetPasswordSent(false);
    setShowResendConfirmation(false);
    setConfirmationEmailSent(false);
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      setError('Por favor, informe seu email');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await resendConfirmationEmail(email);
      
      if (result.error) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      setConfirmationEmailSent(true);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Erro ao reenviar email de confirmação. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await resetPassword(email);
      
      if (result.error) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      setResetPasswordSent(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar email de redefinição. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      size="md"
      showCloseButton={false}
      className="p-0"
    >
      {/* Header Customizado */}
      <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 sm:p-8 -m-6 mb-0">
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            {mode === 'login' ? 'Bem-vindo de volta!' : 'Crie sua conta'}
          </h2>
          <p className="text-white/90 text-sm">
            {mode === 'login' 
              ? 'Entre para continuar criando' 
              : 'Comece sua jornada criativa agora'}
          </p>
        </div>
      </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none transition-all text-slate-900 dark:text-white font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
                placeholder="seu@email.com"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                  Senha
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold transition-colors"
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={!showForgotPassword}
                minLength={6}
                disabled={showForgotPassword}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none transition-all text-slate-900 dark:text-white font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="••••••••"
              />
            </div>

            {/* Confirm Password (Signup only) */}
            {mode === 'signup' && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-bold text-slate-700 mb-2">
                  Confirmar Senha
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-900 font-medium"
                  placeholder="••••••••"
                />
              </div>
            )}

            {/* Privacy Opt-in (Signup only) */}
            {mode === 'signup' && (
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={privacyOptIn}
                    onChange={(e) => setPrivacyOptIn(e.target.checked)}
                    required
                    className="mt-1 w-5 h-5 text-indigo-600 border-2 border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 cursor-pointer"
                  />
                  <span className="text-sm text-slate-700 leading-relaxed">
                    Eu concordo com os{' '}
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
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border-2 border-red-200 rounded-xl">
                <p className="text-sm font-bold text-red-600">{error}</p>
              </div>
            )}

            {/* Resend Confirmation Email */}
            {showResendConfirmation && (
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-200 dark:border-indigo-700 rounded-xl space-y-3">
                {confirmationEmailSent ? (
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-indigo-900 dark:text-indigo-100">
                      <i className="ri-check-line inline-block mr-1"></i> Email de confirmação enviado!
                    </p>
                    <p className="text-xs text-indigo-700 dark:text-indigo-300">
                      Verifique sua caixa de entrada e spam. Clique no link de confirmação para ativar sua conta.
                    </p>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2">
                      Não recebeu? Aguarde alguns minutos e tente novamente.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowResendConfirmation(false);
                        setConfirmationEmailSent(false);
                        setError('');
                        if (mode === 'signup') {
                          setMode('login');
                        }
                      }}
                      className="w-full mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-bold rounded-xl transition-all"
                    >
                      {mode === 'signup' ? 'Fazer Login' : 'Voltar ao Login'}
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-bold text-indigo-900 dark:text-indigo-100">
                      Conta já existe
                    </p>
                    <p className="text-xs text-indigo-700 dark:text-indigo-300">
                      Já existe uma conta com este email. Se você ainda não confirmou seu email, clique no botão abaixo para receber um novo email de confirmação.
                    </p>
                    <button
                      type="button"
                      onClick={handleResendConfirmation}
                      disabled={isLoading || !email}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Enviando...' : 'Reenviar Email de Confirmação'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowResendConfirmation(false);
                        setError('');
                      }}
                      className="w-full py-2 text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 font-bold text-sm transition-colors"
                    >
                      Cancelar
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Forgot Password Form */}
            {showForgotPassword && !showResendConfirmation && (
              <div className="p-4 bg-indigo-50 border-2 border-indigo-200 rounded-xl space-y-3">
                {resetPasswordSent ? (
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-indigo-900">
                      <i className="ri-check-line inline-block mr-1"></i> Email enviado com sucesso!
                    </p>
                    <p className="text-xs text-indigo-700">
                      Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setResetPasswordSent(false);
                        setError('');
                      }}
                      className="w-full mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all"
                    >
                      Voltar ao Login
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-bold text-indigo-900">
                      Redefinir Senha
                    </p>
                    <p className="text-xs text-indigo-700">
                      Digite seu email e enviaremos um link para redefinir sua senha.
                    </p>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={isLoading || !email}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Enviando...' : 'Enviar Email de Redefinição'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setError('');
                      }}
                      className="w-full py-2 text-slate-600 hover:text-slate-700 font-bold text-sm transition-colors"
                    >
                      Cancelar
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Submit Button */}
            {!showForgotPassword && !showResendConfirmation && (
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processando...
                  </span>
                ) : (
                  mode === 'login' ? 'Entrar' : 'Criar Conta'
                )}
              </button>
            )}
          </form>

          {/* Switch Mode */}
          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-600">
              {mode === 'login' ? 'Não tem uma conta? ' : 'Já tem uma conta? '}
              <button
                onClick={switchMode}
                className="text-indigo-600 hover:text-indigo-700 font-black transition-colors"
              >
                {mode === 'login' ? 'Cadastre-se' : 'Entre'}
              </button>
            </p>
          </div>

          {/* Security Info */}
          <div className="mt-6 p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium">
                Seus dados estão protegidos com criptografia de ponta
              </p>
            </div>
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

export default AuthModal;

