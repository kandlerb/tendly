-- Admin users are also landlords (role stays 'landlord').
-- is_admin is a privilege flag only; no RLS changes needed.
alter table public.users
  add column is_admin boolean not null default false;
