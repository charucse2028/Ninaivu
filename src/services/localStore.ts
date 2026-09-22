import { Profile, Item, ItemLocation, ItemWithLocations } from '../types';
import { getItemBilingualNames, enrichItemWithBilingualNames } from '../utils/itemTranslation';

const PROFILES_KEY = 'ninaivu_profiles';
const ITEMS_KEY = 'ninaivu_items';
const LOCATIONS_KEY = 'ninaivu_locations';

export const localStore = {
  getProfiles(): Profile[] {
    try {
      const data = localStorage.getItem(PROFILES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  getProfile(id: string): Profile | null {
    const profiles = this.getProfiles();
    return profiles.find(p => p.id === id) || null;
  },

  findProfileByNameAge(name: string, age: number): Profile | null {
    const profiles = this.getProfiles();
    const clean = name.trim().toLowerCase();
    return profiles.find(p => p.name.trim().toLowerCase() === clean && Number(p.age) === Number(age)) || null;
  },

  saveProfile(profile: Profile): Profile {
    const profiles = this.getProfiles();
    const index = profiles.findIndex(p => p.id === profile.id);
    if (index >= 0) {
      profiles[index] = profile;
    } else {
      profiles.push(profile);
    }
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
    return profile;
  },

  getItems(profileId: string): ItemWithLocations[] {
    try {
      const itemsRaw = localStorage.getItem(ITEMS_KEY);
      const items: Item[] = itemsRaw ? JSON.parse(itemsRaw) : [];
      const userItems = items.filter(i => i.profile_id === profileId);

      const locsRaw = localStorage.getItem(LOCATIONS_KEY);
      const locations: ItemLocation[] = locsRaw ? JSON.parse(locsRaw) : [];

      return userItems.map(item => {
        const enriched = enrichItemWithBilingualNames(item);
        return {
          ...enriched,
          locations: locations.filter(l => l.item_id === item.id),
        };
      });
    } catch {
      return [];
    }
  },

  saveItemWithLocations(
    profileId: string,
    itemName: string,
    locationsData: { id?: string; location_name: string; photo_url?: string | null }[],
    existingItemId?: string
  ): ItemWithLocations {
    const itemsRaw = localStorage.getItem(ITEMS_KEY);
    let items: Item[] = itemsRaw ? JSON.parse(itemsRaw) : [];

    const locsRaw = localStorage.getItem(LOCATIONS_KEY);
    let locations: ItemLocation[] = locsRaw ? JSON.parse(locsRaw) : [];

    const now = new Date().toISOString();
    let item: Item;
    const bilingual = getItemBilingualNames(itemName, existingItemId);

    if (existingItemId) {
      const index = items.findIndex(i => i.id === existingItemId);
      if (index >= 0) {
        items[index] = {
          ...items[index],
          item_name: itemName,
          name_en: bilingual.name_en,
          name_ta: bilingual.name_ta,
          updated_at: now,
        };
        item = items[index];
      } else {
        item = {
          id: existingItemId,
          profile_id: profileId,
          item_name: itemName,
          name_en: bilingual.name_en,
          name_ta: bilingual.name_ta,
          created_at: now,
          updated_at: now,
        };
        items.push(item);
      }
      // Remove old locations for this item
      locations = locations.filter(l => l.item_id !== existingItemId);
    } else {
      const newItemId = crypto.randomUUID();
      const newBilingual = getItemBilingualNames(itemName, newItemId);
      item = {
        id: newItemId,
        profile_id: profileId,
        item_name: itemName,
        name_en: newBilingual.name_en,
        name_ta: newBilingual.name_ta,
        created_at: now,
        updated_at: now,
      };
      items.unshift(item);
    }

    const newLocations: ItemLocation[] = locationsData.map(loc => ({
      id: loc.id || crypto.randomUUID(),
      item_id: item.id,
      location_name: loc.location_name,
      photo_url: loc.photo_url || null,
      created_at: now,
      updated_at: now,
    }));

    locations.push(...newLocations);

    localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
    localStorage.setItem(LOCATIONS_KEY, JSON.stringify(locations));

    return {
      ...item,
      locations: newLocations,
    };
  },

  deleteItem(itemId: string): void {
    const itemsRaw = localStorage.getItem(ITEMS_KEY);
    let items: Item[] = itemsRaw ? JSON.parse(itemsRaw) : [];
    items = items.filter(i => i.id !== itemId);
    localStorage.setItem(ITEMS_KEY, JSON.stringify(items));

    const locsRaw = localStorage.getItem(LOCATIONS_KEY);
    let locations: ItemLocation[] = locsRaw ? JSON.parse(locsRaw) : [];
    locations = locations.filter(l => l.item_id !== itemId);
    localStorage.setItem(LOCATIONS_KEY, JSON.stringify(locations));
  }
};
