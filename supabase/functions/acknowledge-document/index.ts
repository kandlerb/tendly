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

  const { documentId } = await req.json();

  // Verify document belongs to caller's active lease
  const { data: doc, error: docError } = await supabaseAdmin
    .from('documents')
    .select('id, lease_id')
    .eq('id', documentId)
    .single();

  if (docError || !doc) {
    return new Response(JSON.stringify({ error: 'Document not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check caller has an active lease matching the document's lease_id
  const { data: lease, error: leaseError } = await supabaseAdmin
    .from('leases')
    .select('id')
    .eq('id', doc.lease_id)
    .eq('tenant_id', user.id)
    .eq('status', 'active')
    .single();

  if (leaseError || !lease) {
    return new Response(JSON.stringify({ error: 'Access denied' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const acknowledgedAt = new Date().toISOString();

  await supabaseAdmin
    .from('documents')
    .update({ signed_by_tenant_at: acknowledgedAt })
    .eq('id', documentId);

  return new Response(
    JSON.stringify({ acknowledgedAt }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
