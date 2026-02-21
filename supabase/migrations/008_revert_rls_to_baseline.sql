-- Migration 008: Full revert of RLS changes from migrations 006 and 007
--
-- Migrations 006 and 007 caused persistent HTTP 500 errors on:
--   properties?select=*,units(*)
--   maintenance_requests with complex joins
--
-- The safest fix is a complete rollback to the baseline policies from
-- migrations 001-005, which are known to work. Both the (select auth.uid())
-- wrapper and the policy consolidation from 006 are fully reversed.
--
-- Also reverts handle_new_user / handle_new_landlord to remove SET search_path.

-- ================================================================
-- 1. Drop all policies created or replaced by migrations 006 & 007
-- ================================================================

-- users
drop policy if exists "users_own" on public.users;

-- properties
drop policy if exists "properties_landlord" on public.properties;

-- units (006 versions, 007 replacements, and any stragglers)
drop policy if exists "units_select"           on public.units;
drop policy if exists "units_landlord_insert"  on public.units;
drop policy if exists "units_landlord_update"  on public.units;
drop policy if exists "units_landlord_delete"  on public.units;
drop policy if exists "units_landlord"         on public.units;
drop policy if exists "units_tenant"           on public.units;

-- vendors
drop policy if exists "vendors_landlord" on public.vendors;

-- subscriptions
drop policy if exists "subscriptions_landlord" on public.subscriptions;

-- tenant invitations
drop policy if exists "invitations_landlord" on public.tenant_invitations;

-- leases (006 versions, 007 replacements)
drop policy if exists "leases_select"           on public.leases;
drop policy if exists "leases_landlord_insert"  on public.leases;
drop policy if exists "leases_landlord_update"  on public.leases;
drop policy if exists "leases_landlord_delete"  on public.leases;
drop policy if exists "leases_landlord"         on public.leases;
drop policy if exists "leases_tenant"           on public.leases;

-- rent payments
drop policy if exists "rent_payments_select"           on public.rent_payments;
drop policy if exists "rent_payments_landlord_insert"  on public.rent_payments;
drop policy if exists "rent_payments_landlord_update"  on public.rent_payments;
drop policy if exists "rent_payments_landlord_delete"  on public.rent_payments;
drop policy if exists "rent_payments_landlord"         on public.rent_payments;
drop policy if exists "rent_payments_tenant"           on public.rent_payments;

-- maintenance requests
drop policy if exists "maintenance_access"   on public.maintenance_requests;
drop policy if exists "maintenance_landlord" on public.maintenance_requests;
drop policy if exists "maintenance_tenant"   on public.maintenance_requests;

-- messages
drop policy if exists "messages_access"   on public.messages;
drop policy if exists "messages_landlord" on public.messages;
drop policy if exists "messages_tenant"   on public.messages;

-- documents
drop policy if exists "documents_select"          on public.documents;
drop policy if exists "documents_insert"          on public.documents;
drop policy if exists "documents_landlord_update" on public.documents;
drop policy if exists "documents_landlord_delete" on public.documents;
drop policy if exists "documents_landlord"        on public.documents;
drop policy if exists "documents_tenant_read"     on public.documents;
drop policy if exists "documents_tenant_insert"   on public.documents;

-- tenant profiles
drop policy if exists "tenant_profile_select"     on public.tenant_profiles;
drop policy if exists "tenant_profile_own_insert" on public.tenant_profiles;
drop policy if exists "tenant_profile_own_update" on public.tenant_profiles;
drop policy if exists "tenant_profile_own_delete" on public.tenant_profiles;
drop policy if exists "tenant_profile_own"               on public.tenant_profiles;
drop policy if exists "tenant_profile_landlord_read"     on public.tenant_profiles;

-- ================================================================
-- 2. Restore baseline policies (001-005, plain auth.uid())
-- ================================================================

-- USERS
create policy "users_own" on public.users
  for all using (auth.uid() = id);

-- PROPERTIES
create policy "properties_landlord" on public.properties
  for all using (auth.uid() = landlord_id);

-- UNITS
create policy "units_landlord" on public.units
  for all using (
    property_id in (select id from public.properties where landlord_id = auth.uid())
  );

create policy "units_tenant" on public.units
  for select using (
    id in (select unit_id from public.leases where tenant_id = auth.uid())
  );

-- VENDORS
create policy "vendors_landlord" on public.vendors
  for all using (auth.uid() = landlord_id);

-- SUBSCRIPTIONS
create policy "subscriptions_landlord" on public.subscriptions
  for all using (auth.uid() = landlord_id);

-- TENANT INVITATIONS
create policy "invitations_landlord" on public.tenant_invitations
  for all using (auth.uid() = landlord_id);

-- LEASES
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

-- RENT PAYMENTS
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

-- MAINTENANCE REQUESTS
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

-- MESSAGES
create policy "messages_access" on public.messages
  for all using (
    lease_id in (
      select l.id from public.leases l
      join public.units u on l.unit_id = u.id
      join public.properties p on u.property_id = p.id
      where p.landlord_id = auth.uid() or l.tenant_id = auth.uid()
    )
  );

-- DOCUMENTS (004 version: property_id nullable, lease_id supported, tenant policies)
create policy "documents_landlord" on public.documents
  for all using (
    (property_id is not null and property_id in (
      select id from public.properties where landlord_id = auth.uid()
    ))
    or
    (lease_id is not null and lease_id in (
      select l.id from public.leases l
      join public.units u on l.unit_id = u.id
      join public.properties p on u.property_id = p.id
      where p.landlord_id = auth.uid()
    ))
  );

create policy "documents_tenant_read" on public.documents
  for select using (
    lease_id in (
      select id from public.leases where tenant_id = auth.uid() and status = 'active'
    )
  );

create policy "documents_tenant_insert" on public.documents
  for insert with check (
    type = 'renters_insurance'
    and uploaded_by = auth.uid()
    and lease_id in (
      select id from public.leases where tenant_id = auth.uid() and status = 'active'
    )
  );

-- TENANT PROFILES (003 version)
create policy "tenant_profile_own" on public.tenant_profiles
  for all using (auth.uid() = id);

create policy "tenant_profile_landlord_read" on public.tenant_profiles
  for select using (
    id in (
      select l.tenant_id from public.leases l
      join public.units u on l.unit_id = u.id
      join public.properties p on u.property_id = p.id
      where p.landlord_id = auth.uid() and l.status = 'active'
    )
  );

-- ================================================================
-- 3. Restore baseline trigger functions (no SET search_path)
-- ================================================================

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
