import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  Database,
  ShieldCheck,
  HardDrive,
  Terminal,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import {
  SUPABASE_SQL_SCHEMA,
  isSupabaseConfigured,
  checkSupabaseConnection,
  SupabaseConnectionStatus,
  cleanUrl,
} from '../lib/supabase';
import { Language } from '../types';
import { getTranslation } from '../i18n/translations';

interface SupabaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const SupabaseSetupModal: React.FC<SupabaseSetupModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const [copied, setCopied] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<SupabaseConnectionStatus | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const t = getTranslation(language);

  const testConnection = async () => {
    setIsTesting(true);
    try {
      const status = await checkSupabaseConnection();
      setConnectionStatus(status);
    } catch {
      setConnectionStatus({
        configured: isSupabaseConfigured,
        connected: false,
        tablesExist: false,
        errorMessage: 'Unable to test connection',
      });
    } finally {
      setIsTesting(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      testConnection();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {t.setupSupabase}
                </h3>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    isSupabaseConfigured
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}
                >
                  {isSupabaseConfigured ? 'Connected' : 'Local Storage Mode'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                PostgreSQL Tables, Row Level Security (RLS), and Storage Bucket Setup
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-sm">
          {/* Live Connection Status Banner */}
          <div
            className={`p-4 rounded-2xl border flex items-start justify-between gap-3 ${
              connectionStatus?.connected && connectionStatus.tablesExist
                ? 'bg-emerald-50/80 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : connectionStatus?.connected && !connectionStatus.tablesExist
                ? 'bg-amber-50/80 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                : isSupabaseConfigured
                ? 'bg-rose-50/80 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                : 'bg-slate-50 border-slate-200 dark:bg-slate-800/60 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="flex items-start gap-3">
              {connectionStatus?.connected && connectionStatus.tablesExist ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              ) : connectionStatus?.connected && !connectionStatus.tablesExist ? (
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              ) : (
                <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
              )}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider mb-1 flex items-center gap-2">
                  <span>
                    {connectionStatus?.connected && connectionStatus.tablesExist
                      ? 'Supabase Connected & Tables Ready'
                      : connectionStatus?.connected && !connectionStatus.tablesExist
                      ? 'Connected to Supabase (Tables Missing)'
                      : isSupabaseConfigured
                      ? 'Connecting to Supabase...'
                      : 'Dual-Engine: Local Storage Active'}
                  </span>
                  {cleanUrl && (
                    <span className="text-[10px] font-mono lowercase opacity-75">
                      ({cleanUrl})
                    </span>
                  )}
                </h4>
                <p className="text-xs leading-relaxed">
                  {connectionStatus?.connected && connectionStatus.tablesExist
                    ? 'All items, locations, and photos are actively persisting to your live Supabase PostgreSQL database.'
                    : connectionStatus?.connected && !connectionStatus.tablesExist
                    ? 'Supabase credentials are valid and reachable, but the tables (profiles, items, item_locations) have not been created yet. Please copy the SQL below and run it in the Supabase SQL editor!'
                    : isSupabaseConfigured
                    ? connectionStatus?.errorMessage || 'Attempting to verify connection to Supabase...'
                    : 'Ninaivu is currently storing data in your browser sandbox. To connect Supabase, configure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in environment secrets.'}
                </p>
              </div>
            </div>

            <button
              onClick={testConnection}
              disabled={isTesting}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-emerald-600' : ''}`} />
              <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
            </button>
          </div>

          {/* Quick Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                <Terminal className="w-4 h-4" />
                <span>Step 1: Run SQL</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Paste the SQL schema below into Supabase SQL Editor and click <strong>Run</strong>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                <HardDrive className="w-4 h-4" />
                <span>Step 2: Create Bucket</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Go to Storage &gt; Create new bucket named <strong>item-photos</strong> (Public: ON).
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>Step 3: Add Keys</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Provide <code>VITE_SUPABASE_URL</code> & <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> in environment settings.
              </p>
            </div>
          </div>

          {/* SQL Code Block with Copy Button */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                PostgreSQL Tables &amp; RLS Policies (Copy &amp; Run in Supabase SQL Editor)
              </span>
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy SQL Schema'}</span>
              </button>
            </div>

            <pre className="p-4 rounded-2xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed select-all">
              {SUPABASE_SQL_SCHEMA}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold transition-colors cursor-pointer"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
