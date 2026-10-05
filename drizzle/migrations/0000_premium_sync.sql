CREATE TABLE public.subscriptions (
  user_id uuid PRIMARY KEY,
  tier text NOT NULL DEFAULT 'free',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own subscription" ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.is_paid_user(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.subscriptions WHERE user_id = _uid AND tier IN ('pro','pro_yearly','lifetime','premium'))
$$;

CREATE TABLE public.bubble_backups (
  user_id uuid PRIMARY KEY,
  bookmarks jsonb NOT NULL DEFAULT '[]'::jsonb,
  theme text NOT NULL DEFAULT 'navy',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bubble_backups TO authenticated;
GRANT ALL ON public.bubble_backups TO service_role;
ALTER TABLE public.bubble_backups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Paid users read own backup" ON public.bubble_backups FOR SELECT TO authenticated USING (auth.uid() = user_id AND public.is_paid_user(auth.uid()));
CREATE POLICY "Paid users insert own backup" ON public.bubble_backups FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND public.is_paid_user(auth.uid()));
CREATE POLICY "Paid users update own backup" ON public.bubble_backups FOR UPDATE TO authenticated USING (auth.uid() = user_id AND public.is_paid_user(auth.uid())) WITH CHECK (auth.uid() = user_id AND public.is_paid_user(auth.uid()));
CREATE POLICY "Users delete own backup" ON public.bubble_backups FOR DELETE TO authenticated USING (auth.uid() = user_id);