import { createClient } from 'npm:@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'No authorization header' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Verify JWT using user-scoped client (avoids service role key conflict)
  const supabaseUser = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user }, error: authError } = await supabaseUser.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ error: authError?.message ?? 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { unitId, email, rentAmount, depositAmount, startDate, endDate } = await req.json();

  // Verify landlord owns this unit
  const { data: unit, error: unitError } = await supabaseAdmin
    .from('units')
    .select('id, properties(landlord_id)')
    .eq('id', unitId)
    .single();

  if (unitError || !unit) {
    return new Response(JSON.stringify({ error: 'Unit not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const property = (unit as any).properties;
  if (property.landlord_id !== user.id) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
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
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Send invite email via Supabase auth
  const { error: emailError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `tendly://invite?token=${invitation.token}`,
  });

  if (emailError) {
    // Invitation row created but email failed — return error with token so caller knows
    return new Response(
      JSON.stringify({ error: `Invitation created but email failed: ${emailError.message}`, token: invitation.token }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ invitationId: invitation.id, token: invitation.token }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
