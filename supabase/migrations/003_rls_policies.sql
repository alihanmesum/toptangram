-- 003_rls_policies.sql
-- Row-Level Security policies for `follows` and `notifications`.
-- Adjust these policies to match your `users`/`stores` schema; these are conservative defaults.

-- 1) FOLLOWS
ALTER TABLE IF EXISTS public.follows ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to INSERT a follow where they are the follower (client-side follows)
CREATE POLICY IF NOT EXISTS "follows_insert_owner_only" ON public.follows
  FOR INSERT USING (auth.uid() IS NOT NULL) WITH CHECK (follower_id::text = auth.uid());

-- Allow followers to SELECT their follow rows
CREATE POLICY IF NOT EXISTS "follows_select_owner_only" ON public.follows
  FOR SELECT USING (follower_id::text = auth.uid());

-- Allow followers to DELETE their follow rows
CREATE POLICY IF NOT EXISTS "follows_delete_owner_only" ON public.follows
  FOR DELETE USING (follower_id::text = auth.uid());

-- Note: Server-side processes (Edge Functions / service role key) bypass RLS and can insert/update push_subscription.
-- If you need store owners to read their followers, add a policy that allows SELECT where the requesting user owns the store.
-- Example (requires a stores table with owner column):
-- CREATE POLICY "follows_select_store_owner" ON public.follows FOR SELECT USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = following_store_id AND s.owner = auth.uid()));


-- 2) NOTIFICATIONS
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;

-- Allow users to SELECT their own notifications
CREATE POLICY IF NOT EXISTS "notifications_select_own" ON public.notifications
  FOR SELECT USING (user_id::text = auth.uid());

-- Allow users to INSERT notifications only for themselves (edge cases); normally notifications are inserted by server
CREATE POLICY IF NOT EXISTS "notifications_insert_self" ON public.notifications
  FOR INSERT USING (auth.uid() IS NOT NULL) WITH CHECK (user_id::text = auth.uid());

-- Allow users to DELETE their notifications
CREATE POLICY IF NOT EXISTS "notifications_delete_own" ON public.notifications
  FOR DELETE USING (user_id::text = auth.uid());

-- Note: Edge Functions called with the service role key bypass RLS and may insert notifications for any user.
-- Review these policies to ensure they match your app's auth model.
