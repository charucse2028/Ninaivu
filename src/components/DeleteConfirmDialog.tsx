import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Language } from '../types';
import { getTranslation } from '../i18n/translations';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  itemName: string;
  language: Language;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  isOpen,
  itemName,
  language,
  onConfirm,
  onCancel,
  isDeleting = false,
}) => {
  if (!isOpen) return null;

  const t = getTranslation(language);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {t.confirmDeleteTitle}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              "{itemName}"
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
          {t.confirmDeleteMsg}
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isDeleting ? t.deleting : t.delete}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
