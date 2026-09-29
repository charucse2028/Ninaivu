import React from 'react';
import { LogOut, ShieldCheck, X } from 'lucide-react';
import { Language } from '../types';
import { getTranslation } from '../i18n/translations';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  language: Language;
  onConfirm: () => void;
  onCancel: () => void;
}

export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
  isOpen,
  language,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const t = getTranslation(language);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 relative">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          aria-label={t.cancel}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200/60 dark:border-rose-900/40 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
            <LogOut className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t.logoutConfirmTitle}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t.logoutSubtitle}
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
          {t.logoutConfirmMsg}
        </p>

        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/40 text-[11px] text-emerald-800 dark:text-emerald-300 mb-5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            {language === 'ta'
              ? 'Supabase-ல் உள்ள உங்கள் தரவுகள் எதுவும் நீக்கப்படாது.'
              : 'No items, photos, or database records will be deleted.'}
          </span>
        </div>

        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {t.stayLoggedIn}
          </button>
          <button
            id="confirm-logout-btn"
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs shadow-rose-600/20 transition-all cursor-pointer"
          >
            {t.confirmLogout}
          </button>
        </div>
      </div>
    </div>
  );
};
