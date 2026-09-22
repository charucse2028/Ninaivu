import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Normalizes any Supabase URL to ensure it is strictly the project base URL.
 * Strips any accidental paths like /rest/v1, /api, /storage, or trailing slashes.
 * Example: "https://xxxxx.supabase.co/rest/v1/" -> "https://xxxxx.supabase.co"
 */
export function normalizeSupabaseUrl(raw: string | undefined): string {
  if (!raw) return '';
  const trimmed = raw.trim().replace(/^["']|["']$/g, '');
  if (!trimmed) return '';

  try {
    const parsed = new URL(trimmed);
    // Returns strictly the origin (protocol + host, e.g. "https://xxxxx.supabase.co")
    return parsed.origin;
  } catch {
    return trimmed
      .replace(/\/rest\/v1\/?$/i, '')
      .replace(/\/api\/?$/i, '')
      .replace(/\/storage\/?$/i, '')
      .replace(/\/+$/, '');
  }
}

// Read from Vite environment variables (or runtime fallbacks)
const rawUrl = (
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
  ''
);

const rawKey = (
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_PUBLISHABLE_KEY) ||
  ''
).trim().replace(/^["']|["']$/g, '');

// Clean and ensure strictly base project URL
export const cleanUrl = normalizeSupabaseUrl(rawUrl);
export const cleanPublishableKey = rawKey;

export const isSupabaseConfigured = Boolean(
  cleanUrl &&
  cleanPublishableKey &&
  cleanUrl.startsWith('http') &&
  !cleanUrl.includes('your-project') &&
  !cleanPublishableKey.includes('your-anon')
);

export let supabase: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  try {
    // Official Supabase client initialized with base project URL and public publishable key
    supabase = createClient(cleanUrl, cleanPublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    supabase = null;
  }
}

export interface SupabaseConnectionStatus {
  configured: boolean;
  connected: boolean;
  tablesExist: boolean;
  url?: string;
  errorMessage?: string;
}

/**
 * Live test to verify Supabase connectivity and whether database tables exist.
 * Uses official @supabase/supabase-js client query.
 */
export async function checkSupabaseConnection(): Promise<SupabaseConnectionStatus> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      configured: false,
      connected: false,
      tablesExist: false,
      errorMessage: 'VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are not configured yet.',
    };
  }

  try {
    // Query profiles table via official client
    const { error } = await supabase.from('profiles').select('id').limit(1);

    if (error) {
      // 42P01 is Postgres error code for undefined_table
      if (error.code === '42P01' || error.message?.toLowerCase().includes('does not exist')) {
        return {
          configured: true,
          connected: true,
          tablesExist: false,
          url: cleanUrl,
          errorMessage: 'Connected to Supabase PostgreSQL, but tables are missing. Please run the SQL schema.',
        };
      }

      return {
        configured: true,
        connected: false,
        tablesExist: false,
        url: cleanUrl,
        errorMessage: error.message || 'Error communicating with Supabase.',
      };
    }

    return {
      configured: true,
      connected: true,
      tablesExist: true,
      url: cleanUrl,
    };
  } catch (err: any) {
    return {
      configured: true,
      connected: false,
      tablesExist: false,
      url: cleanUrl,
      errorMessage: err?.message || 'Network error connecting to Supabase.',
    };
  }
}

// SQL Schema for users to execute in Supabase SQL editor
export const SUPABASE_SQL_SCHEMA = `-- ==========================================================
-- NINAIVU (நினைவு) - SMART ITEM MEMORY ASSISTANT DATABASE SETUP
-- ==========================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create PROFILES Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  language TEXT DEFAULT 'en' CHECK (language IN ('en', 'ta')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create ITEMS Table
CREATE TABLE IF NOT EXISTS public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create ITEM_LOCATIONS Table
CREATE TABLE IF NOT EXISTS public.item_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  location_name TEXT NOT NULL,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Create Indexes for Search Performance
CREATE INDEX IF NOT EXISTS idx_items_profile_id ON public.items(profile_id);
CREATE INDEX IF NOT EXISTS idx_items_item_name ON public.items(item_name);
CREATE INDEX IF NOT EXISTS idx_item_locations_item_id ON public.item_locations(item_id);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_locations ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for Public/Prototype Session Access
-- (Permissive for prototype access by profile id, compatible with anonymous sessions)
CREATE POLICY "Allow public select on profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow public insert on profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on profiles" ON public.profiles FOR UPDATE USING (true);

CREATE POLICY "Allow select on items" ON public.items FOR SELECT USING (true);
CREATE POLICY "Allow insert on items" ON public.items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on items" ON public.items FOR UPDATE USING (true);
CREATE POLICY "Allow delete on items" ON public.items FOR DELETE USING (true);

CREATE POLICY "Allow select on item_locations" ON public.item_locations FOR SELECT USING (true);
CREATE POLICY "Allow insert on item_locations" ON public.item_locations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on item_locations" ON public.item_locations FOR UPDATE USING (true);
CREATE POLICY "Allow delete on item_locations" ON public.item_locations FOR DELETE USING (true);

-- 8. Storage Bucket Setup
-- Create the public bucket 'item-photos' in Supabase Storage Dashboard:
-- Bucket Name: item-photos (Public: Yes)
`;
