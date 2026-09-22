import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Profile, Language } from '../types';
import { localStore } from './localStore';

const CURRENT_PROFILE_KEY = 'ninaivu_current_profile_id';

export function isValidUUID(str: string | undefined | null): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str) ||
         /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export function ensureValidUUID(str: string | undefined | null): string {
  if (str && isValidUUID(str)) return str;
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch {
      // fallback
    }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const profilesService = {
  getCurrentProfileId(): string | null {
    return localStorage.getItem(CURRENT_PROFILE_KEY);
  },

  setCurrentProfileId(id: string): void {
    localStorage.setItem(CURRENT_PROFILE_KEY, id);
  },

  clearCurrentProfile(): void {
    localStorage.removeItem(CURRENT_PROFILE_KEY);
  },

  /**
   * Step 1 of persistence flow:
   * Ensures that a profile with profileId exists in Supabase public.profiles table.
   * If it does not exist, inserts or upserts it before items are added.
   */
  async ensureProfileExists(profileId: string): Promise<Profile> {
    const validId = ensureValidUUID(profileId);

    // Get any cached profile information from localStore if available
    const local = localStore.getProfile(profileId) || localStore.getProfile(validId);
    const profileToEnsure: Profile = {
      id: validId,
      name: local?.name?.trim() || 'Family Member',
      age: local?.age || 60,
      language: local?.language || 'en',
      created_at: local?.created_at || new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      try {
        // Step 1: Check if profile exists in public.profiles
        const { data: existing, error: checkError } = await supabase
          .from('profiles')
          .select('id, name, age, language')
          .eq('id', validId)
          .maybeSingle();

        if (checkError) {
          console.error('[Supabase Error] Step 1: Error checking profile in public.profiles:', {
            message: checkError.message,
            code: checkError.code,
            details: checkError.details,
            hint: checkError.hint,
            profileId: validId,
          });
        }

        if (!existing) {
          console.log('[Supabase Step 1] Profile missing in public.profiles. Inserting profile:', profileToEnsure);
          const { data: inserted, error: insertError } = await supabase
            .from('profiles')
            .upsert(
              {
                id: profileToEnsure.id,
                name: profileToEnsure.name,
                age: profileToEnsure.age,
                language: profileToEnsure.language,
              },
              { onConflict: 'id' }
            )
            .select()
            .single();

          if (insertError) {
            console.error('[Supabase Error] Step 1 Failed: Could not insert profile into public.profiles:', {
              message: insertError.message,
              code: insertError.code,
              details: insertError.details,
              hint: insertError.hint,
              payload: profileToEnsure,
            });
            throw insertError;
          }

          console.log('[Supabase Success] Step 1: Profile verified & inserted in public.profiles:', inserted);
          this.setCurrentProfileId(inserted.id);
          localStore.saveProfile(inserted as Profile);
          return inserted as Profile;
        }

        return existing as Profile;
      } catch (err: any) {
        console.error('[Supabase Error] Step 1 Failed in ensureProfileExists:', err?.message || err);
        throw err;
      }
    }

    localStore.saveProfile(profileToEnsure);
    this.setCurrentProfileId(validId);
    return profileToEnsure;
  },

  async getProfile(id: string): Promise<Profile | null> {
    const validId = ensureValidUUID(id);

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', validId)
          .maybeSingle();

        if (error) {
          console.error('[Supabase Error] Failed to get profile from public.profiles:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
            id: validId,
          });
        }

        if (data) {
          localStore.saveProfile(data as Profile);
          return data as Profile;
        }
      } catch (err) {
        console.error('[Supabase Error] Exception in getProfile:', err);
      }
    }

    // Check local fallback
    const local = localStore.getProfile(id) || localStore.getProfile(validId);
    if (local) {
      // Sync local profile to Supabase if Supabase is active
      if (isSupabaseConfigured && supabase) {
        try {
          return await this.ensureProfileExists(local.id);
        } catch (syncErr) {
          console.error('[Supabase Error] Could not auto-sync local profile to Supabase:', syncErr);
        }
      }
      return local;
    }

    return null;
  },

  /**
   * Searches Supabase public.profiles for an existing matching profile by Name and Age.
   * Case-insensitive name match and numeric age match.
   */
  async findProfileByNameAge(name: string, age: number): Promise<Profile | null> {
    const trimmedName = name.trim();
    if (!trimmedName || isNaN(age)) return null;

    if (isSupabaseConfigured && supabase) {
      try {
        console.log('[Supabase Search] Searching public.profiles for returning user:', { name: trimmedName, age });
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .ilike('name', trimmedName)
          .eq('age', age)
          .order('created_at', { ascending: true })
          .limit(1);

        if (error) {
          console.warn('[Supabase Search] Error searching profiles by name and age:', error);
        } else if (data && data.length > 0) {
          const matched = data[0] as Profile;
          console.log('[Supabase Found Returning User] Reusing existing profile_id:', matched.id, matched.name);
          localStore.saveProfile(matched);
          return matched;
        }
      } catch (err) {
        console.warn('[Supabase Search] Exception in findProfileByNameAge:', err);
      }
    }

    // Check local fallback
    const localMatch = localStore.findProfileByNameAge(trimmedName, age);
    if (localMatch) {
      console.log('[LocalStore Found Returning User] Reusing existing local profile_id:', localMatch.id);
      return localMatch;
    }

    return null;
  },

  async saveProfile(name: string, age: number, language: Language = 'en', existingId?: string): Promise<Profile> {
    const trimmedName = name.trim();

    // ========================================================
    // RETURNING-USER DETECTION:
    // If not explicitly passed an existingId, first check Supabase
    // for an existing profile with matching Name and Age.
    // If found, REUSE the existing profile_id, do NOT create a new profile.
    // ========================================================
    let targetId = existingId;
    if (!targetId) {
      const existingProfile = await this.findProfileByNameAge(trimmedName, age);
      if (existingProfile) {
        console.log('[Returning User] Reusing existing profile_id:', existingProfile.id, 'for', trimmedName);
        this.setCurrentProfileId(existingProfile.id);
        localStore.saveProfile(existingProfile);
        return existingProfile;
      }
    }

    const id = ensureValidUUID(targetId);
    const profileData: Profile = {
      id,
      name: trimmedName,
      age,
      language,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      try {
        console.log('[Supabase Step 1] Upserting profile into public.profiles:', profileData);
        const { data, error } = await supabase
          .from('profiles')
          .upsert(
            {
              id: profileData.id,
              name: profileData.name,
              age: profileData.age,
              language: profileData.language,
            },
            { onConflict: 'id' }
          )
          .select()
          .single();

        if (error) {
          console.error('[Supabase Error] Step 1 Failed: Failed to upsert profile in public.profiles:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
            payload: profileData,
          });
          throw error;
        }

        if (data) {
          console.log('[Supabase Success] Step 1: Profile successfully saved to public.profiles:', data);
          this.setCurrentProfileId(data.id);
          localStore.saveProfile(data as Profile);
          return data as Profile;
        }
      } catch (err: any) {
        console.error('[Supabase Error] Exception in saveProfile:', err?.message || err);
        throw err;
      }
    }

    localStore.saveProfile(profileData);
    this.setCurrentProfileId(id);
    return profileData;
  },

  /**
   * Updates an existing profile's Name and Age in Supabase and local cache.
   * Keeps the same profile_id and does NOT create a duplicate profile.
   */
  async updateProfile(profileId: string, name: string, age: number): Promise<Profile> {
    const validId = ensureValidUUID(profileId);
    const trimmedName = name.trim();

    if (isSupabaseConfigured && supabase) {
      try {
        console.log('[Supabase Step 1] Updating existing profile in public.profiles for id:', validId);
        const { data, error } = await supabase
          .from('profiles')
          .update({
            name: trimmedName,
            age,
          })
          .eq('id', validId)
          .select()
          .single();

        if (error) {
          console.error('[Supabase Error] Failed to update profile in public.profiles:', error);
          throw error;
        }

        if (data) {
          console.log('[Supabase Success] Profile successfully updated in public.profiles:', data);
          this.setCurrentProfileId(data.id);
          localStore.saveProfile(data as Profile);
          return data as Profile;
        }
      } catch (err: any) {
        console.error('[Supabase Error] Exception in updateProfile:', err?.message || err);
        throw err;
      }
    }

    const local = localStore.getProfile(validId) || {
      id: validId,
      name: trimmedName,
      age,
      language: 'en',
      created_at: new Date().toISOString(),
    };
    const updated: Profile = {
      ...local,
      name: trimmedName,
      age,
    };
    localStore.saveProfile(updated);
    this.setCurrentProfileId(validId);
    return updated;
  },

  async updateLanguage(profileId: string, language: Language): Promise<void> {
    const validId = ensureValidUUID(profileId);
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ language })
          .eq('id', validId);

        if (error) {
          console.error('[Supabase Error] Failed to update language in public.profiles:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
            profileId: validId,
          });
        }
      } catch (err) {
        console.error('[Supabase Error] Exception in updateLanguage:', err);
      }
    }
    const local = localStore.getProfile(profileId) || localStore.getProfile(validId);
    if (local) {
      local.language = language;
      localStore.saveProfile(local);
    }
  },
};
