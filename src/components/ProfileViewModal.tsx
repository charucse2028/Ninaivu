import React, { useState } from 'react';
import { User, ShieldCheck, Database, Calendar, Edit3, LogOut, Copy, Check, X } from 'lucide-react';
import { Language, Profile } from '../types';
import { getTranslation } from '../i18n/translations';
import { isSupabaseConfigured } from '../lib/supabase';

interface ProfileViewModalProps {
  isOpen: boolean;
  language: Language;
  profile: Profile | null;
  onClose: () => void;
  onEdit: () => void;
  onLogout: () => void;
}

export const ProfileViewModal: React.FC<ProfileViewModalProps> = ({
  isOpen,
  language,
  profile,
  onClose,
  onEdit,
  onLogout,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !profile) return null;

  const t = getTranslation(language);

  const handleCopyId = () => {
    if (!profile.id) return;
    try {
      navigator.clipboard.writeText(profile.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label={t.close}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header / Avatar */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative mb-3">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white text-2xl font-bold shadow-md shadow-emerald-600/20">
              {profile.name ? profile.name.charAt(0).toUpperCase() : <User className="w-8 h-8" />}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center shadow-xs">
              <div className="w-4 h-4 rounded-full bg-emerald-500" title="Active Session" />
            </div>
          </div>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {profile.name}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-medium border border-emerald-200/60 dark:border-emerald-800/60">
              {t.activeSession}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {profile.age} {language === 'ta' ? 'வயது' : 'years old'}
            </span>
          </div>
        </div>

        {/* Profile Details List */}
        <div className="space-y-2.5 mb-6 text-xs">
          {/* Database / Sync Status */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
              {isSupabaseConfigured ? (
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              ) : (
                <Database className="w-4 h-4 text-slate-400" />
              )}
              <span className="font-medium">
                {isSupabaseConfigured ? 'Supabase Database' : 'Local Storage'}
              </span>
            </div>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {isSupabaseConfigured ? 'Synced' : 'Active'}
            </span>
          </div>

          {/* Preferred Language */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              {t.profileLanguage}
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {profile.language === 'ta' ? 'தமிழ் (Tamil)' : 'English'}
            </span>
          </div>

          {/* Profile ID */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                {t.profileIdLabel}
              </span>
              <button
                type="button"
                onClick={handleCopyId}
                className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                title={t.copyId}
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? t.copied : t.copyId}</span>
              </button>
            </div>
            <p className="font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate select-all">
              {profile.id}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
          <button
            id="profile-view-edit-btn"
            type="button"
            onClick={() => {
              onClose();
              onEdit();
            }}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{t.editProfile}</span>
          </button>

          <button
            id="profile-view-logout-btn"
            type="button"
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t.logout}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
