import React, { useState, useEffect } from 'react';
import { getCurrentUser, updateUserProfile, deleteUserAccount, resetPassword } from '../services/supabaseService';
import { fetchUserInvoices } from '../services/stripeService';
import { getReferralLink, copyReferralLink, getReferralStats } from '../services/referralService';
import { getUserAchievements } from '../services/achievementService';
import { UserProfile as UserProfileType } from '../types';
import { UserAchievement, AchievementLevel, ACHIEVEMENTS } from '../types/achievements';
import PrivacyPolicy from './PrivacyPolicy';
import TermsOfService from './TermsOfService';
import AchievementsGallery from './AchievementsGallery';
import { ProfileSkeleton } from './SkeletonLoader';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: number;
  invoice_pdf?: string;
  hosted_invoice_url?: string;
}

const UserProfile: React.FC<UserProfileProps> = ({ isOpen, onClose, onLogout }) => {
  const [user, setUser] = useState<UserProfileType | null>(null);
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTermsOfService, setShowTermsOfService] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetPasswordSent, setResetPasswordSent] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'invoices' | 'achievements'>('profile');
  const [referralLink, setReferralLink] = useState<string | null>(null);
  const [referralStats, setReferralStats] = useState<{ totalReferrals: number; totalCreditsEarned: number } | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadUserData();
      loadInvoices();
      loadReferralData();
      loadUserAchievements();
    }
  }, [isOpen]);

  const loadUserAchievements = async () => {
    try {
      const achievements = await getUserAchievements();
      setUserAchievements(achievements);
    } catch (error) {
      console.error('Erro ao carregar achievements:', error);
    }
  };

  // Função para obter os 3 melhores achievements (priorizando nível e depois data)
  const getTopAchievements = (): UserAchievement[] => {
    const levelOrder: Record<AchievementLevel, number> = { gold: 3, silver: 2, bronze: 1 };
    
    return [...userAchievements]
      .sort((a, b) => {
        // Primeiro ordena por nível (gold > silver > bronze)
        const levelDiff = levelOrder[b.level] - levelOrder[a.level];
        if (levelDiff !== 0) return levelDiff;
        
        // Se o nível for igual, ordena por data (mais recente primeiro)
        return new Date(b.unlocked_at).getTime() - new Date(a.unlocked_at).getTime();
      })
      .slice(0, 3);
  };

  const loadReferralData = async () => {
    const link = await getReferralLink();
    setReferralLink(link);
    const stats = await getReferralStats();
    setReferralStats(stats);
  };

  const handleCopyLink = async () => {
    const success = await copyReferralLink();
    if (success) {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 3000);
    }
  };

  const loadUserData = async () => {
    setLoading(true);
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setFullName(currentUser.full_name || '');
        setAvatarUrl(currentUser.avatar_url || '');
      }
    } catch (err: any) {
      setError('Erro ao carregar dados do perfil');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadInvoices = async () => {
    try {
      const userInvoices = await fetchUserInvoices();
      setInvoices(userInvoices);
    } catch (err: any) {
      console.error('Erro ao carregar invoices:', err);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const result = await updateUserProfile({
        full_name: fullName,
        avatar_url: avatarUrl
      });

      if (result.success) {
        setSuccess('Perfil atualizado com sucesso!');
        await loadUserData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Erro ao atualizar perfil');
      }
    } catch (err: any) {
      setError('Erro ao salvar alterações');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setSaving(true);
    setError('');

    try {
      const result = await deleteUserAccount();
      if (result.success) {
        onLogout();
        onClose();
      } else {
        setError(result.error || 'Erro ao excluir conta');
        setShowDeleteConfirm(false);
      }
    } catch (err: any) {
      setError('Erro ao excluir conta');
      setShowDeleteConfirm(false);
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Aqui você pode implementar upload para Supabase Storage
    // Por enquanto, vamos usar uma URL temporária ou base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setAvatarUrl(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const result = await resetPassword(user.email);
      
      if (result.success) {
        setResetPasswordSent(true);
        setSuccess('Email de redefinição de senha enviado! Verifique sua caixa de entrada.');
        setTimeout(() => {
          setShowResetPassword(false);
          setResetPasswordSent(false);
          setSuccess('');
        }, 5000);
      } else {
        setError(result.error || 'Erro ao enviar email de redefinição');
      }
    } catch (err: any) {
      setError('Erro ao solicitar redefinição de senha');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency.toUpperCase() === 'USD' ? 'USD' : 'BRL'
    }).format(amount / 100);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white">Meu Perfil</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 px-6 py-4 font-bold transition-colors ${
              activeTab === 'profile'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Perfil
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`flex-1 px-6 py-4 font-bold transition-colors ${
              activeTab === 'invoices'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Faturas
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`flex-1 px-6 py-4 font-bold transition-colors ${
              activeTab === 'achievements'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Conquistas
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-auto p-6 md:p-8">
          {loading ? (
            <ProfileSkeleton />
          ) : activeTab === 'achievements' ? (
            <AchievementsGallery
              isOpen={true}
              onClose={() => setActiveTab('profile')}
              embedded={true}
            />
          ) : activeTab === 'profile' ? (
            <div className="space-y-6 max-w-2xl mx-auto">
              {/* Success/Error Messages */}
              {success && (
                <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                  <p className="text-sm font-bold text-green-700">{success}</p>
                </div>
              )}
              {error && (
                <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                  <p className="text-sm font-bold text-red-700">{error}</p>
                </div>
              )}

              {/* Avatar */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="w-32 h-32 rounded-full object-cover border-4 border-indigo-200"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-indigo-100 flex items-center justify-center border-4 border-indigo-200">
                      <span className="text-4xl font-black text-indigo-600">
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                  <label className="absolute bottom-0 right-0 w-10 h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-sm text-slate-500">Clique no ícone para alterar a foto</p>
              </div>

              {/* Email (read-only) */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                />
                <p className="text-xs text-slate-400 mt-1">O email não pode ser alterado</p>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Nome Completo</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-900"
                />
                {/* Achievements como Medalhas abaixo do nome */}
                {getTopAchievements().length > 0 && (
                  <div className="flex items-center justify-center gap-3 mt-4">
                    {getTopAchievements().map((userAch) => {
                      const achievement = ACHIEVEMENTS[userAch.achievement_id];
                      if (!achievement) return null;
                      
                      const getLevelColor = (level: AchievementLevel) => {
                        switch (level) {
                          case 'gold': return 'text-yellow-500';
                          case 'silver': return 'text-slate-400';
                          case 'bronze': return 'text-amber-600';
                          default: return 'text-slate-400';
                        }
                      };
                      
                      return (
                        <div
                          key={userAch.id}
                          className={`relative group ${getLevelColor(userAch.level)}`}
                          title={`${achievement.name} (${userAch.level === 'gold' ? 'Ouro' : userAch.level === 'silver' ? 'Prata' : 'Bronze'})`}
                        >
                          <div className="text-3xl filter drop-shadow-lg">
                            {achievement.icon}
                          </div>
                          {/* Badge de nível */}
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center border-2 border-current text-xs font-black">
                            {userAch.level === 'gold' ? '🥇' : userAch.level === 'silver' ? '🥈' : '🥉'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Save Button */}
              <div className="pt-4">
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>

              {/* Referral Section */}
              <div className="pt-6 border-t border-slate-200 dark:border-slate-700 space-y-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Programa de Afiliados</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Convide pessoas e ganhe <strong className="text-indigo-600 dark:text-indigo-400">5 créditos</strong> para cada cadastro confirmado!
                  </p>
                </div>
                <div className="p-5 sm:p-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl border-2 border-indigo-200 dark:border-indigo-700 space-y-5">
                  <div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                      Seu Link de Convite
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={referralLink || 'Carregando...'}
                        readOnly
                        className="flex-1 px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-lg text-sm font-mono text-slate-600 dark:text-slate-300 break-all"
                      />
                      <button
                        onClick={handleCopyLink}
                        className={`px-6 py-3 rounded-lg font-black text-sm transition-all whitespace-nowrap flex items-center justify-center gap-2 ${
                          linkCopied
                            ? 'bg-green-500 hover:bg-green-600 text-white'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl'
                        }`}
                      >
                        {linkCopied ? (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            Copiado!
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copiar Link
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {referralStats && (
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                          Convites
                        </p>
                        <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                          {referralStats.totalReferrals}
                        </p>
                      </div>
                      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                          Créditos Ganhos
                        </p>
                        <p className="text-2xl font-black text-green-600 dark:text-green-400">
                          +{referralStats.totalCreditsEarned}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="pt-3 border-t border-indigo-200 dark:border-indigo-700">
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 space-y-2">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        💡 Como funciona:
                      </p>
                      <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-disc list-inside">
                        <li>Compartilhe seu link único com amigos e colegas</li>
                        <li>Quando alguém se cadastrar usando seu link e confirmar o email</li>
                        <li>Você recebe <strong className="text-indigo-600 dark:text-indigo-400">5 créditos</strong> automaticamente na sua conta!</li>
                      </ul>
                      <div className="pt-2 mt-3 border-t border-slate-200 dark:border-slate-700">
                        <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          🎁 Quanto mais você convida, mais créditos você ganha!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Section */}
              <div className="pt-6 border-t border-slate-200 dark:border-slate-700 space-y-3">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Segurança</h3>
                {!showResetPassword ? (
                  <button
                    onClick={() => setShowResetPassword(true)}
                    className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all text-left flex items-center gap-3"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    Redefinir Senha
                  </button>
                ) : (
                  <div className="space-y-3 p-4 bg-indigo-50 border-2 border-indigo-200 rounded-xl">
                    {resetPasswordSent ? (
                      <div className="space-y-2">
                        <p className="text-sm font-bold text-indigo-900">
                          ✓ Email enviado com sucesso!
                        </p>
                        <p className="text-xs text-indigo-700">
                          Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm font-bold text-indigo-900">
                          Enviar email de redefinição de senha?
                        </p>
                        <p className="text-xs text-indigo-700">
                          Um email será enviado para <strong>{user?.email}</strong> com instruções para redefinir sua senha.
                        </p>
                        <div className="flex gap-3">
                          <button
                            onClick={handleResetPassword}
                            disabled={saving}
                            className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all disabled:opacity-50"
                          >
                            {saving ? 'Enviando...' : 'Enviar Email'}
                          </button>
                          <button
                            onClick={() => {
                              setShowResetPassword(false);
                              setError('');
                              setSuccess('');
                            }}
                            disabled={saving}
                            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-all"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Legal Links */}
              <div className="pt-6 border-t border-slate-200 space-y-3">
                <h3 className="text-lg font-black text-slate-900">Documentos Legais</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setShowPrivacyPolicy(true)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all text-left"
                  >
                    Política de Privacidade
                  </button>
                  <button
                    onClick={() => setShowTermsOfService(true)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all text-left"
                  >
                    Termos de Uso
                  </button>
                </div>
              </div>

              {/* Delete Account */}
              <div className="pt-6 border-t border-red-200">
                <h3 className="text-lg font-black text-red-600 mb-3">Zona de Perigo</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Ao excluir sua conta, todos os seus dados serão permanentemente removidos. Esta ação não pode ser desfeita.
                </p>
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all"
                  >
                    Excluir Conta
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm font-bold text-red-600">Tem certeza que deseja excluir sua conta?</p>
                    <div className="flex gap-3">
                      <button
                        onClick={handleDeleteAccount}
                        disabled={saving}
                        className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all disabled:opacity-50"
                      >
                        {saving ? 'Excluindo...' : 'Sim, excluir conta'}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={saving}
                        className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-all"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-slate-500 font-medium">Nenhuma fatura encontrada</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="p-6 bg-slate-50 border-2 border-slate-200 rounded-xl hover:shadow-lg transition-all"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                          <p className="text-sm text-slate-500 mb-1">Fatura #{invoice.id.slice(-8)}</p>
                          <p className="text-2xl font-black text-slate-900">
                            {formatCurrency(invoice.amount, invoice.currency)}
                          </p>
                          <p className="text-sm text-slate-500 mt-1">
                            {formatDate(invoice.created)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-4 py-2 rounded-xl font-bold text-sm ${
                              invoice.status === 'paid'
                                ? 'bg-green-100 text-green-700'
                                : invoice.status === 'open'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {invoice.status === 'paid' ? 'Pago' : invoice.status === 'open' ? 'Aberto' : 'Falhou'}
                          </span>
                          {invoice.hosted_invoice_url && (
                            <a
                              href={invoice.hosted_invoice_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all text-sm"
                            >
                              Ver Fatura
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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

      {/* Achievements Gallery Modal */}
      {showAchievements && (
        <AchievementsGallery
          isOpen={showAchievements}
          onClose={() => setShowAchievements(false)}
        />
      )}
    </div>
  );
};

export default UserProfile;

