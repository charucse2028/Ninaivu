import React from 'react';
import { Search, Mic, MicOff, X, AlertCircle } from 'lucide-react';
import { Language } from '../types';
import { getTranslation } from '../i18n/translations';

interface SearchSectionProps {
  language: Language;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isListening: boolean;
  isSpeechSupported: boolean;
  voiceError: string | null;
  processingVoice: boolean;
  onStartVoice: () => void;
  onStopVoice: () => void;
}

export const SearchSection: React.FC<SearchSectionProps> = ({
  language,
  searchQuery,
  onSearchChange,
  isListening,
  isSpeechSupported,
  voiceError,
  processingVoice,
  onStartVoice,
  onStopVoice,
}) => {
  const t = getTranslation(language);

  return (
    <div className="w-full space-y-2.5 sm:space-y-3">
      {/* Search Input Bar */}
      <div className="relative flex items-center">
        {/* Search Icon */}
        <div className="absolute left-3.5 sm:left-4 pointer-events-none text-slate-400 dark:text-slate-500">
          <Search className="w-5 h-5" />
        </div>

        {/* Input Field */}
        <input
          id="item-search-input"
          type="text"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          placeholder={t.searchPlaceholder}
          aria-label={t.searchPlaceholder}
          className="w-full pl-11 sm:pl-12 pr-24 sm:pr-28 py-3.5 sm:py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-base transition-all"
        />

        {/* Action Controls on the Right: Clear & Microphone */}
        <div className="absolute right-1.5 sm:right-3 flex items-center gap-1">
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              title={t.clearSearch}
              aria-label={t.clearSearch}
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            id="voice-search-mic-btn"
            type="button"
            onClick={isListening ? onStopVoice : onStartVoice}
            title={t.voiceSearchTooltip}
            aria-label={t.voiceSearchTooltip}
            className={`relative p-2.5 sm:p-3 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30 ring-4 ring-rose-400/20'
                : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-600 dark:text-emerald-400 active:scale-95'
            }`}
          >
            {isListening ? (
              <MicOff className="w-5 h-5 animate-bounce" />
            ) : (
              <Mic className="w-5 h-5" />
            )}

            {isListening && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Voice Status & Helper Feedback */}
      {isListening && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-medium animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>{processingVoice ? t.voiceProcessing : t.voiceListening}</span>
            <span className="text-[11px] opacity-75">({language === 'ta' ? 'தமிழ்' : 'English'})</span>
          </div>
          <button
            onClick={onStopVoice}
            className="text-xs text-rose-600 dark:text-rose-400 font-semibold hover:underline"
          >
            {t.cancel}
          </button>
        </div>
      )}

      {voiceError && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{voiceError}</span>
        </div>
      )}

      {!isSpeechSupported && (
        <p className="text-[11px] text-slate-400 dark:text-slate-500 px-1">
          {t.voiceNotSupported}
        </p>
      )}
    </div>
  );
};
