import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, User, Hash, Edit3 } from 'lucide-react';
import { Language, Profile } from '../types';
import { getTranslation } from '../i18n/translations';

interface ProfileModalProps {
  isOpen: boolean;
  language: Language;
  initialProfile?: Profile | null;
  onSave: (name: string, age: number) => Promise<void>;
  isDismissable?: boolean;
  onClose?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  language,
  initialProfile,
  onSave,
  isDismissable = false,
  onClose,
}) => {
  const [name, setName] = useState(initialProfile?.name || '');
  const [age, setAge] = useState(initialProfile?.age ? String(initialProfile.age) : '');
  const [errors, setErrors] = useState<{ name?: string; age?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state whenever the modal opens or initialProfile changes
  useEffect(() => {
    if (isOpen) {
      setName(initialProfile?.name || '');
      setAge(initialProfile?.age ? String(initialProfile.age) : '');
      setErrors({});
    }
  }, [isOpen, initialProfile]);

  if (!isOpen) return null;

  const t = getTranslation(language);
  const isEditMode = Boolean(initialProfile && isDismissable);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { name?: string; age?: string } = {};

    if (!name.trim()) {
      newErrors.name = t.nameRequired;
    }

    const parsedAge = parseInt(age, 10);
    if (!age.trim() || isNaN(parsedAge) || parsedAge <= 0 || parsedAge > 125) {
      newErrors.age = t.ageRequired;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      await onSave(name.trim(), parsedAge);
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 relative">
        {isDismissable && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-medium"
          >
            {t.cancel}
          </button>
        )}

        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 flex items-center justify-center text-white shadow-md mb-3">
            {isEditMode ? <Edit3 className="w-7 h-7" /> : <Sparkles className="w-7 h-7" />}
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {isEditMode ? t.editProfileTitle : t.welcomeTitle}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
            {isEditMode ? t.editProfileSubtitle : t.heroSubtitle}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="profile-name-input"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5"
            >
              {t.profileNameLabel} <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                id="profile-name-input"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={t.profileNamePlaceholder}
                className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 transition-all ${
                  errors.name
                    ? 'border-rose-400 focus:ring-rose-400'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-emerald-500'
                }`}
                autoFocus
              />
            </div>
            {errors.name && (
              <p className="text-xs text-rose-500 dark:text-rose-400 mt-1 font-medium">
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="profile-age-input"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5"
            >
              {t.profileAgeLabel} <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Hash className="w-4 h-4" />
              </div>
              <input
                id="profile-age-input"
                type="number"
                min="1"
                max="125"
                value={age}
                onChange={e => setAge(e.target.value)}
                placeholder={t.profileAgePlaceholder}
                className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 transition-all ${
                  errors.age
                    ? 'border-rose-400 focus:ring-rose-400'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-emerald-500'
                }`}
              />
            </div>
            {errors.age && (
              <p className="text-xs text-rose-500 dark:text-rose-400 mt-1 font-medium">
                {errors.age}
              </p>
            )}
          </div>

          <div className="pt-2">
            <button
              id="profile-continue-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer"
            >
              <span>{isSubmitting ? t.saving : isEditMode ? t.saveChanges : t.continueBtn}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] text-center text-slate-400 dark:text-slate-500">
            {isEditMode
              ? (language === 'ta' ? 'சுயவிவர எண் மாறாமல் Supabase-ல் புதுப்பிக்கப்படும்.' : 'Updates your Supabase profile with the same profile ID.')
              : 'Ninaivu prototype session. Real Supabase Auth can be integrated without changing data structures.'}
          </p>
        </form>
      </div>
    </div>
  );
};
