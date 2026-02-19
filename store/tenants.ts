import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { TenantWithLease, TenantInvitation } from '../types';

interface TenantsState {
  tenants: TenantWithLease[];
  invitations: TenantInvitation[];
  loading: boolean;
  error: string | null;
  fetchTenants: () => Promise<void>;
  fetchInvitations: () => Promise<void>;
  terminateLease: (leaseId: string) => Promise<string | null>;
}

export const useTenantsStore = create<TenantsState>((set, get) => ({
  tenants: [],
  invitations: [],
  loading: false,
  error: null,

  fetchTenants: async () => {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('leases')
      .select(`
        *,
        tenant:users(id, email, full_name, role, is_admin, stripe_customer_id, created_at,
          profile:tenant_profiles(id, phone, emergency_contact_name, emergency_contact_phone, emergency_contact_relation, vehicles, pets, updated_at)
        ),
        unit:units(*, property:properties(*)),
        rent_payments(status, due_date, amount)
      `)
      .eq('status', 'active')
      .order('end_date');

    if (error) {
      set({ error: error.message, loading: false });
      return;
    }

    const tenants = (data ?? []).map((row: any) => {
      const payments: any[] = row.rent_payments ?? [];
      payments.sort((a: any, b: any) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime());
      return {
        ...row,
        tenant: {
          ...row.tenant,
          profile: row.tenant?.profile ?? null,
        },
        recentPayment: payments[0] ?? undefined,
      };
    });

    set({ tenants: tenants as TenantWithLease[], loading: false });
  },

  fetchInvitations: async () => {
    const { data, error } = await supabase
      .from('tenant_invitations')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (!error) {
      set({ invitations: (data ?? []) as TenantInvitation[] });
    }
  },

  terminateLease: async (leaseId: string): Promise<string | null> => {
    const { error } = await supabase
      .from('leases')
      .update({ status: 'terminated' })
      .eq('id', leaseId);

    if (error) return error.message;

    set({ tenants: get().tenants.filter((t) => t.id !== leaseId) });
    return null;
  },
}));
