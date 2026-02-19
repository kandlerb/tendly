-- Expand document type enum
alter table public.documents drop constraint documents_type_check;
alter table public.documents add constraint documents_type_check check (
  type in (
    'lease', 'lease_addendum', 'move_in_checklist', 'move_out_checklist',
    'renters_insurance', 'notice', 'receipt', 'photo', 'other'
  )
);

-- Add new columns
alter table public.documents
  add column lease_id uuid references public.leases(id) on delete set null,
  add column uploaded_by uuid references public.users(id),
  add column signed_by_tenant_at timestamptz,
  add column signed_by_landlord_at timestamptz;

-- Allow property_id nullable (lease-only documents don't need property_id)
alter table public.documents alter column property_id drop not null;

-- Rebuild RLS
drop policy "documents_landlord" on public.documents;

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

-- Tenants can upload their own renters insurance
create policy "documents_tenant_insert" on public.documents
  for insert with check (
    type = 'renters_insurance'
    and uploaded_by = auth.uid()
    and lease_id in (
      select id from public.leases where tenant_id = auth.uid() and status = 'active'
    )
  );
