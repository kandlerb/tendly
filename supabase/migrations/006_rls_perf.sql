-- Migration 006: RLS performance hardening and policy consolidation
-- Fixes three classes of Supabase lint warnings:
--   1. Mutable search_path in SECURITY DEFINER functions (handle_new_user, handle_new_landlord)
--   2. auth.uid() re-evaluated per-row in RLS policies → wrap with (select auth.uid())
--   3. Multiple permissive policies on same table/action → consolidate into single policies
--
-- NOTE: "Leaked Password Protection" must be enabled manually:
--   Supabase dashboard → Authentication → Settings → Enable HaveIBeenPwned check

-- ================================================================
-- 1. Fix function search paths
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
$$ language plpgsql security definer set search_path = public, auth;

create or replace function public.handle_new_landlord()
returns trigger as $$
begin
  if new.role = 'landlord' then
    insert into public.subscriptions (landlord_id, plan, unit_count, status)
    values (new.id, 'starter', 0, 'active');
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public, auth;

-- ================================================================
-- 2 & 3. Rebuild policies with (select auth.uid()) + consolidation
-- ================================================================

-- USERS ---------------------------------------------------------
drop policy if exists "users_own" on public.users;
create policy "users_own" on public.users
  for all using ((select auth.uid()) = id);

-- PROPERTIES ----------------------------------------------------
drop policy if exists "properties_landlord" on public.properties;
create policy "properties_landlord" on public.properties
  for all using ((select auth.uid()) = landlord_id);

-- VENDORS -------------------------------------------------------
drop policy if exists "vendors_landlord" on public.vendors;
create policy "vendors_landlord" on public.vendors
  for all using ((select auth.uid()) = landlord_id);

-- SUBSCRIPTIONS -------------------------------------------------
drop policy if exists "subscriptions_landlord" on public.subscriptions;
create policy "subscriptions_landlord" on public.subscriptions
  for all using ((select auth.uid()) = landlord_id);

-- TENANT INVITATIONS --------------------------------------------
drop policy if exists "invitations_landlord" on public.tenant_invitations;
create policy "invitations_landlord" on public.tenant_invitations
  for all using ((select auth.uid()) = landlord_id);

-- UNITS ---------------------------------------------------------
-- was: units_landlord (all) + units_tenant (select) → two permissive SELECT policies
drop policy if exists "units_landlord" on public.units;
drop policy if exists "units_tenant" on public.units;

create policy "units_select" on public.units
  for select using (
    property_id in (
      select id from public.properties where landlord_id = (select auth.uid())
    )
    or id in (
      select unit_id from public.leases where tenant_id = (select auth.uid())
    )
  );

create policy "units_landlord_insert" on public.units
  for insert with check (
    property_id in (
      select id from public.properties where landlord_id = (select auth.uid())
    )
  );

create policy "units_landlord_update" on public.units
  for update using (
    property_id in (
      select id from public.properties where landlord_id = (select auth.uid())
    )
  );

create policy "units_landlord_delete" on public.units
  for delete using (
    property_id in (
      select id from public.properties where landlord_id = (select auth.uid())
    )
  );

-- LEASES --------------------------------------------------------
-- was: leases_landlord (all) + leases_tenant (select)
drop policy if exists "leases_landlord" on public.leases;
drop policy if exists "leases_tenant" on public.leases;

create policy "leases_select" on public.leases
  for select using (
    unit_id in (
      select u.id from public.units u
      join public.properties p on u.property_id = p.id
      where p.landlord_id = (select auth.uid())
    )
    or tenant_id = (select auth.uid())
  );

create policy "leases_landlord_insert" on public.leases
  for insert with check (
    unit_id in (
      select u.id from public.units u
      join public.properties p on u.property_id = p.id
      where p.landlord_id = (select auth.uid())
    )
  );

create policy "leases_landlord_update" on public.leases
  for update using (
    unit_id in (
      select u.id from public.units u
      join public.properties p on u.property_id = p.id
      where p.landlord_id = (select auth.uid())
    )
  );

create policy "leases_landlord_delete" on public.leases
  for delete using (
    unit_id in (
      select u.id from public.units u
      join public.properties p on u.property_id = p.id
      where p.landlord_id = (select auth.uid())
    )
  );

-- RENT PAYMENTS -------------------------------------------------
-- was: rent_payments_landlord (all) + rent_payments_tenant (select)
drop policy if exists "rent_payments_landlord" on public.rent_payments;
drop policy if exists "rent_payments_tenant" on public.rent_payments;

create policy "rent_payments_select" on public.rent_payments
  for select using (
    lease_id in (
      select l.id from public.leases l
      join public.units u on l.unit_id = u.id
      join public.properties p on u.property_id = p.id
      where p.landlord_id = (select auth.uid())
    )
    or lease_id in (
      select id from public.leases where tenant_id = (select auth.uid())
    )
  );

create policy "rent_payments_landlord_insert" on public.rent_payments
  for insert with check (
    lease_id in (
      select l.id from public.leases l
      join public.units u on l.unit_id = u.id
      join public.properties p on u.property_id = p.id
      where p.landlord_id = (select auth.uid())
    )
  );

create policy "rent_payments_landlord_update" on public.rent_payments
  for update using (
    lease_id in (
      select l.id from public.leases l
      join public.units u on l.unit_id = u.id
      join public.properties p on u.property_id = p.id
      where p.landlord_id = (select auth.uid())
    )
  );

create policy "rent_payments_landlord_delete" on public.rent_payments
  for delete using (
    lease_id in (
      select l.id from public.leases l
      join public.units u on l.unit_id = u.id
      join public.properties p on u.property_id = p.id
      where p.landlord_id = (select auth.uid())
    )
  );

-- MAINTENANCE REQUESTS ------------------------------------------
-- was: maintenance_landlord (all) + maintenance_tenant (all) → overlapping on every action
drop policy if exists "maintenance_landlord" on public.maintenance_requests;
drop policy if exists "maintenance_tenant" on public.maintenance_requests;

create policy "maintenance_access" on public.maintenance_requests
  for all using (
    unit_id in (
      select u.id from public.units u
      join public.properties p on u.property_id = p.id
      where p.landlord_id = (select auth.uid())
    )
    or tenant_id = (select auth.uid())
  );

-- MESSAGES ------------------------------------------------------
-- was: messages_access (001) + possibly messages_landlord/messages_tenant (created in dashboard)
drop policy if exists "messages_access" on public.messages;
drop policy if exists "messages_landlord" on public.messages;
drop policy if exists "messages_tenant" on public.messages;

create policy "messages_access" on public.messages
  for all using (
    lease_id in (
      select l.id from public.leases l
      join public.units u on l.unit_id = u.id
      join public.properties p on u.property_id = p.id
      where p.landlord_id = (select auth.uid()) or l.tenant_id = (select auth.uid())
    )
  );

-- DOCUMENTS -----------------------------------------------------
-- was: documents_landlord (all) + documents_tenant_read (select) + documents_tenant_insert (insert)
drop policy if exists "documents_landlord" on public.documents;
drop policy if exists "documents_tenant_read" on public.documents;
drop policy if exists "documents_tenant_insert" on public.documents;

create policy "documents_select" on public.documents
  for select using (
    (property_id is not null and property_id in (
      select id from public.properties where landlord_id = (select auth.uid())
    ))
    or (lease_id is not null and lease_id in (
      select l.id from public.leases l
      join public.units u on l.unit_id = u.id
      join public.properties p on u.property_id = p.id
      where p.landlord_id = (select auth.uid())
    ))
    or lease_id in (
      select id from public.leases where tenant_id = (select auth.uid()) and status = 'active'
    )
  );

-- Combined: landlord inserts anything; tenant inserts renters insurance only
create policy "documents_insert" on public.documents
  for insert with check (
    (property_id is not null and property_id in (
      select id from public.properties where landlord_id = (select auth.uid())
    ))
    or (lease_id is not null and lease_id in (
      select l.id from public.leases l
      join public.units u on l.unit_id = u.id
      join public.properties p on u.property_id = p.id
      where p.landlord_id = (select auth.uid())
    ))
    or (
      type = 'renters_insurance'
      and uploaded_by = (select auth.uid())
      and lease_id in (
        select id from public.leases where tenant_id = (select auth.uid()) and status = 'active'
      )
    )
  );

create policy "documents_landlord_update" on public.documents
  for update using (
    (property_id is not null and property_id in (
      select id from public.properties where landlord_id = (select auth.uid())
    ))
    or (lease_id is not null and lease_id in (
      select l.id from public.leases l
      join public.units u on l.unit_id = u.id
      join public.properties p on u.property_id = p.id
      where p.landlord_id = (select auth.uid())
    ))
  );

create policy "documents_landlord_delete" on public.documents
  for delete using (
    (property_id is not null and property_id in (
      select id from public.properties where landlord_id = (select auth.uid())
    ))
    or (lease_id is not null and lease_id in (
      select l.id from public.leases l
      join public.units u on l.unit_id = u.id
      join public.properties p on u.property_id = p.id
      where p.landlord_id = (select auth.uid())
    ))
  );

-- TENANT PROFILES -----------------------------------------------
-- was: tenant_profile_own (all) + tenant_profile_landlord_read (select)
drop policy if exists "tenant_profile_own" on public.tenant_profiles;
drop policy if exists "tenant_profile_landlord_read" on public.tenant_profiles;

create policy "tenant_profile_select" on public.tenant_profiles
  for select using (
    (select auth.uid()) = id
    or id in (
      select l.tenant_id from public.leases l
      join public.units u on l.unit_id = u.id
      join public.properties p on u.property_id = p.id
      where p.landlord_id = (select auth.uid()) and l.status = 'active'
    )
  );

create policy "tenant_profile_own_insert" on public.tenant_profiles
  for insert with check ((select auth.uid()) = id);

create policy "tenant_profile_own_update" on public.tenant_profiles
  for update using ((select auth.uid()) = id);

create policy "tenant_profile_own_delete" on public.tenant_profiles
  for delete using ((select auth.uid()) = id);
