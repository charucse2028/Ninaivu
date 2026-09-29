import React, { useEffect, useState } from 'react';
import { Sparkles, Volume2, VolumeX, RotateCcw, X, MapPin, Plus, ArrowRight } from 'lucide-react';
import { AIAssistantResult } from '../services/aiAssistantService';
import { speechSynthesisService } from '../services/speechSynthesisService';
import { Language } from '../types';
import { getTranslation } from '../i18n/translations';

interface AIAssistantResponseCardProps {
  response: AIAssistantResult;
  language: Language;
  onClose: () => void;
  onViewItem?: (item: any) => void;
  onAddNewItem?: (prefilledName?: string) => void;
}

export const AIAssistantResponseCard: React.FC<AIAssistantResponseCardProps> = ({
  response,
  language,
  onClose,
  onViewItem,
  onAddNewItem,
}) => {
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const t = getTranslation(language);

  // Subscribe to speech synthesis state
  useEffect(() => {
    const unsubscribe = speechSynthesisService.addListener(speaking => {
      setIsSpeaking(speaking);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Handler to speak or replay
  const handleToggleSpeak = () => {
    if (isSpeaking) {
      speechSynthesisService.stop();
    } else {
      speechSynthesisService.speak(response.responseText, response.speechLang);
    }
  };

  const isTamilResponse = response.detectedLanguage === 'ta' || language === 'ta';

  return (
    <div
      role="region"
      aria-label={t.aiAssistantName}
      className="relative w-full rounded-3xl bg-gradient-to-br from-emerald-50/90 via-teal-50/70 to-cyan-50/80 dark:from-emerald-950/40 dark:via-slate-900 dark:to-teal-950/40 border border-emerald-200/90 dark:border-emerald-800/80 p-4 sm:p-5 lg:p-6 shadow-md shadow-emerald-500/5 transition-all animate-fadeIn"
    >
      {/* Top Bar with AI Badge, Language pill & Close */}
      <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-emerald-200/60 dark:border-emerald-800/60">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-emerald-900 dark:text-emerald-200">
            {t.aiAssistantName}
          </span>
          <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100/80 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
            {response.speechLang === 'ta-IN' ? 'தமிழ் (ta-IN)' : 'English (en-US)'}
          </span>
        </div>

        <button
          onClick={onClose}
          className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
          title={t.dismiss}
          aria-label={t.dismiss}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Spoken Text & User Query Reference */}
        <div className="space-y-1.5 flex-1 min-w-0">
          {response.query && (
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 italic truncate">
              "{response.query}"
            </p>
          )}
          <p className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
            {response.responseText}
          </p>
        </div>

        {/* Action Controls: Speaker Replay Button */}
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
          <button
            onClick={handleToggleSpeak}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl font-semibold text-xs sm:text-sm transition-all cursor-pointer shadow-xs min-h-[44px] ${
              isSpeaking
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400 animate-pulse'
                : 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-50 dark:hover:bg-slate-700'
            }`}
            title={isSpeaking ? t.stopVoice : t.listenVoice}
            aria-label={isSpeaking ? t.stopVoice : t.listenVoice}
          >
            {isSpeaking ? (
              <>
                <VolumeX className="w-4 h-4 text-white" />
                <span>{t.stopVoice}</span>
                <span className="flex items-center gap-0.5 ml-1">
                  <span className="w-1 h-3 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1 h-4 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1 h-2 bg-white rounded-full animate-bounce"></span>
                </span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4" />
                <span>{t.listenVoice}</span>
                <RotateCcw className="w-3.5 h-3.5 opacity-60 ml-0.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Contextual Suggestions / Badges */}
      {response.status === 'found_with_locations' && response.locations.length > 0 && (
        <div className="mt-4 pt-3 border-t border-emerald-200/50 dark:border-emerald-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {t.possibleLocationsList}:
            </span>
            {response.locations.map((loc, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/80 dark:bg-slate-800/90 border border-emerald-200/70 dark:border-emerald-700/60 text-xs font-medium text-emerald-800 dark:text-emerald-200 shadow-2xs"
              >
                <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>{loc}</span>
              </span>
            ))}
          </div>

          {response.matchedItem && onViewItem && (
            <button
              onClick={() => onViewItem(response.matchedItem)}
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200 hover:underline cursor-pointer min-h-[36px]"
            >
              <span>{t.viewItem}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Quick Add Button if Item was Not Found */}
      {response.status === 'item_not_found' && onAddNewItem && (
        <div className="mt-4 pt-3 border-t border-emerald-200/50 dark:border-emerald-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <span className="text-xs text-slate-600 dark:text-slate-400">
            {isTamilResponse
              ? `"${response.extractedItemName}"-ஐ உங்கள் பட்டியலில் சேர்க்க விரும்புகிறீர்களா?`
              : `Would you like to save "${response.extractedItemName}" now?`}
          </span>
          <button
            onClick={() => onAddNewItem(response.extractedItemName)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[40px]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.addItem}</span>
          </button>
        </div>
      )}
    </div>
  );
};
