import React, { useState } from 'react';
import { Sparkles, ArrowRight, User, Hash, Moon, Sun, Globe, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';
import { Language } from '../types';
import { getTranslation } from '../i18n/translations';
import { isSupabaseConfigured } from '../lib/supabase';

interface WelcomeScreenProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  onContinue: (name: string, age: number) => Promise<void>;
  notification?: string | null;
  onClearNotification?: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  language,
  onLanguageChange,
  theme,
  onThemeToggle,
  onContinue,
  notification,
  onClearNotification,
}) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [errors, setErrors] = useState<{ name?: string; age?: string; general?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const t = getTranslation(language);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { name?: string; age?: string; general?: string } = {};

    const trimmedName = name.trim();
    if (!trimmedName) {
      newErrors.name = t.nameRequired;
    }

    const parsedAge = parseInt(age.trim(), 10);
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
      await onContinue(trimmedName, parsedAge);
    } catch (err: any) {
      console.error('[WelcomeScreen] Failed to continue:', err);
      setErrors({
        general: err?.message || (language === 'ta' ? 'சுயவிவரத்தைச் சரிபார்க்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.' : 'Failed to verify profile. Please try again.')
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Top Bar with Language and Theme Selectors */}
      <header className="w-full border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
              <Sparkles className="w-5 h-5 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 dark:from-emerald-400 dark:via-teal-300 dark:to-cyan-400 bg-clip-text text-transparent">
                  {language === 'ta' ? 'நினைவு' : 'Ninaivu'}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hidden sm:inline-block">
                  {language === 'ta' ? 'நினைவூட்டி' : 'Memory'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                {t.tagline}
              </p>
            </div>
          </div>

          {/* Controls: Language Toggle & Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher */}
            <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => onLanguageChange('en')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  language === 'en'
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => onLanguageChange('ta')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  language === 'ta'
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                தமிழ்
              </button>
            </div>

            {/* Dark / Light Mode Toggle */}
            <button
              type="button"
              onClick={onThemeToggle}
              title={theme === 'dark' ? t.themeLight : t.themeDark}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>
        </div>
      </header>

      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 max-w-sm p-3.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xl border border-slate-700 dark:border-slate-200 flex items-center justify-between gap-3 text-xs sm:text-sm animate-in fade-in slide-in-from-top-2">
          <span>{notification}</span>
          {onClearNotification && (
            <button
              type="button"
              onClick={onClearNotification}
              className="text-slate-400 hover:text-white dark:hover:text-slate-900 font-bold px-1"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Main Centered Welcome Flow */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 relative overflow-hidden">
            {/* Top decorative accent */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

            {/* Header / Brand Icon */}
            <div className="flex flex-col items-center text-center mb-6 sm:mb-7">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-emerald-600/25 mb-3.5">
                <Sparkles className="w-8 h-8" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {language === 'ta' ? 'நினைவு' : 'Ninaivu'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-xs">
                {t.heroSubtitle}
              </p>
            </div>

            {/* General Error Banner */}
            {errors.general && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
                {errors.general}
              </div>
            )}

            {/* Welcome Form */}
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {/* Name Field */}
              <div>
                <label
                  htmlFor="welcome-name-input"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  {language === 'ta' ? 'பெயர்' : 'Name'} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="welcome-name-input"
                    type="text"
                    value={name}
                    onChange={e => {
                      setName(e.target.value);
                      if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
                    }}
                    placeholder={t.profileNamePlaceholder}
                    className={`w-full pl-10 pr-3.5 py-3 rounded-xl border bg-slate-50 dark:bg-slate-800/90 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 transition-all min-h-[46px] ${
                      errors.name
                        ? 'border-rose-400 focus:ring-rose-400'
                        : 'border-slate-300 dark:border-slate-700 focus:ring-emerald-500 focus:border-emerald-500'
                    }`}
                    autoFocus
                  />
                </div>
                {errors.name && (
                  <p className="text-xs text-rose-500 dark:text-rose-400 mt-1.5 font-medium">
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Age Field */}
              <div>
                <label
                  htmlFor="welcome-age-input"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  {language === 'ta' ? 'வயது' : 'Age'} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Hash className="w-4 h-4" />
                  </div>
                  <input
                    id="welcome-age-input"
                    type="number"
                    min="1"
                    max="125"
                    value={age}
                    onChange={e => {
                      setAge(e.target.value);
                      if (errors.age) setErrors(prev => ({ ...prev, age: undefined }));
                    }}
                    placeholder={t.profileAgePlaceholder}
                    className={`w-full pl-10 pr-3.5 py-3 rounded-xl border bg-slate-50 dark:bg-slate-800/90 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 transition-all min-h-[46px] ${
                      errors.age
                        ? 'border-rose-400 focus:ring-rose-400'
                        : 'border-slate-300 dark:border-slate-700 focus:ring-emerald-500 focus:border-emerald-500'
                    }`}
                  />
                </div>
                {errors.age && (
                  <p className="text-xs text-rose-500 dark:text-rose-400 mt-1.5 font-medium">
                    {errors.age}
                  </p>
                )}
              </div>

              {/* Submit / Continue Button */}
              <div className="pt-2">
                <button
                  id="welcome-continue-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 text-white font-bold text-base flex items-center justify-center gap-2 shadow-md shadow-emerald-600/25 active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer min-h-[50px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{language === 'ta' ? 'சுயவிவரம் சரிபார்க்கப்படுகிறது...' : 'Checking profile...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{t.continueBtn}</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>

              {/* Informative Note on Prototype Flow & Supabase Sync */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    {language === 'ta' ? 'சுயவிவர அடையாளம் (Supabase)' : 'Profile Identification (Supabase)'}
                  </span>
                </div>
                <p>
                  {language === 'ta'
                    ? 'நினைவு உங்கள் பெயர் மற்றும் வயதைப் பயன்படுத்தி Supabase வழியாக உங்கள் சேமிக்கப்பட்ட பொருட்களை மீட்டெடுக்கிறது. புதிய தொலைபேசியிலும் அதே பெயர் + வயதை உள்ளிட்டு உங்கள் பொருட்களைக் காணலாம்.'
                    : 'Ninaivu uses your exact Name + Age to retrieve your saved items, locations, and photos from Supabase. Entering the same Name and Age on another phone will safely restore your data.'}
                </p>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Subtle Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 dark:text-slate-600">
        <p>Ninaivu • {isSupabaseConfigured ? 'Connected to Supabase PostgreSQL' : 'Local Storage Mode'}</p>
      </footer>
    </div>
  );
};
