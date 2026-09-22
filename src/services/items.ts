import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ItemWithLocations, ItemLocation } from '../types';
import { localStore } from './localStore';
import { profilesService } from './profiles';
import {
  getItemBilingualNames,
  enrichItemWithBilingualNames,
  registerItemBilingualNames,
} from '../utils/itemTranslation';

export const DEMO_ITEMS_DATA = [
  {
    name: 'Key',
    nameTa: 'சாவி (Key)',
    locations: [
      {
        name: 'Hall Table',
        photo: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=600&q=80'
      },
      {
        name: 'Bedroom Table',
        photo: 'https://images.unsplash.com/photo-1540518614846-7ede433c4550?auto=format&fit=crop&w=600&q=80'
      },
      {
        name: 'College Bag',
        photo: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80'
      }
    ]
  },
  {
    name: 'Wallet',
    nameTa: 'பணப்பை (Wallet)',
    locations: [
      {
        name: 'Study Table',
        photo: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=600&q=80'
      },
      {
        name: 'Backpack',
        photo: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80'
      }
    ]
  },
  {
    name: 'Spectacles',
    nameTa: 'மூக்குக்கண்ணாடி (Spectacles)',
    locations: [
      {
        name: 'Bedside Table',
        photo: 'https://images.unsplash.com/photo-1540518614846-7ede433c4550?auto=format&fit=crop&w=600&q=80'
      },
      {
        name: 'Study Table',
        photo: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=600&q=80'
      }
    ]
  },
  {
    name: 'Charger',
    nameTa: 'சார்ஜர் (Charger)',
    locations: [
      {
        name: 'Study Table',
        photo: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=600&q=80'
      },
      {
        name: 'College Bag',
        photo: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80'
      }
    ]
  },
  {
    name: 'College ID Card',
    nameTa: 'கல்லூரி அடையாள அட்டை (ID Card)',
    locations: [
      {
        name: 'Study Table',
        photo: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=600&q=80'
      },
      {
        name: 'College Bag',
        photo: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80'
      }
    ]
  }
];

// Helper to normalize search query words (singular/plural and prefixes like "where is my...")
export function normalizeSearchTerm(raw: string): string[] {
  let cleaned = raw
    .toLowerCase()
    .trim()
    .replace(/[?,.!'"]/g, '');

  // Strip conversational prefixes in English
  const prefixes = [
    'where is my',
    'where are my',
    'where did i put my',
    'where did i keep my',
    'where is the',
    'where are the',
    'find my',
    'search for',
    'look for',
    'show me my',
    'show me the',
    'tell me where my',
    'where my',
  ];

  for (const prefix of prefixes) {
    if (cleaned.startsWith(prefix)) {
      cleaned = cleaned.slice(prefix.length).trim();
      break;
    }
  }

  // Strip conversational prefixes in Tamil
  const prefixesTa = [
    'என் ',
    'எங்கே ',
    'எங்கே இருக்கிறது ',
    'எங்க இருக்கு ',
    'எங்கே உள்ளது ',
    'பொருளைக் கண்டுபிடி ',
    'கண்டுபிடி ',
  ];

  for (const prefix of prefixesTa) {
    if (cleaned.startsWith(prefix)) {
      cleaned = cleaned.slice(prefix.length).trim();
      break;
    }
  }

  const variations = new Set<string>();
  if (cleaned) {
    variations.add(cleaned);

    // Singular / Plural English variations
    if (cleaned.endsWith('ies') && cleaned.length > 3) {
      variations.add(cleaned.slice(0, -3) + 'y'); // e.g. batteries -> battery
    } else if (cleaned.endsWith('es') && cleaned.length > 3) {
      variations.add(cleaned.slice(0, -2)); // e.g. glasses -> glass
    } else if (cleaned.endsWith('s') && cleaned.length > 2) {
      variations.add(cleaned.slice(0, -1)); // e.g. keys -> key
    } else {
      variations.add(cleaned + 's'); // e.g. key -> keys
      variations.add(cleaned + 'es');
    }

    // Tamil plural variation (கள்)
    if (cleaned.endsWith('கள்') && cleaned.length > 3) {
      variations.add(cleaned.slice(0, -3));
    } else {
      variations.add(cleaned + 'கள்');
    }
  }

  return Array.from(variations);
}

export const itemsService = {
  async getItems(profileId: string): Promise<ItemWithLocations[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const guaranteedProfile = await profilesService.ensureProfileExists(profileId);
        const validProfileId = guaranteedProfile.id;

        const { data, error } = await supabase
          .from('items')
          .select(`
            id,
            profile_id,
            item_name,
            created_at,
            updated_at,
            item_locations (
              id,
              item_id,
              location_name,
              photo_url,
              created_at,
              updated_at
            )
          `)
          .eq('profile_id', validProfileId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[Supabase Error] Failed to getItems from public.items:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
            profileId: validProfileId,
          });
        } else if (data) {
          type RawItemRow = {
            id: string;
            profile_id: string;
            item_name: string;
            created_at?: string;
            updated_at?: string;
            item_locations: ItemLocation[];
          };
          const formatted: ItemWithLocations[] = (data as unknown as RawItemRow[]).map(item => {
            const rawItem: ItemWithLocations = {
              id: item.id,
              profile_id: item.profile_id,
              item_name: item.item_name,
              created_at: item.created_at,
              updated_at: item.updated_at,
              locations: item.item_locations || [],
            };
            return enrichItemWithBilingualNames(rawItem);
          });
          return formatted;
        }
      } catch (err) {
        console.error('[Supabase Error] Exception in getItems:', err);
      }
    }

    return localStore.getItems(profileId);
  },

  /**
   * Persists an item following the exact sequence:
   * 1. profiles: ensure profile exists in public.profiles
   * 2. items: insert or update public.items
   * 3. item_locations: insert rows into public.item_locations
   */
  async saveItem(
    profileId: string,
    itemName: string,
    locations: { id?: string; location_name: string; photo_url?: string | null }[],
    existingItemId?: string
  ): Promise<ItemWithLocations> {
    const trimmedName = itemName.trim();
    const now = new Date().toISOString();

    if (isSupabaseConfigured && supabase) {
      try {
        // ========================================================
        // STEP 1: PROFILES TABLE
        // Ensure profile row exists in public.profiles to satisfy Foreign Key constraint
        // ========================================================
        console.log('[Supabase Pipeline: Step 1] Ensuring profile exists in public.profiles for ID:', profileId);
        const guaranteedProfile = await profilesService.ensureProfileExists(profileId);
        const validProfileId = guaranteedProfile.id;
        console.log('[Supabase Pipeline: Step 1 Success] Verified profile ID:', validProfileId);

        let itemId = existingItemId;

        // ========================================================
        // STEP 2: ITEMS TABLE
        // Insert new item or update existing item in public.items
        // ========================================================
        if (itemId) {
          console.log('[Supabase Pipeline: Step 2] Updating existing item in public.items, id:', itemId);
          const { data: updateData, error: updateError } = await supabase
            .from('items')
            .update({ item_name: trimmedName, updated_at: now })
            .eq('id', itemId)
            .select()
            .single();

          if (updateError) {
            console.error('[Supabase Error] Step 2 Failed: Error updating item in public.items:', {
              message: updateError.message,
              code: updateError.code,
              details: updateError.details,
              hint: updateError.hint,
              payload: { id: itemId, item_name: trimmedName },
            });
            throw updateError;
          }
          console.log('[Supabase Pipeline: Step 2 Success] Item updated:', updateData);
        } else {
          console.log('[Supabase Pipeline: Step 2] Inserting new item into public.items:', {
            profile_id: validProfileId,
            item_name: trimmedName,
          });

          const { data: itemData, error: itemError } = await supabase
            .from('items')
            .insert({
              profile_id: validProfileId,
              item_name: trimmedName,
            })
            .select()
            .single();

          if (itemError) {
            console.error('[Supabase Error] Step 2 Failed: Error inserting item into public.items:', {
              message: itemError.message,
              code: itemError.code,
              details: itemError.details,
              hint: itemError.hint,
              payload: { profile_id: validProfileId, item_name: trimmedName },
            });
            throw itemError;
          }
          itemId = itemData.id;
          console.log('[Supabase Pipeline: Step 2 Success] Item created with id:', itemId);
        }

        // ========================================================
        // STEP 3: ITEM_LOCATIONS TABLE
        // Insert location rows into public.item_locations
        // ========================================================
        if (existingItemId) {
          console.log('[Supabase Pipeline: Step 3] Clearing previous locations for item_id:', itemId);
          const { error: delError } = await supabase
            .from('item_locations')
            .delete()
            .eq('item_id', itemId);

          if (delError) {
            console.error('[Supabase Error] Step 3 Warning: Error deleting old locations:', {
              message: delError.message,
              code: delError.code,
              details: delError.details,
            });
          }
        }

        const locationsToInsert = locations.map(loc => ({
          item_id: itemId,
          location_name: loc.location_name.trim(),
          photo_url: loc.photo_url || null,
        }));

        let insertedLocations: ItemLocation[] = [];
        if (locationsToInsert.length > 0) {
          console.log('[Supabase Pipeline: Step 3] Inserting locations into public.item_locations:', locationsToInsert);
          const { data: locData, error: locError } = await supabase
            .from('item_locations')
            .insert(locationsToInsert)
            .select();

          if (locError) {
            console.error('[Supabase Error] Step 3 Failed: Error inserting item_locations into public.item_locations:', {
              message: locError.message,
              code: locError.code,
              details: locError.details,
              hint: locError.hint,
              payload: locationsToInsert,
            });
            throw locError;
          }
          insertedLocations = (locData as ItemLocation[]) || [];
          console.log('[Supabase Pipeline: Step 3 Success] Inserted', insertedLocations.length, 'locations into public.item_locations');
        }

        const bilingual = getItemBilingualNames(trimmedName, itemId);
        registerItemBilingualNames(itemId!, bilingual.name_en, bilingual.name_ta);

        const result: ItemWithLocations = {
          id: itemId!,
          profile_id: validProfileId,
          item_name: trimmedName,
          name_en: bilingual.name_en,
          name_ta: bilingual.name_ta,
          created_at: now,
          updated_at: now,
          locations: insertedLocations,
        };

        // Resiliently cache locally as well
        localStore.saveItemWithLocations(validProfileId, trimmedName, locations, itemId);

        console.log('[Supabase Complete] Flow profiles → items → item_locations executed successfully for:', trimmedName);
        return result;
      } catch (err: any) {
        console.error('[Supabase Fatal Error] saveItem failed in Supabase pipeline:', {
          error: err?.message || err,
          code: err?.code,
          details: err?.details,
          hint: err?.hint,
          profileId,
          itemName: trimmedName,
        });
        throw err;
      }
    }

    // Fallback when Supabase is not configured
    console.log('[LocalStore] Supabase not configured. Persisting item locally.');
    return localStore.saveItemWithLocations(profileId, trimmedName, locations, existingItemId);
  },

  async deleteItem(itemId: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('items')
          .delete()
          .eq('id', itemId);

        if (error) {
          console.error('[Supabase Error] Failed to delete item from public.items:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
            itemId,
          });
          throw error;
        }
        console.log('[Supabase Success] Deleted item from public.items:', itemId);
      } catch (err: any) {
        console.error('[Supabase Error] Exception in deleteItem:', err?.message || err);
        throw err;
      }
    }

    localStore.deleteItem(itemId);
    return true;
  },

  async searchItems(profileId: string, query: string): Promise<ItemWithLocations[]> {
    const allItems = await this.getItems(profileId);
    if (!query.trim()) return allItems;

    const terms = normalizeSearchTerm(query);

    return allItems.filter(item => {
      const name = item.item_name.toLowerCase();
      const nameEn = (item.name_en || '').toLowerCase();
      const nameTa = (item.name_ta || '').toLowerCase();

      // Check if item matches any normalized term in original or translated forms
      for (const term of terms) {
        if (!term) continue;
        if (name === term || nameEn === term || nameTa === term) return true; // exact match
        if (
          name.includes(term) ||
          (nameEn && nameEn.includes(term)) ||
          (nameTa && nameTa.includes(term))
        ) {
          return true; // partial match
        }
        if (
          term.includes(name) ||
          (nameEn && term.includes(nameEn)) ||
          (nameTa && term.includes(nameTa))
        ) {
          return true;
        }
      }

      // Also check location names for convenient discovery
      for (const loc of item.locations) {
        const locName = loc.location_name.toLowerCase();
        for (const term of terms) {
          if (term && locName.includes(term)) return true;
        }
      }

      return false;
    });
  },

  async seedDemoData(profileId: string): Promise<ItemWithLocations[]> {
    const created: ItemWithLocations[] = [];

    // Ensure profile exists in Supabase first
    await profilesService.ensureProfileExists(profileId);

    for (const demo of DEMO_ITEMS_DATA) {
      const item = await this.saveItem(
        profileId,
        demo.name,
        demo.locations.map(l => ({
          location_name: l.name,
          photo_url: l.photo,
        }))
      );
      created.push(item);
    }

    return created;
  }
};
