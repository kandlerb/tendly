-- Migration 009: Fix circular RLS dependency between units and leases
--
-- Root cause (exists since migration 001, exposed when dashboard screen
-- began mounting and fetching data):
--
--   units_tenant  → queries leases (where tenant_id = auth.uid())
--   leases_landlord → queries units (via join to properties)
--   → PostgreSQL raises "infinite recursion detected in policy for relation units"
--   → PostgREST returns HTTP 500
--
-- Fix: replace the direct leases subquery in units_tenant with a
-- SECURITY DEFINER function that runs as the function owner, bypassing
-- leases RLS and breaking the cycle.
--
-- Security: the function still filters by auth.uid(), so a user can only
-- discover unit IDs for leases where they are the named tenant.

-- 1. Create the helper function
create or replace function public.get_tenant_unit_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
  select unit_id from public.leases where tenant_id = auth.uid()
$$;

grant execute on function public.get_tenant_unit_ids() to authenticated;

-- 2. Replace units_tenant with the recursion-safe version
drop policy if exists "units_tenant" on public.units;

create policy "units_tenant" on public.units
  for select using (
    id in (select public.get_tenant_unit_ids())
  );
