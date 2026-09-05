import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const secure = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};
const web = {
  getItem: async (k: string) => (typeof localStorage !== 'undefined' ? localStorage.getItem(k) : null),
  setItem: async (k: string, v: string) => { if (typeof localStorage !== 'undefined') localStorage.setItem(k, v); },
  removeItem: async (k: string) => { if (typeof localStorage !== 'undefined') localStorage.removeItem(k); },
};

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** Null when env is missing; the app then shows the offline notice instead of crashing. */
export const supabase: SupabaseClient | null =
  url && key
    ? createClient(url, key, {
        auth: { storage: Platform.OS === 'web' ? web : secure, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
      })
    : null;

export const BUCKET = 'pl-photos';
export function photoUrl(path: string | null | undefined): string | null {
  if (!path || !supabase) return null;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
