import Stripe from 'npm:stripe';
import { createClient } from 'npm:@supabase/supabase-js';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', { apiVersion: '2024-11-20.acacia' });
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

Deno.serve(async (req) => {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') ?? '';
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return new Response('Invalid signature', { status: 400 });
  }

  const sub = event.data.object as Stripe.Subscription;

  if (['customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted'].includes(event.type)) {
    const customerId = sub.customer as string;
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (user) {
      const priceId = sub.items.data[0]?.price.id;
      const plan = priceId?.includes('annual') ? 'annual' : priceId?.includes('standard') ? 'standard' : 'starter';

      await supabase.from('subscriptions').upsert({
        landlord_id: user.id,
        stripe_subscription_id: sub.id,
        plan,
        status: sub.status === 'active' ? 'active' : sub.status === 'past_due' ? 'past_due' : 'canceled',
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      }, { onConflict: 'landlord_id' });
    }
  }

  return new Response('ok');
});
