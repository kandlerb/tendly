-- Migration 007: Fix circular RLS dependency introduced in 006
--
-- Root cause: consolidating units + leases into single policies created a
-- circular dependency that PostgreSQL cannot resolve:
--
--   units_select → subquery on leases → leases_select → subquery on units → ∞
--
-- The original SEPARATE policies worked because PostgreSQL handles
-- cross-policy recursion differently than within-policy recursion.
-- leases_tenant (tenant_id = auth.uid()) was a non-recursive escape that
-- broke the cycle. Merging it into leases_select eliminated that escape.
--
-- Fix: restore units and leases to two-policy structure.
-- (select auth.uid()) performance optimisation is preserved.
-- All other changes from migration 006 are left intact.

-- UNITS ---------------------------------------------------------
drop policy if exists "units_select"           on public.units;
drop policy if exists "units_landlord_insert"  on public.units;
drop policy if exists "units_landlord_update"  on public.units;
drop policy if exists "units_landlord_delete"  on public.units;

-- Landlord: full access to units on their properties (queries properties only — no circular dep)
create policy "units_landlord" on public.units
  for all using (
    property_id in (
      select id from public.properties where landlord_id = (select auth.uid())
    )
  );

-- Tenant: read the unit they have an active lease for (queries leases — circular dep with
-- leases_landlord is handled by PostgreSQL via the non-recursive leases_tenant base case)
create policy "units_tenant" on public.units
  for select using (
    id in (
      select unit_id from public.leases where tenant_id = (select auth.uid())
    )
  );

-- LEASES --------------------------------------------------------
drop policy if exists "leases_select"           on public.leases;
drop policy if exists "leases_landlord_insert"  on public.leases;
drop policy if exists "leases_landlord_update"  on public.leases;
drop policy if exists "leases_landlord_delete"  on public.leases;

-- Landlord: full access to leases on their units (queries units + properties)
create policy "leases_landlord" on public.leases
  for all using (
    unit_id in (
      select u.id from public.units u
      join public.properties p on u.property_id = p.id
      where p.landlord_id = (select auth.uid())
    )
  );

-- Tenant: read-only access to their own leases (no subquery — this is the non-recursive
-- base case that prevents the units ↔ leases circular dep from looping infinitely)
create policy "leases_tenant" on public.leases
  for select using (
    tenant_id = (select auth.uid())
  );
