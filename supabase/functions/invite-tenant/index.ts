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

  const { unitId, email, rentAmount, depositAmount, startDate, endDate } = await req.json();

  // Verify landlord owns this unit
  const { data: unit, error: unitError } = await supabaseAdmin
    .from('units')
    .select('id, properties(landlord_id)')
    .eq('id', unitId)
    .single();

  if (unitError || !unit) return new Response('Unit not found', { status: 404 });

  const property = (unit as any).properties;
  if (property.landlord_id !== user.id) {
    return new Response('Forbidden', { status: 403 });
  }

  // Create invitation row
  const { data: invitation, error: invError } = await supabaseAdmin
    .from('tenant_invitations')
    .insert({
      landlord_id: user.id,
      unit_id: unitId,
      email,
      rent_amount: rentAmount,
      deposit_amount: depositAmount ?? 0,
      start_date: startDate,
      end_date: endDate,
    })
    .select()
    .single();

  if (invError || !invitation) {
    return new Response(JSON.stringify({ error: invError?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Send invite email via Supabase auth
  await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `tendly://invite?token=${invitation.token}`,
  });

  return new Response(
    JSON.stringify({ invitationId: invitation.id, token: invitation.token }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
