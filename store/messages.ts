import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Message, Lease } from '../types';

interface MessagesState {
  threads: Lease[];
  messages: Record<string, Message[]>;
  loadingThreads: boolean;
  fetchThreads: () => Promise<void>;
  fetchMessages: (leaseId: string) => Promise<void>;
  sendMessage: (leaseId: string, body: string, aiDrafted?: boolean) => Promise<void>;
  subscribeToMessages: (leaseId: string) => () => void;
}

export const useMessagesStore = create<MessagesState>((set, get) => ({
  threads: [],
  messages: {},
  loadingThreads: false,

  fetchThreads: async () => {
    set({ loadingThreads: true });
    const { data } = await supabase
      .from('leases')
      .select('*, tenant:users(id,full_name,email), unit:units(id,unit_number,property:properties(id,address,nickname))')
      .eq('status', 'active');
    set({ threads: (data ?? []) as Lease[], loadingThreads: false });
  },

  fetchMessages: async (leaseId) => {
    const { data } = await supabase
      .from('messages')
      .select('*, sender:users(id,full_name,role)')
      .eq('lease_id', leaseId)
      .order('created_at', { ascending: true });
    set((state) => ({ messages: { ...state.messages, [leaseId]: (data ?? []) as Message[] } }));
  },

  sendMessage: async (leaseId, body, aiDrafted = false) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('messages').insert({
      lease_id: leaseId,
      sender_id: user.id,
      body,
      ai_drafted: aiDrafted,
    });
  },

  subscribeToMessages: (leaseId) => {
    const channel = supabase
      .channel(`messages:${leaseId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `lease_id=eq.${leaseId}`,
      }, (payload) => {
        set((state) => ({
          messages: {
            ...state.messages,
            [leaseId]: [...(state.messages[leaseId] ?? []), payload.new as Message],
          },
        }));
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  },
}));
