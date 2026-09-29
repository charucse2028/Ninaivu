import React, { useState, useEffect } from 'react';
import { X, MapPin, Image as ImageIcon, Eye, Edit3, Trash2, Calendar, Volume2, VolumeX } from 'lucide-react';
import { ItemWithLocations, Language } from '../types';
import { getTranslation } from '../i18n/translations';
import { getItemIcon } from '../utils/itemIcons';
import { getItemDisplayName } from '../utils/itemTranslation';
import { getLocalizedLocationName } from '../utils/locationTranslation';
import { speechSynthesisService } from '../services/speechSynthesisService';
import {
  formatEnglishLocationResponse,
  formatTamilLocationResponse,
  resolveEnglishItemName,
  resolveTamilItemName,
} from '../services/aiAssistantService';

interface ItemDetailsModalProps {
  item: ItemWithLocations | null;
  language: Language;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (item: ItemWithLocations) => void;
  onDelete: (item: ItemWithLocations) => void;
  onViewPhoto: (photoUrl: string, locationName: string) => void;
  onAddLocation: (item: ItemWithLocations) => void;
}

export const ItemDetailsModal: React.FC<ItemDetailsModalProps> = ({
  item,
  language,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onViewPhoto,
  onAddLocation,
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const unsub = speechSynthesisService.addListener(speaking => {
      setIsSpeaking(speaking);
    });
    return () => {
      unsub();
      speechSynthesisService.stop();
    };
  }, []);

  if (!isOpen || !item) return null;

  const t = getTranslation(language);
  const displayName = getItemDisplayName(item, language);

  const formattedDate = item.created_at
    ? new Date(item.created_at).toLocaleDateString(language === 'ta' ? 'ta-IN' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '';

  const handleSpeakLocations = () => {
    if (isSpeaking) {
      speechSynthesisService.stop();
      return;
    }

    const locNames = (item.locations || [])
      .map(l => l.location_name.trim())
      .filter(Boolean);

    const speechLang = language === 'ta' ? 'ta-IN' : 'en-US';
    const textToSpeak =
      language === 'ta'
        ? formatTamilLocationResponse(resolveTamilItemName(item), locNames)
        : formatEnglishLocationResponse(resolveEnglishItemName(item), locNames);

    speechSynthesisService.speak(textToSpeak, speechLang);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center shrink-0">
              {getItemIcon(displayName)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate">
                  {displayName}
                </h3>
                {item.isDemo && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                    {t.sampleDataNotice}
                  </span>
                )}
                {/* Voice Speaker Icon */}
                <button
                  type="button"
                  onClick={handleSpeakLocations}
                  className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                    isSpeaking
                      ? 'bg-emerald-600 text-white animate-pulse'
                      : 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                  }`}
                  title={isSpeaking ? t.stopVoice : t.listenVoice}
                  aria-label={isSpeaking ? t.stopVoice : t.listenVoice}
                >
                  {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
              {formattedDate && (
                <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3 h-3" />
                  <span>{t.createdOn}: {formattedDate}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onEdit(item)}
              title={t.editItem}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(item)}
              title={t.deleteItem}
              className="p-2 rounded-xl text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Locations List */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {t.possibleLocationsTitle} ({item.locations.length})
              </h4>
            </div>

            <button
              onClick={() => onAddLocation(item)}
              className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 font-semibold text-xs flex items-center justify-center transition-colors cursor-pointer min-h-[36px]"
            >
              <span>{t.addAnotherLocation}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            {item.locations.map((loc, index) => {
              const locDisplayName = getLocalizedLocationName(loc.location_name, language);
              return (
                <div
                  key={loc.id || index}
                  className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 overflow-hidden flex flex-col justify-between"
                >
                  {/* Photo Thumbnail */}
                  <div className="relative aspect-video bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden group">
                    {loc.photo_url ? (
                      <>
                        <img
                          src={loc.photo_url}
                          alt={`${displayName} at ${locDisplayName}`}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <button
                          onClick={() => onViewPhoto(loc.photo_url!, locDisplayName)}
                          className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white font-semibold text-xs cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                          <span>{t.viewPhoto}</span>
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 text-xs gap-1">
                        <ImageIcon className="w-6 h-6 opacity-40" />
                        <span>{t.noPhotoAvailable}</span>
                      </div>
                    )}
                  </div>

                  {/* Location Title & Action */}
                  <div className="p-3 sm:p-3.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {locDisplayName}
                      </span>
                    </div>

                    {loc.photo_url && (
                      <button
                        onClick={() => onViewPhoto(loc.photo_url!, locDisplayName)}
                        className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1 shrink-0 p-1 min-h-[32px]"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{t.viewPhoto}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={() => onEdit(item)}
            className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer min-h-[40px]"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{t.editItem}</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold transition-colors cursor-pointer min-h-[40px]"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
