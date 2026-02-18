import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { MaintenanceRequest } from '../types';

interface MaintenanceState {
  requests: MaintenanceRequest[];
  loading: boolean;
  fetchRequests: () => Promise<void>;
  updateRequest: (id: string, updates: Partial<MaintenanceRequest>) => Promise<void>;
}

export const useMaintenanceStore = create<MaintenanceState>((set) => ({
  requests: [],
  loading: false,

  fetchRequests: async () => {
    set({ loading: true });
    const { data } = await supabase
      .from('maintenance_requests')
      .select('*, tenant:users(id,full_name,email), unit:units(id,unit_number,property:properties(id,address,nickname)), vendor:vendors(*)')
      .order('created_at', { ascending: false });
    set({ requests: (data ?? []) as MaintenanceRequest[], loading: false });
  },

  updateRequest: async (id, updates) => {
    await supabase.from('maintenance_requests').update(updates).eq('id', id);
    set((state) => ({
      requests: state.requests.map((r) => r.id === id ? { ...r, ...updates } : r),
    }));
  },
}));
