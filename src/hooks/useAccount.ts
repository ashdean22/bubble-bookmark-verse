import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export const PAID_TIERS = ['pro', 'pro_yearly', 'lifetime', 'premium'];

/** Signed-in user plus their plan, read from the server (never from local storage). */
export const useAccount = () => {
  const [user, setUser] = useState<User | null>(null);
  const [tier, setTier] = useState<string>('free');

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) { setTier('free'); return; }
    let cancelled = false;
    supabase.from('subscriptions').select('tier').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => { if (!cancelled) setTier(data?.tier ?? 'free'); });
    return () => { cancelled = true; };
  }, [user]);

  return { user, tier, isPaid: PAID_TIERS.includes(tier) };
};
