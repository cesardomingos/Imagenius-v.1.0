
import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { UserProfile } from '../types';
import { getUserAchievements } from '../services/achievementService';
import { UserAchievement, AchievementLevel, ACHIEVEMENTS } from '../types/achievements';
import Tooltip from './Tooltip';

interface HeaderProps {
  onReset: () => void;
  hasImages: boolean;
  goToGallery: () => void;
  credits: number;
  onOpenStore: () => void;
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenProfile: () => void;
  hasNewAchievement?: boolean;
  onOpenAbout?: () => void;
  onOpenFAQ?: () => void;
  onOpenTutorial?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onReset, hasImages, goToGallery, credits, onOpenStore, currentUser, onOpenAuth, onLogout, onOpenProfile, hasNewAchievement = false, onOpenAbout, onOpenFAQ, onOpenTutorial }) => {
  const { theme, toggleTheme } = useTheme();
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadUserAchievements();
    } else {
      setUserAchievements([]);
    }
  }, [currentUser]);

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
  
  const handleLogoClick = () => {
    try {
      // Tentar executar o reset normalmente
      onReset();
    } catch (error) {
      // Se houver qualquer erro, garantir que volta para a home
      console.error('Erro ao resetar via logo:', error);
      try {
        // Tentar navegar para a home via window.location
        window.location.href = '/';
      } catch (fallbackError) {
        // Último recurso: recarregar a página
        console.error('Erro crítico ao navegar para home:', fallbackError);
        window.location.reload();
      }
    }
  };

  return (
    <>
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 sticky top-0 z-40">
        <div className="container mx-auto px-3 sm:px-4 h-16 sm:h-20 flex items-center justify-between">
          {/* Logo - Mobile: menor, Desktop: normal */}
          <div className="flex items-center gap-3 md:gap-5 cursor-pointer group" onClick={handleLogoClick}>
            <div className="relative w-10 h-10 md:w-12 md:h-12 flex items-center justify-center">
              <div className="absolute w-3 h-3 bg-genius-gradient rounded-full shadow-lg z-20 shadow-indigo-500/50"></div>
              <div className="absolute inset-0 border-[2.5px] border-indigo-600/20 rounded-[40%] animate-orbit-slow"></div>
              <div className="absolute inset-2 border-[2.5px] border-purple-500/20 rounded-[40%] rotate-45 animate-orbit-fast"></div>
            </div>
            
            <div className="flex flex-col">
              <h1 className="font-black text-base sm:text-lg md:text-xl lg:text-2xl tracking-tighter leading-none flex items-baseline">
                  <span className="text-genius-gradient">Ima</span>
                  <span className="text-slate-900 dark:text-white">genius</span>
              </h1>
              <span className="text-[6px] sm:text-[7px] md:text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] sm:tracking-[0.4em] mt-0.5 sm:mt-1 md:mt-1.5 ml-0.5">
                  Generative Atelier
              </span>
            </div>
          </div>

        <nav className="flex items-center gap-4 md:gap-6 lg:gap-8">
          {/* Quote/Tagline */}
          <div className="hidden lg:block">
             <p className="text-[11px] font-mono-genius text-slate-400 dark:text-slate-500">
                <span className="text-indigo-600 dark:text-indigo-400">I'm</span> a genius, and <span className="text-indigo-600 dark:text-indigo-400">you</span> are too.
             </p>
          </div>

          {/* Theme Toggle - Hidden on mobile */}
          <button
            onClick={toggleTheme}
            className="hidden md:flex w-10 h-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all"
            title={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
          >
            {theme === 'light' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </button>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center gap-4">
            {/* Sobre Button */}
            {onOpenAbout && (
              <button
                onClick={onOpenAbout}
                className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold text-xs uppercase tracking-widest transition-colors"
              >
                Sobre
              </button>
            )}
            {/* FAQ Button */}
            {onOpenFAQ && (
              <button
                onClick={onOpenFAQ}
                className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold text-xs uppercase tracking-widest transition-colors"
              >
                FAQ
              </button>
            )}

            {/* Galeria Button */}
            {hasImages && (
              <button 
                onClick={goToGallery}
                className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold text-xs uppercase tracking-widest transition-colors"
              >
                Galeria
              </button>
            )}
          </div>

          {/* Novo + Button - Desktop */}
          <Tooltip content="Iniciar um novo projeto. Isso limpará todas as imagens e prompts atuais.">
            <button 
              onClick={onReset}
              className="hidden md:flex bg-slate-900 dark:bg-slate-800 hover:bg-indigo-600 dark:hover:bg-indigo-700 text-white px-6 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 items-center gap-2"
            >
              Novo
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
            </button>
          </Tooltip>

          {/* Credit Counter - Sempre visível no topo direito */}
          <Tooltip content="Seus créditos disponíveis. 1 crédito = 1 imagem gerada. Clique para comprar mais créditos.">
            <div 
              onClick={onOpenStore}
              className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-1.5 md:py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl md:rounded-2xl cursor-pointer hover:border-indigo-200 dark:hover:border-indigo-700 transition-all group"
            >
              <div className="flex flex-col items-end">
                <span className="text-[8px] md:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Créditos (1 = 1 imagem)</span>
                <span className="text-xs md:text-sm font-black text-slate-900 dark:text-white">{credits}</span>
              </div>
              <div className="w-7 h-7 md:w-8 md:h-8 bg-genius-gradient rounded-lg md:rounded-xl flex items-center justify-center text-white shadow shadow-indigo-100/50 group-hover:scale-110 transition-transform">
                <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
              </div>
            </div>
          </Tooltip>

          {/* User Info & Actions - Desktop */}
          <div className="hidden md:flex items-center gap-3">
            {currentUser ? (
              <>
                <button
                  onClick={onOpenProfile}
                  className="relative px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-indigo-200 dark:hover:border-indigo-700 transition-all cursor-pointer"
                >
                  {hasNewAchievement && (
                    <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
                  )}
                  <div className="flex flex-col items-start">
                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Usuário</p>
                    <p className="text-xs font-black text-slate-900 dark:text-white truncate max-w-[120px]">{currentUser.email}</p>
                    {/* Achievements como Medalhas */}
                    {getTopAchievements().length > 0 && (
                      <div className="flex items-center gap-1.5 mt-1">
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
                              <div className="text-lg filter drop-shadow-md">
                                {achievement.icon}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </button>
                <button 
                  onClick={onLogout}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-500 font-bold text-xs uppercase tracking-widest transition-colors"
                >
                  Sair
                </button>
              </>
            ) : (
              <button 
                onClick={onOpenAuth}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95"
              >
                Entrar
              </button>
            )}
          </div>

        </nav>
      </div>
    </header>

    {/* Mobile Bottom Navigation Bar */}
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-700 z-[100] safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-1">
        {/* Home */}
        <button
          onClick={handleLogoClick}
          className="flex flex-col items-center justify-center gap-0.5 px-1.5 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all flex-1 min-w-0"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-[9px] font-black uppercase tracking-wider">Home</span>
        </button>

        {/* Galeria */}
        <button
          onClick={goToGallery}
          disabled={!hasImages}
          className={`flex flex-col items-center justify-center gap-0.5 px-1.5 py-2 rounded-xl transition-all flex-1 min-w-0 ${
            hasImages 
              ? 'text-indigo-600 dark:text-indigo-400' 
              : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-[9px] font-black uppercase tracking-wider">Galeria</span>
        </button>

        {/* Gerar Novo - Central e Destaque */}
        <button
          onClick={onReset}
          className="flex flex-col items-center justify-center gap-0.5 px-2 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-2xl shadow-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all active:scale-95 mx-1"
        >
          <div className="w-7 h-7 bg-white/20 rounded-xl flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="text-[9px] font-black uppercase tracking-wider">Novo</span>
        </button>

        {/* Perfil */}
        <button
          onClick={() => {
            if (currentUser) {
              onOpenProfile();
            } else {
              onOpenAuth();
            }
          }}
          className="flex flex-col items-center justify-center gap-0.5 px-1.5 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all relative flex-1 min-w-0"
        >
          {hasNewAchievement && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
          )}
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-[9px] font-black uppercase tracking-wider">Perfil</span>
        </button>

        {/* Configurações */}
        <div className="relative flex-1 min-w-0">
          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="flex flex-col items-center justify-center gap-0.5 px-1.5 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all w-full"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-[9px] font-black uppercase tracking-wider">Config</span>
          </button>

          {/* Menu de Configurações Dropdown */}
          {isSettingsOpen && (
            <>
              {/* Overlay para fechar ao clicar fora */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsSettingsOpen(false)}
              />
              
              {/* Menu Dropdown */}
              <div className="absolute bottom-full right-0 mb-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
                {/* Tutorial */}
                {onOpenTutorial && (
                  <button
                    onClick={() => {
                      onOpenTutorial();
                      setIsSettingsOpen(false);
                    }}
                    className="w-full px-4 py-3 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-3"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <span className="font-bold text-sm">Abrir Tutorial</span>
                  </button>
                )}

                {/* Tema Dark/Light */}
                <button
                  onClick={() => {
                    toggleTheme();
                    setIsSettingsOpen(false);
                  }}
                  className="w-full px-4 py-3 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-3 border-t border-slate-200 dark:border-slate-700"
                >
                  {theme === 'light' ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                      <span className="font-bold text-sm">Modo Escuro</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <span className="font-bold text-sm">Modo Claro</span>
                    </>
                  )}
                </button>

                {/* Sair */}
                {currentUser && (
                  <button
                    onClick={() => {
                      onLogout();
                      setIsSettingsOpen(false);
                    }}
                    className="w-full px-4 py-3 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-3 border-t border-slate-200 dark:border-slate-700"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="font-bold text-sm">Sair</span>
                  </button>
                )}

                {/* Entrar (se não estiver logado) */}
                {!currentUser && (
                  <button
                    onClick={() => {
                      onOpenAuth();
                      setIsSettingsOpen(false);
                    }}
                    className="w-full px-4 py-3 text-left text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors flex items-center gap-3 border-t border-slate-200 dark:border-slate-700"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    <span className="font-bold text-sm">Entrar</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
    </>
  );
};

export default Header;
