import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Trash2, Upload, AlertCircle, Sparkles } from 'lucide-react';
import { ItemWithLocations, Language } from '../types';
import { getTranslation } from '../i18n/translations';
import { storageService } from '../services/storage';
import { getItemDisplayName } from '../utils/itemTranslation';

interface LocationDraft {
  id?: string;
  location_name: string;
  photo_url: string | null;
  file?: File;
  previewUrl?: string;
}

interface ItemFormModalProps {
  isOpen: boolean;
  language: Language;
  initialItem?: ItemWithLocations | null;
  profileId: string;
  onClose: () => void;
  onSave: (
    itemName: string,
    locations: { id?: string; location_name: string; photo_url: string | null }[]
  ) => Promise<void>;
}

export const ItemFormModal: React.FC<ItemFormModalProps> = ({
  isOpen,
  language,
  initialItem,
  profileId,
  onClose,
  onSave,
}) => {
  const t = getTranslation(language);

  const [itemName, setItemName] = useState('');
  const [locations, setLocations] = useState<LocationDraft[]>([
    { location_name: '', photo_url: null },
  ]);
  const [errors, setErrors] = useState<{ general?: string; itemName?: string; locations?: string[] }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  const fileInputRefs = useRef<{ [index: number]: HTMLInputElement | null }>({});

  useEffect(() => {
    if (initialItem) {
      setItemName(getItemDisplayName(initialItem, language));
      setLocations(
        initialItem.locations && initialItem.locations.length > 0
          ? initialItem.locations.map(l => ({
              id: l.id,
              location_name: l.location_name,
              photo_url: l.photo_url,
              previewUrl: l.photo_url || undefined,
            }))
          : [{ location_name: '', photo_url: null }]
      );
    } else {
      setItemName('');
      setLocations([{ location_name: '', photo_url: null }]);
    }
    setErrors({});
    setUploadProgress(null);
  }, [initialItem, isOpen]);

  if (!isOpen) return null;

  const handleAddLocation = () => {
    setLocations(prev => [...prev, { location_name: '', photo_url: null }]);
  };

  const handleRemoveLocation = (index: number) => {
    if (locations.length <= 1) return;
    setLocations(prev => prev.filter((_, i) => i !== index));
  };

  const handleLocationNameChange = (index: number, value: string) => {
    setLocations(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], location_name: value };
      return updated;
    });
  };

  const handleFileSelect = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = storageService.validateImage(file);
    if (!validation.valid) {
      setErrors(prev => ({ ...prev, general: validation.error || t.imageInvalidType }));
      return;
    }

    // Create local object URL for instant preview
    const previewUrl = URL.createObjectURL(file);

    setLocations(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        file,
        previewUrl,
      };
      return updated;
    });

    setErrors(prev => ({ ...prev, general: undefined }));
  };

  const handleRemovePhoto = (index: number) => {
    setLocations(prev => {
      const updated = [...prev];
      if (updated[index].previewUrl && updated[index].previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(updated[index].previewUrl!);
      }
      updated[index] = {
        ...updated[index],
        photo_url: null,
        file: undefined,
        previewUrl: undefined,
      };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { general?: string; itemName?: string; locations?: string[] } = {};

    if (!itemName.trim()) {
      newErrors.itemName = t.itemNameLabel + ' is required.';
    }

    if (locations.length === 0) {
      newErrors.general = t.atLeastOneLocation;
    }

    const emptyLocs = locations.some(l => !l.location_name.trim());
    if (emptyLocs) {
      newErrors.general = t.locationNameRequired;
    }

    if (newErrors.itemName || newErrors.general) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      // Upload pending files if any
      const finalLocations: { id?: string; location_name: string; photo_url: string | null }[] = [];

      for (let i = 0; i < locations.length; i++) {
        const loc = locations[i];
        let photoUrl = loc.photo_url;

        if (loc.file) {
          setUploadProgress(`${t.uploadingPhoto} (${i + 1}/${locations.length})`);
          const tempId = loc.id || crypto.randomUUID();
          const uploadRes = await storageService.uploadLocationPhoto(
            profileId,
            initialItem?.id || 'temp',
            tempId,
            loc.file
          );

          if (uploadRes.error) {
            console.warn('Photo upload warning:', uploadRes.error);
          }
          if (uploadRes.url) {
            photoUrl = uploadRes.url;
          }
        }

        finalLocations.push({
          id: loc.id,
          location_name: loc.location_name.trim(),
          photo_url: photoUrl || null,
        });
      }

      setUploadProgress(null);
      await onSave(itemName.trim(), finalLocations);
      onClose();
    } catch (err: unknown) {
      console.error('Error saving item:', err);
      setErrors({ general: 'Failed to save item. Please try again.' });
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {initialItem ? t.editItem : t.addItem}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.heroSubtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label={t.cancel}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {errors.general && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.general}</span>
            </div>
          )}

          {/* Item Name Field */}
          <div>
            <label
              htmlFor="form-item-name"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
            >
              {t.itemNameLabel} <span className="text-rose-500">*</span>
            </label>
            <input
              id="form-item-name"
              type="text"
              value={itemName}
              onChange={e => setItemName(e.target.value)}
              placeholder={t.itemNamePlaceholder}
              className={`w-full px-4 py-3 rounded-xl border bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-base focus:outline-none focus:ring-2 transition-all ${
                errors.itemName
                  ? 'border-rose-400 focus:ring-rose-400'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-emerald-500'
              }`}
              autoFocus
            />
            {errors.itemName && (
              <p className="text-xs text-rose-500 mt-1 font-medium">{errors.itemName}</p>
            )}
          </div>

          {/* Possible Locations Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {t.possibleLocationsTitle} <span className="text-rose-500">*</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Save all the typical places you keep this item.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddLocation}
                className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.addAnotherLocation}</span>
              </button>
            </div>

            {/* Location Items List */}
            <div className="space-y-4">
              {locations.map((loc, index) => (
                <div
                  key={loc.id || index}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Location {index + 1}
                    </span>
                    {locations.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLocation(index)}
                        className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                        title={t.removeLocation}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Location Name Input */}
                  <div>
                    <input
                      type="text"
                      value={loc.location_name}
                      onChange={e => handleLocationNameChange(index, e.target.value)}
                      placeholder={t.locationNamePlaceholder}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Photo Upload / Preview */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      ref={el => {
                        fileInputRefs.current[index] = el;
                      }}
                      onChange={e => handleFileSelect(index, e)}
                      className="hidden"
                    />

                    {loc.previewUrl ? (
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative w-20 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-200 shrink-0">
                          <img
                            src={loc.previewUrl}
                            alt={`Preview for ${loc.location_name}`}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRefs.current[index]?.click()}
                            className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                          >
                            {t.changePhoto}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(index)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          >
                            {t.removePhoto}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[index]?.click()}
                        className="w-full sm:w-auto px-3.5 py-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 hover:border-emerald-500 dark:hover:border-emerald-400 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-300 text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer bg-white dark:bg-slate-900"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{t.uploadPhoto}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddLocation}
              className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-400 text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addAnotherLocation}</span>
            </button>
          </div>

          {/* Form Submit Footer */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold transition-colors cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              <span>{isSubmitting ? (uploadProgress || t.saving) : t.saveItem}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
