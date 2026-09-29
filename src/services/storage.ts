import { supabase, isSupabaseConfigured } from '../lib/supabase';

const BUCKET_NAME = 'item-photos';
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export interface UploadResult {
  url: string | null;
  error: string | null;
}

export const storageService = {
  validateImage(file: File): { valid: boolean; error?: string } {
    if (!file.type.startsWith('image/')) {
      return { valid: false, error: 'Only image files (JPEG, PNG, WEBP) are allowed.' };
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return { valid: false, error: 'Image size must be less than 5MB.' };
    }
    return { valid: true };
  },

  async fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  async uploadLocationPhoto(
    profileId: string,
    itemId: string,
    locationId: string,
    file: File
  ): Promise<UploadResult> {
    const validation = this.validateImage(file);
    if (!validation.valid) {
      return { url: null, error: validation.error || 'Invalid image' };
    }

    // Try Supabase Storage if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const fileExt = file.name.split('.').pop() || 'jpg';
        const sanitizedFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        const filePath = `${profileId}/${itemId}/${locationId}/${sanitizedFileName}`;

        const { data, error } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
          });

        if (error) {
          console.warn('Supabase storage upload error:', error.message);
          // Fall back to data URL for seamless preview experience
          const dataUrl = await this.fileToDataUrl(file);
          return { url: dataUrl, error: null };
        }

        if (data) {
          const { data: publicUrlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(data.path);

          return { url: publicUrlData.publicUrl, error: null };
        }
      } catch (err: unknown) {
        console.warn('Supabase storage upload exception:', err);
        const dataUrl = await this.fileToDataUrl(file);
        return { url: dataUrl, error: null };
      }
    }

    // Local / offline fallback: use data URL
    try {
      const dataUrl = await this.fileToDataUrl(file);
      return { url: dataUrl, error: null };
    } catch {
      return { url: null, error: 'Failed to read image file.' };
    }
  },

  async deleteLocationPhoto(photoUrl: string): Promise<boolean> {
    if (!photoUrl) return true;

    if (isSupabaseConfigured && supabase && photoUrl.includes(BUCKET_NAME)) {
      try {
        const parts = photoUrl.split(`${BUCKET_NAME}/`);
        if (parts.length > 1) {
          const path = parts[1];
          await supabase.storage.from(BUCKET_NAME).remove([path]);
        }
      } catch (err) {
        console.warn('Failed to delete from Supabase storage:', err);
      }
    }
    return true;
  }
};
