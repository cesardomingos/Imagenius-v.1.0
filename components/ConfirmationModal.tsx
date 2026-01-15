
import React from 'react';
import BaseModal from './BaseModal';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  variant = 'warning'
}) => {
  const variantStyles = {
    danger: {
      button: 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600',
      icon: 'ri-error-warning-line'
    },
    warning: {
      button: 'bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600',
      icon: 'ri-alert-line'
    },
    info: {
      button: 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600',
      icon: 'ri-information-line'
    }
  };

  const styles = variantStyles[variant];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onCancel}
      size="sm"
      showCloseButton={false}
    >
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-5xl mb-4">
            {typeof styles.icon === 'string' && styles.icon.startsWith('ri-') ? (
              <i className={styles.icon}></i>
            ) : (
              styles.icon
            )}
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
            {title}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            {message}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-black rounded-xl transition-all"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-6 py-3 ${styles.button} text-white font-black rounded-xl transition-all shadow-lg hover:scale-105 active:scale-95`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

export default ConfirmationModal;

