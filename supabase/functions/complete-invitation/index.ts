import { createClient } from 'npm:@supabase/supabase-js';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return new Response('Unauthorized', { status: 401 });

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
    authHeader.replace('Bearer ', '')
  );
  if (authError || !user) return new Response('Unauthorized', { status: 401 });

  const { token } = await req.json();

  // Look up invitation by token
  const { data: invitation, error: invError } = await supabaseAdmin
    .from('tenant_invitations')
    .select('*, unit:units(*, property:properties(*))')
    .eq('token', token)
    .single();

  if (invError || !invitation) {
    return new Response(JSON.stringify({ error: 'Invitation not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Verify not expired
  if (invitation.status !== 'pending' || new Date(invitation.expires_at) < new Date()) {
    return new Response(JSON.stringify({ error: 'Invitation expired or already used' }), {
      status: 410,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Verify caller's email matches
  if (user.email !== invitation.email) {
    return new Response(JSON.stringify({ error: 'Email mismatch' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Create lease
  const { data: lease, error: leaseError } = await supabaseAdmin
    .from('leases')
    .insert({
      unit_id: invitation.unit_id,
      tenant_id: user.id,
      start_date: invitation.start_date,
      end_date: invitation.end_date,
      rent_amount: invitation.rent_amount,
      deposit_amount: invitation.deposit_amount,
      status: 'active',
    })
    .select()
    .single();

  if (leaseError || !lease) {
    return new Response(JSON.stringify({ error: leaseError?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Create first rent payment row
  await supabaseAdmin.from('rent_payments').insert({
    lease_id: lease.id,
    amount: invitation.rent_amount,
    due_date: invitation.start_date,
    status: 'pending',
  });

  // Create tenant profile
  await supabaseAdmin.from('tenant_profiles').upsert({
    id: user.id,
    updated_at: new Date().toISOString(),
  });

  // Mark invitation accepted
  await supabaseAdmin
    .from('tenant_invitations')
    .update({ status: 'accepted' })
    .eq('id', invitation.id);

  return new Response(
    JSON.stringify({ lease, unit: invitation.unit, property: invitation.unit?.property }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
