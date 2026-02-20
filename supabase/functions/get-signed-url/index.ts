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

  // Verify JWT using user-scoped client (also used for RLS-enforced document fetch)
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

  const { documentId } = await req.json();

  // Fetch document using the caller's auth context (RLS enforces access)
  const { data: doc, error: docError } = await supabaseUser
    .from('documents')
    .select('storage_url')
    .eq('id', documentId)
    .single();

  if (docError || !doc) {
    return new Response(JSON.stringify({ error: 'Document not found or access denied' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Generate 1-hour signed URL using service role
  const expiresIn = 3600;
  const { data: signed, error: signError } = await supabaseAdmin.storage
    .from('documents')
    .createSignedUrl(doc.storage_url, expiresIn);

  if (signError || !signed) {
    return new Response(JSON.stringify({ error: signError?.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  return new Response(
    JSON.stringify({ signedUrl: signed.signedUrl, expiresAt }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
