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
  checkDeleteProperty: (propertyId: string) => Promise<string | null>;
  deleteProperty: (propertyId: string) => Promise<string | null>;
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
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      set({ error: authError?.message ?? 'Not authenticated' });
      return null;
    }
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

  checkDeleteProperty: async (propertyId: string): Promise<string | null> => {
    const property = get().properties.find((p) => p.id === propertyId);
    const unitIds = property?.units?.map((u) => u.id) ?? [];
    if (unitIds.length === 0) return null;

    const { count: leaseCount } = await supabase
      .from('leases')
      .select('id', { count: 'exact', head: true })
      .in('unit_id', unitIds)
      .eq('status', 'active');
    if ((leaseCount ?? 0) > 0)
      return 'This property has active tenants. End all leases before deleting.';

    const { count: reqCount } = await supabase
      .from('maintenance_requests')
      .select('id', { count: 'exact', head: true })
      .in('unit_id', unitIds)
      .in('status', ['open', 'assigned']);
    if ((reqCount ?? 0) > 0)
      return 'This property has open maintenance requests. Resolve them first.';

    return null;
  },

  deleteProperty: async (propertyId: string): Promise<string | null> => {
    const property = get().properties.find((p) => p.id === propertyId);
    const unitIds = property?.units?.map((u) => u.id) ?? [];

    if (unitIds.length > 0) {
      await supabase.from('maintenance_requests').delete().in('unit_id', unitIds);
      await supabase.from('leases').delete().in('unit_id', unitIds);
      await supabase.from('units').delete().eq('property_id', propertyId);
    }

    const { error } = await supabase.from('properties').delete().eq('id', propertyId);
    if (error) return error.message;

    set({ properties: get().properties.filter((p) => p.id !== propertyId) });
    return null;
  },
}));
