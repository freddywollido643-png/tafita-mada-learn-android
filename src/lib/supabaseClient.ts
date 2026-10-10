import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Default Supabase project reference for Tafita mada
export const SUPABASE_PROJECT_REF = 'szxficncfyvghhxqzlnp';
export const DEFAULT_SUPABASE_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co`;

const getStoredAnonKey = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('tafita_supabase_anon_key') || '';
  }
  return '';
};

export const getSupabaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  if (envUrl && (envUrl.startsWith('https://') || envUrl.startsWith('http://'))) {
    return envUrl;
  }
  return DEFAULT_SUPABASE_URL;
};

export const getSupabaseAnonKey = (): string => {
  return import.meta.env.VITE_SUPABASE_ANON_KEY || getStoredAnonKey();
};

export const isSupabaseConfigured = (): boolean => {
  const key = getSupabaseAnonKey();
  return Boolean(key && key.trim().length > 10);
};

let clientInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey() || 'dummy-placeholder-key-for-init';

  if (!clientInstance) {
    clientInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return clientInstance;
};

export const setSupabaseAnonKey = (key: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('tafita_supabase_anon_key', key.trim());
    // Recreate client with new key
    clientInstance = createClient(getSupabaseUrl(), key.trim(), {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
};

export const clearSupabaseAnonKey = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('tafita_supabase_anon_key');
    clientInstance = null;
  }
};

export const supabase = getSupabaseClient();
