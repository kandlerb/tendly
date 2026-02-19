create extension if not exists pgcrypto;

create table public.tenant_invitations (
  id uuid primary key default uuid_generate_v4(),
  landlord_id uuid references public.users(id) on delete cascade not null,
  unit_id uuid references public.units(id) on delete cascade not null,
  email text not null,
  rent_amount integer not null,
  deposit_amount integer not null default 0,
  start_date date not null,
  end_date date not null,
  token text not null unique default encode(gen_random_bytes(32), 'hex'),
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'expired')),
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz default now()
);

alter table public.tenant_invitations enable row level security;
create policy "invitations_landlord" on public.tenant_invitations
  for all using (auth.uid() = landlord_id);

-- Updated trigger: detect invited tenants by email lookup
create or replace function public.handle_new_user()
returns trigger as $$
declare v_role text;
begin
  select case when count(*) > 0 then 'tenant'
    else coalesce(new.raw_user_meta_data->>'role', 'landlord')
  end into v_role
  from public.tenant_invitations
  where email = new.email and status = 'pending';

  insert into public.users (id, email, role, full_name)
  values (
    new.id, new.email, v_role,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;
