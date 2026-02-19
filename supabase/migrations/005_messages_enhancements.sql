-- Read receipts
alter table public.messages add column read_at timestamptz;
create index messages_unread_idx on public.messages(lease_id, read_at) where read_at is null;

-- System messages support
alter table public.messages
  add column sender_type text not null default 'user'
    check (sender_type in ('user', 'system'));
alter table public.messages alter column sender_id drop not null;
