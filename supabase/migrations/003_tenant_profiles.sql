create table public.tenant_profiles (
  id uuid primary key references public.users(id) on delete cascade,
  phone text,
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relation text,
  vehicles jsonb not null default '[]',
  pets jsonb not null default '[]',
  move_in_notes text,           -- tenant-private, never shown to landlord
  updated_at timestamptz default now()
);

alter table public.tenant_profiles enable row level security;

-- Tenant: full control of their own profile
create policy "tenant_profile_own" on public.tenant_profiles
  for all using (auth.uid() = id);

-- Landlord: read-only, for their active tenants (excludes move_in_notes - handled in app queries)
create policy "tenant_profile_landlord_read" on public.tenant_profiles
  for select using (
    id in (
      select l.tenant_id from public.leases l
      join public.units u on l.unit_id = u.id
      join public.properties p on u.property_id = p.id
      where p.landlord_id = auth.uid() and l.status = 'active'
    )
  );
