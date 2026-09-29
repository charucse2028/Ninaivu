import React from 'react';
import { X, Download, MapPin } from 'lucide-react';
import { Language } from '../types';
import { getTranslation } from '../i18n/translations';

interface PhotoViewerModalProps {
  isOpen: boolean;
  photoUrl: string | null;
  locationName: string;
  language?: Language;
  onClose: () => void;
}

export const PhotoViewerModal: React.FC<PhotoViewerModalProps> = ({
  isOpen,
  photoUrl,
  locationName,
  language = 'en',
  onClose,
}) => {
  if (!isOpen || !photoUrl) return null;
  const t = getTranslation(language);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 dark:bg-slate-950/85 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-slate-900 dark:text-white">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h4 className="font-semibold text-sm sm:text-base truncate max-w-[240px] sm:max-w-md text-slate-900 dark:text-white">
              {locationName}
            </h4>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={photoUrl}
              target="_blank"
              rel="noreferrer"
              download={`${locationName}-photo.jpg`}
              className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={language === 'ta' ? 'புகைப்படத்தை தரவிறக்கு' : 'Download photo'}
            >
              <Download className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={t.close}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Frame */}
        <div className="relative max-h-[75vh] flex items-center justify-center bg-slate-100 dark:bg-slate-950 p-2 sm:p-4 overflow-hidden">
          <img
            src={photoUrl}
            alt={locationName}
            className="max-h-[70vh] max-w-full object-contain rounded-xl shadow-lg"
          />
        </div>
      </div>
    </div>
  );
};
