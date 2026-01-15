
import React from 'react';
import { KeyboardShortcut } from '../hooks/useKeyboardShortcuts';
import BaseModal from './BaseModal';

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: KeyboardShortcut[];
}

const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({
  isOpen,
  onClose,
  shortcuts
}) => {
  const formatKey = (shortcut: KeyboardShortcut): string => {
    const parts: string[] = [];
    if (shortcut.ctrl) parts.push('Ctrl');
    if (shortcut.meta) parts.push('Cmd');
    if (shortcut.shift) parts.push('Shift');
    if (shortcut.alt) parts.push('Alt');
    parts.push(shortcut.key.toUpperCase());
    return parts.join(' + ');
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title="Atalhos de Teclado"
    >
          <div className="space-y-4">
            {shortcuts.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600"
              >
                <div className="flex-1">
                  <p className="font-bold text-slate-900 dark:text-white mb-1">
                    {shortcut.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {shortcut.ctrl && (
                    <kbd className="px-2 py-1 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded text-xs font-bold">
                      Ctrl
                    </kbd>
                  )}
                  {shortcut.meta && (
                    <kbd className="px-2 py-1 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded text-xs font-bold">
                      Cmd
                    </kbd>
                  )}
                  {shortcut.shift && (
                    <kbd className="px-2 py-1 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded text-xs font-bold">
                      Shift
                    </kbd>
                  )}
                  {shortcut.alt && (
                    <kbd className="px-2 py-1 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded text-xs font-bold">
                      Alt
                    </kbd>
                  )}
                  <kbd className="px-3 py-1 bg-indigo-600 dark:bg-indigo-500 text-white rounded text-xs font-bold">
                    {shortcut.key.toUpperCase()}
                  </kbd>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-700">
            <p className="text-sm text-indigo-700 dark:text-indigo-300 font-bold">
              <i className="ri-lightbulb-line inline-block mr-1"></i> Dica: Pressione <kbd className="px-2 py-1 bg-indigo-600 text-white rounded text-xs">?</kbd> a qualquer momento para ver esta ajuda
            </p>
          </div>
        </div>
    </BaseModal>
  );
};

export default KeyboardShortcutsHelp;

