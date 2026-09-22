export type Language = 'en' | 'ta';

export interface Profile {
  id: string;
  name: string;
  age: number;
  language: Language;
  created_at?: string;
}

export interface ItemLocation {
  id: string;
  item_id: string;
  location_name: string;
  photo_url: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Item {
  id: string;
  profile_id: string;
  item_name: string;
  name_en?: string;
  name_ta?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ItemWithLocations extends Item {
  locations: ItemLocation[];
  isDemo?: boolean;
}

export interface VoiceSearchState {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  error: string | null;
}
