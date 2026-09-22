import React from 'react';
import { Eye, Edit3, Trash2, MapPin, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { ItemWithLocations, Language } from '../types';
import { getTranslation } from '../i18n/translations';
import { getItemIcon } from '../utils/itemIcons';
import { getItemDisplayName } from '../utils/itemTranslation';

interface ItemCardProps {
  item: ItemWithLocations;
  language: Language;
  onView: (item: ItemWithLocations) => void;
  onEdit: (item: ItemWithLocations) => void;
  onDelete: (item: ItemWithLocations) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  language,
  onView,
  onEdit,
  onDelete,
}) => {
  const t = getTranslation(language);
  const displayName = getItemDisplayName(item, language);
  const locationsCount = item.locations?.length || 0;
  const photosCount = item.locations?.filter(l => Boolean(l.photo_url)).length || 0;

  return (
    <div
      id={`item-card-${item.id}`}
      className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
    >
      <div>
        {/* Header with Icon and Action Buttons */}
        <div className="flex items-start justify-between gap-2.5 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800/90 flex items-center justify-center shrink-0 border border-slate-200/60 dark:border-slate-700">
              {getItemIcon(displayName)}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                {displayName}
              </h3>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1 font-medium shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  {t.locationsCount(locationsCount)}
                </span>
                {photosCount > 0 && (
                  <span className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 shrink-0">
                    • <ImageIcon className="w-3 h-3" /> {photosCount}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Edit/Delete controls */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={e => {
                e.stopPropagation();
                onEdit(item);
              }}
              title={t.editItem}
              aria-label={`${t.editItem} ${displayName}`}
              className="p-2 sm:p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={e => {
                e.stopPropagation();
                onDelete(item);
              }}
              title={t.deleteItem}
              aria-label={`${t.deleteItem} ${displayName}`}
              className="p-2 sm:p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Location Previews Pill List */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {item.locations.slice(0, 3).map((loc, idx) => (
            <span
              key={loc.id || idx}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="truncate max-w-[130px] sm:max-w-[160px]">{loc.location_name}</span>
            </span>
          ))}
          {locationsCount > 3 && (
            <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium text-slate-400 dark:text-slate-500">
              +{locationsCount - 3}
            </span>
          )}
        </div>
      </div>

      {/* View Item Bottom Button */}
      <div className="pt-3.5 mt-3.5 sm:pt-4 sm:mt-4 border-t border-slate-100 dark:border-slate-800/80">
        <button
          onClick={() => onView(item)}
          className="w-full py-2.5 sm:py-2 px-3.5 min-h-[42px] sm:min-h-0 rounded-xl bg-slate-50 hover:bg-emerald-50 dark:bg-slate-800/60 dark:hover:bg-emerald-950/40 text-slate-700 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-300 font-semibold text-xs flex items-center justify-between transition-colors cursor-pointer group/btn"
        >
          <span className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            {t.viewItem}
          </span>
          <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
};
