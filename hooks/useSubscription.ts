import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Subscription } from '../types';

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('subscriptions')
      .select('*')
      .single()
      .then(({ data }) => {
        setSubscription(data as Subscription);
        setLoading(false);
      });
  }, []);

  const isPaid = subscription?.plan !== 'starter' && subscription?.status === 'active';
  const unitCount = subscription?.unit_count ?? 0;
  const atFreeLimit = !isPaid && unitCount >= 2;

  return { subscription, loading, isPaid, unitCount, atFreeLimit };
}
