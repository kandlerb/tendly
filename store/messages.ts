import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Message, Lease } from '../types';

interface MessagesState {
  threads: Lease[];
  messages: Record<string, Message[]>;
  unreadCounts: Record<string, number>; // leaseId → unread count
  loadingThreads: boolean;
  fetchThreads: () => Promise<void>;
  fetchMessages: (leaseId: string) => Promise<void>;
  sendMessage: (leaseId: string, body: string, aiDrafted?: boolean) => Promise<void>;
  markAsRead: (leaseId: string) => Promise<void>;
  subscribeToMessages: (leaseId: string) => () => void;
}

export const useMessagesStore = create<MessagesState>((set, get) => ({
  threads: [],
  messages: {},
  unreadCounts: {},
  loadingThreads: false,

  fetchThreads: async () => {
    set({ loadingThreads: true });
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from('leases')
      .select('*, tenant:users(id,full_name,email), unit:units(id,unit_number,property:properties(id,address,nickname))')
      .eq('status', 'active');

    const threads = (data ?? []) as Lease[];

    // Compute unread counts per thread (messages not sent by me and not yet read)
    const unreadCounts: Record<string, number> = {};
    if (user && threads.length > 0) {
      const leaseIds = threads.map((t) => t.id);
      const { data: unreadRows } = await supabase
        .from('messages')
        .select('lease_id')
        .in('lease_id', leaseIds)
        .neq('sender_id', user.id)
        .is('read_at', null);

      for (const row of (unreadRows ?? []) as any[]) {
        unreadCounts[row.lease_id] = (unreadCounts[row.lease_id] ?? 0) + 1;
      }
    }

    set({ threads, unreadCounts, loadingThreads: false });
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

  markAsRead: async (leaseId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('lease_id', leaseId)
      .neq('sender_id', user.id)
      .is('read_at', null);

    // Clear local unread count
    set((state) => ({
      unreadCounts: { ...state.unreadCounts, [leaseId]: 0 },
    }));
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
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `lease_id=eq.${leaseId}`,
      }, (payload) => {
        // Update message in place (e.g. read_at was set)
        set((state) => {
          const existing = state.messages[leaseId] ?? [];
          const updated = existing.map((m) =>
            m.id === (payload.new as Message).id ? { ...m, ...(payload.new as Message) } : m
          );
          return { messages: { ...state.messages, [leaseId]: updated } };
        });
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  },
}));
