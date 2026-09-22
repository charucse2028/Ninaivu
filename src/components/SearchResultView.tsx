import React from 'react';
import { MapPin, Image as ImageIcon, Eye, Edit3, Trash2, ArrowLeft, Plus } from 'lucide-react';
import { ItemWithLocations, Language, ItemLocation } from '../types';
import { getTranslation } from '../i18n/translations';
import { getItemIcon } from '../utils/itemIcons';
import { getItemDisplayName } from '../utils/itemTranslation';

interface SearchResultViewProps {
  item: ItemWithLocations;
  language: Language;
  onBack: () => void;
  onViewPhoto: (photoUrl: string, locationName: string) => void;
  onEditItem: (item: ItemWithLocations) => void;
  onDeleteItem: (item: ItemWithLocations) => void;
  onAddLocation: (item: ItemWithLocations) => void;
}

export const SearchResultView: React.FC<SearchResultViewProps> = ({
  item,
  language,
  onBack,
  onViewPhoto,
  onEditItem,
  onDeleteItem,
  onAddLocation,
}) => {
  const t = getTranslation(language);
  const displayName = getItemDisplayName(item, language);

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 lg:p-8 shadow-sm">
      {/* Top Bar with Back Button & Item Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 sm:pb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="p-2.5 sm:p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0 cursor-pointer"
            title="Back to all items"
            aria-label="Back to all items"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-center shrink-0">
            {getItemIcon(displayName)}
          </div>
          <div className="min-w-0">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block truncate">
              {t.possibleLocationsTitle}
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white truncate">
              {displayName}
            </h2>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => onAddLocation(item)}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[40px]"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addAnotherLocation}</span>
          </button>
          <button
            onClick={() => onEditItem(item)}
            className="p-2.5 sm:p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title={t.editItem}
            aria-label={t.editItem}
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDeleteItem(item)}
            className="p-2.5 sm:p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0"
            title={t.deleteItem}
            aria-label={t.deleteItem}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Locations Title Header */}
      <div className="mt-5 sm:mt-6 mb-4 flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <MapPin className="w-5 h-5 text-emerald-600" />
          <span>{t.possibleLocationsTitle}</span>
          <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
            ({item.locations.length})
          </span>
        </h3>
      </div>

      {/* Grid of Location Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
        {item.locations.map((location: ItemLocation, index: number) => (
          <div
            key={location.id || index}
            className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 overflow-hidden flex flex-col justify-between"
          >
            {/* Location Photo or Placeholder */}
            <div className="relative aspect-video bg-slate-200 dark:bg-slate-800 overflow-hidden group">
              {location.photo_url ? (
                <>
                  <img
                    src={location.photo_url}
                    alt={`${displayName} at ${location.location_name}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => onViewPhoto(location.photo_url!, location.location_name)}
                      className="px-3 py-1.5 rounded-lg bg-white/95 text-slate-900 font-semibold text-xs flex items-center gap-1.5 shadow-md hover:bg-white transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {t.viewPhoto}
                    </button>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-4 text-center">
                  <ImageIcon className="w-8 h-8 mb-1.5 opacity-40" />
                  <span className="text-xs font-medium">{t.noPhotoAvailable}</span>
                </div>
              )}
            </div>

            {/* Location Details & Actions */}
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    {location.location_name}
                  </h4>
                </div>
              </div>

              {location.photo_url && (
                <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                  <button
                    onClick={() => onViewPhoto(location.photo_url!, location.location_name)}
                    className="w-full py-1.5 px-3 rounded-lg bg-white dark:bg-slate-700/70 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {t.viewPhoto}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
