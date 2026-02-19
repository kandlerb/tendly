-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- USERS (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  role text not null check (role in ('landlord', 'tenant')),
  full_name text not null default '',
  stripe_customer_id text,
  created_at timestamptz default now()
);

-- PROPERTIES
create table public.properties (
  id uuid primary key default uuid_generate_v4(),
  landlord_id uuid references public.users(id) on delete cascade not null,
  address text not null,
  nickname text,
  mortgage integer, -- cents/month
  insurance integer, -- cents/year
  tax_annual integer, -- cents/year
  created_at timestamptz default now()
);

-- UNITS
create table public.units (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid references public.properties(id) on delete cascade not null,
  unit_number text not null default '1',
  bedrooms integer not null default 1,
  bathrooms numeric(3,1) not null default 1,
  rent_amount integer not null default 0 -- cents/month
);

-- VENDORS
create table public.vendors (
  id uuid primary key default uuid_generate_v4(),
  landlord_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  trade text not null check (trade in ('plumbing', 'electrical', 'hvac', 'general')),
  phone text,
  email text,
  notes text
);

-- LEASES
create table public.leases (
  id uuid primary key default uuid_generate_v4(),
  unit_id uuid references public.units(id) on delete cascade not null,
  tenant_id uuid references public.users(id) on delete cascade not null,
  start_date date not null,
  end_date date not null,
  rent_amount integer not null, -- cents/month
  deposit_amount integer not null default 0, -- cents
  document_url text,
  status text not null default 'active' check (status in ('active', 'expired', 'terminated'))
);

-- RENT PAYMENTS
create table public.rent_payments (
  id uuid primary key default uuid_generate_v4(),
  lease_id uuid references public.leases(id) on delete cascade not null,
  amount integer not null, -- cents
  due_date date not null,
  paid_at timestamptz,
  method text check (method in ('ach', 'card', 'manual')),
  stripe_payment_intent_id text,
  status text not null default 'pending' check (status in ('pending', 'paid', 'late', 'waived'))
);

-- MAINTENANCE REQUESTS
create table public.maintenance_requests (
  id uuid primary key default uuid_generate_v4(),
  unit_id uuid references public.units(id) on delete cascade not null,
  tenant_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  description text not null,
  photo_urls text[] default '{}',
  urgency text not null default 'routine' check (urgency in ('emergency', 'urgent', 'routine')),
  trade text not null default 'general' check (trade in ('plumbing', 'electrical', 'hvac', 'general')),
  status text not null default 'open' check (status in ('open', 'assigned', 'resolved')),
  vendor_id uuid references public.vendors(id),
  created_at timestamptz default now()
);

-- MESSAGES
create table public.messages (
  id uuid primary key default uuid_generate_v4(),
  lease_id uuid references public.leases(id) on delete cascade not null,
  sender_id uuid references public.users(id) on delete cascade not null,
  body text not null,
  ai_drafted boolean not null default false,
  created_at timestamptz default now()
);

-- DOCUMENTS
create table public.documents (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid references public.properties(id) on delete cascade not null,
  unit_id uuid references public.units(id) on delete set null,
  name text not null,
  type text not null check (type in ('lease', 'receipt', 'photo', 'insurance', 'other')),
  storage_url text not null,
  created_at timestamptz default now()
);

-- SUBSCRIPTIONS
create table public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  landlord_id uuid references public.users(id) on delete cascade not null unique,
  stripe_subscription_id text,
  plan text not null default 'starter' check (plan in ('starter', 'standard', 'annual')),
  unit_count integer not null default 0,
  status text not null default 'active' check (status in ('active', 'canceled', 'past_due', 'trialing')),
  current_period_end timestamptz
);

-- =====================
-- ROW LEVEL SECURITY
-- =====================

alter table public.users enable row level security;
alter table public.properties enable row level security;
alter table public.units enable row level security;
alter table public.vendors enable row level security;
alter table public.leases enable row level security;
alter table public.rent_payments enable row level security;
alter table public.maintenance_requests enable row level security;
alter table public.messages enable row level security;
alter table public.documents enable row level security;
alter table public.subscriptions enable row level security;

-- Users: can only see their own row
create policy "users_own" on public.users
  for all using (auth.uid() = id);

-- Properties: landlord sees their own
create policy "properties_landlord" on public.properties
  for all using (auth.uid() = landlord_id);

-- Units: landlord sees units on their properties
create policy "units_landlord" on public.units
  for all using (
    property_id in (select id from public.properties where landlord_id = auth.uid())
  );

-- Tenant sees units they have an active lease for
create policy "units_tenant" on public.units
  for select using (
    id in (select unit_id from public.leases where tenant_id = auth.uid())
  );

-- Vendors: landlord sees their own
create policy "vendors_landlord" on public.vendors
  for all using (auth.uid() = landlord_id);

-- Leases: landlord sees leases on their units; tenant sees their own
create policy "leases_landlord" on public.leases
  for all using (
    unit_id in (
      select u.id from public.units u
      join public.properties p on u.property_id = p.id
      where p.landlord_id = auth.uid()
    )
  );
create policy "leases_tenant" on public.leases
  for select using (tenant_id = auth.uid());

-- Rent payments: same access as leases
create policy "rent_payments_landlord" on public.rent_payments
  for all using (
    lease_id in (
      select l.id from public.leases l
      join public.units u on l.unit_id = u.id
      join public.properties p on u.property_id = p.id
      where p.landlord_id = auth.uid()
    )
  );
create policy "rent_payments_tenant" on public.rent_payments
  for select using (
    lease_id in (select id from public.leases where tenant_id = auth.uid())
  );

-- Maintenance requests: landlord sees all on their units; tenant sees their own
create policy "maintenance_landlord" on public.maintenance_requests
  for all using (
    unit_id in (
      select u.id from public.units u
      join public.properties p on u.property_id = p.id
      where p.landlord_id = auth.uid()
    )
  );
create policy "maintenance_tenant" on public.maintenance_requests
  for all using (tenant_id = auth.uid());

-- Messages: both parties on a lease can see them
create policy "messages_access" on public.messages
  for all using (
    lease_id in (
      select l.id from public.leases l
      join public.units u on l.unit_id = u.id
      join public.properties p on u.property_id = p.id
      where p.landlord_id = auth.uid() or l.tenant_id = auth.uid()
    )
  );

-- Documents: landlord only
create policy "documents_landlord" on public.documents
  for all using (
    property_id in (select id from public.properties where landlord_id = auth.uid())
  );

-- Subscriptions: landlord sees their own
create policy "subscriptions_landlord" on public.subscriptions
  for all using (auth.uid() = landlord_id);

-- =====================
-- TRIGGER: auto-create user row on signup
-- =====================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, role, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'landlord'),
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- TRIGGER: auto-create starter subscription for new landlords
create or replace function public.handle_new_landlord()
returns trigger as $$
begin
  if new.role = 'landlord' then
    insert into public.subscriptions (landlord_id, plan, unit_count, status)
    values (new.id, 'starter', 0, 'active');
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_landlord_created
  after insert on public.users
  for each row execute procedure public.handle_new_landlord();
