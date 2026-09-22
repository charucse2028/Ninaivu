import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Moon,
  Sun,
  Database,
  User,
  Edit3,
  LogOut,
  ChevronDown,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import { Language, Profile } from '../types';
import { getTranslation } from '../i18n/translations';
import { isSupabaseConfigured } from '../lib/supabase';

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  profile: Profile | null;
  onViewProfile: () => void;
  onEditProfile: () => void;
  onLogout: () => void;
  onOpenSetup: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onLanguageChange,
  theme,
  onThemeToggle,
  profile,
  onViewProfile,
  onEditProfile,
  onLogout,
  onOpenSetup,
}) => {
  const t = getTranslation(language);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown menu when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 flex items-center justify-center text-white shadow-sm shrink-0">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <h1 className="text-base sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
                Ninaivu
              </h1>
              <span className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-semibold shrink-0">
                நினைவு
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate hidden md:block">
              {t.tagline}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Supabase Status Pill */}
          <button
            onClick={onOpenSetup}
            title={isSupabaseConfigured ? t.backendConnected : t.backendLocal}
            aria-label={t.setupSupabase}
            className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
              isSupabaseConfigured
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                : 'bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 hover:border-emerald-400'
            }`}
          >
            {isSupabaseConfigured ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Database className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span>{isSupabaseConfigured ? 'Supabase' : 'Local DB'}</span>
            <HelpCircle className="w-3 h-3 opacity-60 ml-0.5" />
          </button>

          {/* Language Switcher */}
          <div
            className="flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700"
            role="group"
            aria-label="Language selection"
          >
            <button
              onClick={() => onLanguageChange('en')}
              className={`px-2 sm:px-2.5 py-1 text-xs font-semibold rounded-md min-h-[32px] sm:min-h-0 flex items-center justify-center transition-all ${
                language === 'en'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              aria-pressed={language === 'en'}
            >
              English
            </button>
            <button
              onClick={() => onLanguageChange('ta')}
              className={`px-2 sm:px-2.5 py-1 text-xs font-semibold rounded-md min-h-[32px] sm:min-h-0 flex items-center justify-center transition-all ${
                language === 'ta'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              aria-pressed={language === 'ta'}
            >
              தமிழ்
            </button>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={onThemeToggle}
            className="p-2 rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={theme === 'light' ? t.themeDark : t.themeLight}
            aria-label={theme === 'light' ? t.themeDark : t.themeLight}
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          {/* Profile Dropdown Menu */}
          {profile && (
            <div className="relative" ref={menuRef}>
              <button
                id="header-profile-menu-button"
                onClick={() => setIsMenuOpen(prev => !prev)}
                aria-expanded={isMenuOpen}
                aria-haspopup="true"
                className="flex items-center gap-1.5 p-1.5 sm:pl-2 sm:pr-2.5 sm:py-1 rounded-lg min-h-[36px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                title={profile.name}
              >
                <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline max-w-[80px] lg:max-w-[120px] truncate">{profile.name}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-150 ${
                    isMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isMenuOpen && (
                <div
                  id="profile-dropdown-menu"
                  className="absolute right-0 top-full mt-2 w-48 max-w-[calc(100vw-24px)] rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-50 animate-in fade-in duration-100"
                  role="menu"
                  aria-orientation="vertical"
                >
                  {/* User identity preview */}
                  <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {profile.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {profile.age} {language === 'ta' ? 'வயது' : 'years old'}
                    </p>
                  </div>

                  {/* 1. Profile */}
                  <button
                    id="menu-item-view-profile"
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onViewProfile();
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
                    role="menuitem"
                  >
                    <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{t.profileMenu}</span>
                  </button>

                  {/* 2. Edit Profile */}
                  <button
                    id="menu-item-edit-profile"
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onEditProfile();
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
                    role="menuitem"
                  >
                    <Edit3 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <span>{t.editProfile}</span>
                  </button>

                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                  {/* 3. Logout */}
                  <button
                    id="menu-item-logout"
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer text-left"
                    role="menuitem"
                  >
                    <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <span>{t.logout}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
