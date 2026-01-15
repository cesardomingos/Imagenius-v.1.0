
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string | React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
  full: 'max-w-full mx-4'
};

const BaseModal: React.FC<BaseModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  size = 'md',
  showCloseButton = true,
  className = ''
}) => {
  // Bloquear scroll do body quando modal estiver aberto
  useEffect(() => {
    if (isOpen) {
      // Salvar scroll atual
      const scrollY = window.scrollY;
      // Bloquear scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        // Restaurar scroll ao fechar
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // Fechar ao pressionar ESC
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        // Fechar ao clicar no overlay (fora do modal)
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Overlay com backdrop blur */}
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" />

      {/* Modal Content */}
      <div
        className={`
          relative w-full ${sizeClasses[size]} max-h-[90vh] 
          bg-white dark:bg-slate-900 
          rounded-2xl md:rounded-3xl 
          shadow-2xl 
          border border-slate-200 dark:border-slate-700
          overflow-hidden
          flex flex-col
          animate-in fade-in zoom-in-95 duration-200
          ${className}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            {title && (
              <div className="flex-1">
                {typeof title === 'string' ? (
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
                    {title}
                  </h2>
                ) : (
                  title
                )}
              </div>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="ml-auto w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition-all hover:scale-110 active:scale-95"
                aria-label="Fechar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="p-3 sm:p-4 md:p-6">
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default BaseModal;


