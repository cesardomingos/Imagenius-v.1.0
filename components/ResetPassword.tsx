import React, { useState, useEffect } from 'react';
import { updatePassword } from '../services/supabaseService';

interface ResetPasswordProps {
  onSuccess?: () => void;
}

const ResetPassword: React.FC<ResetPasswordProps> = ({ onSuccess }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Verificar se há token de redefinição na URL
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('access_token');
    const type = urlParams.get('type');
    
    if (!accessToken || type !== 'recovery') {
      setError('Link inválido ou expirado. Por favor, solicite um novo link de redefinição.');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      const result = await updatePassword(password);
      
      if (result.success) {
        setSuccess(true);
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 3000);
        }
      } else {
        setError(result.error || 'Erro ao redefinir senha');
      }
    } catch (err: any) {
      setError('Erro ao redefinir senha. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Senha Redefinida!</h2>
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            Sua senha foi redefinida com sucesso. Você pode fazer login agora.
          </p>
          {onSuccess && (
            <p className="text-sm text-slate-500 dark:text-slate-400">Redirecionando...</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 max-w-md w-full">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Redefinir Senha</h2>
        <p className="text-slate-600 dark:text-slate-300 mb-6">Digite sua nova senha abaixo.</p>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-800 rounded-xl mb-4">
            <p className="text-sm font-bold text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Nova Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Confirmar Nova Senha
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white font-black rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Redefinindo...' : 'Redefinir Senha'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;

