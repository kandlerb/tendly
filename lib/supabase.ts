import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const storage = Platform.OS === 'web'
  ? {
      getItem:    (key: string) => Promise.resolve(
        typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null
      ),
      setItem:    (key: string, value: string) => Promise.resolve(
        typeof localStorage !== 'undefined' ? localStorage.setItem(key, value) : undefined
      ),
      removeItem: (key: string) => Promise.resolve(
        typeof localStorage !== 'undefined' ? localStorage.removeItem(key) : undefined
      ),
    }
  : {
      getItem:    SecureStore.getItemAsync,
      setItem:    SecureStore.setItemAsync,
      removeItem: SecureStore.deleteItemAsync,
    };

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
