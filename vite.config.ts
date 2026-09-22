import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';

function normalizeSupabaseUrl(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim().replace(/^["']|["']$/g, '');
  try {
    const parsed = new URL(trimmed);
    return parsed.origin;
  } catch {
    return trimmed.replace(/\/rest\/v1\/?$/i, '').replace(/\/api\/?$/i, '').replace(/\/+$/, '');
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  let devEnv: Record<string, string> = {};
  try {
    const devEnvPath = path.resolve(__dirname, '../.dev.env.json');
    if (fs.existsSync(devEnvPath)) {
      devEnv = JSON.parse(fs.readFileSync(devEnvPath, 'utf-8'));
    }
  } catch {
    // ignore
  }

  const rawSupabaseUrl =
    process.env.VITE_SUPABASE_URL ||
    devEnv.VITE_SUPABASE_URL ||
    env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    devEnv.SUPABASE_URL ||
    env.SUPABASE_URL ||
    '';

  const supabaseUrl = normalizeSupabaseUrl(rawSupabaseUrl);

  const supabasePublishableKey = (
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    devEnv.VITE_SUPABASE_PUBLISHABLE_KEY ||
    env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    devEnv.VITE_SUPABASE_ANON_KEY ||
    env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    devEnv.SUPABASE_PUBLISHABLE_KEY ||
    env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    devEnv.SUPABASE_ANON_KEY ||
    env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_KEY ||
    devEnv.SUPABASE_KEY ||
    env.SUPABASE_KEY ||
    ''
  ).trim().replace(/^["']|["']$/g, '');

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(supabasePublishableKey),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
