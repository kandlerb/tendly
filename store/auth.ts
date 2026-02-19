import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  session: any | null;
  loading: boolean;
  activeView: 'landlord' | 'tenant';
  setSession: (session: any) => void;
  setUser: (user: User | null) => void;
  setActiveView: (view: 'landlord' | 'tenant') => void;
  signOut: () => Promise<void>;
  fetchUser: (userId: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,
  activeView: 'landlord',

  setSession: (session) => set({ session, loading: false }),
  setUser: (user) => set({ user }),
  setActiveView: (view) => set({ activeView: view }),

  fetchUser: async (userId: string) => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) set({ user: data as User });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, activeView: 'landlord' });
  },
}));
