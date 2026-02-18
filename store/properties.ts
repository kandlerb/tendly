import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Property, Unit } from '../types';

interface PropertiesState {
  properties: Property[];
  loading: boolean;
  error: string | null;
  fetchProperties: () => Promise<void>;
  addProperty: (data: Omit<Property, 'id' | 'created_at' | 'units'>) => Promise<Property | null>;
  addUnit: (propertyId: string, data: Omit<Unit, 'id'>) => Promise<Unit | null>;
}

export const usePropertiesStore = create<PropertiesState>((set, get) => ({
  properties: [],
  loading: false,
  error: null,

  fetchProperties: async () => {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('properties')
      .select('*, units(*)')
      .order('created_at', { ascending: false });
    if (error) set({ error: error.message, loading: false });
    else set({ properties: data as Property[], loading: false });
  },

  addProperty: async (propertyData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase
      .from('properties')
      .insert({ ...propertyData, landlord_id: user.id })
      .select()
      .single();
    if (error) { set({ error: error.message }); return null; }
    await get().fetchProperties();
    return data as Property;
  },

  addUnit: async (propertyId, unitData) => {
    const { data, error } = await supabase
      .from('units')
      .insert({ ...unitData, property_id: propertyId })
      .select()
      .single();
    if (error) { set({ error: error.message }); return null; }
    await get().fetchProperties();
    return data as Unit;
  },
}));
