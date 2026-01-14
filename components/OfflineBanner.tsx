
import React from 'react';

interface OfflineBannerProps {
  isVisible: boolean;
  onDismiss?: () => void;
}

const OfflineBanner: React.FC<OfflineBannerProps> = ({ isVisible, onDismiss }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed top-20 left-0 right-0 z-50 px-4 animate-in slide-in-from-top duration-500">
      <div className="max-w-4xl mx-auto bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-400 dark:bg-yellow-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-900 dark:text-yellow-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="font-black text-yellow-900 dark:text-yellow-100 text-sm">
                Você está offline
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                Algumas funcionalidades não estão disponíveis. Verifique sua conexão.
              </p>
            </div>
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-yellow-700 dark:text-yellow-300 hover:text-yellow-900 dark:hover:text-yellow-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfflineBanner;

