-- Add JSON column to store push subscription in follows table
ALTER TABLE IF EXISTS follows
  ADD COLUMN IF NOT EXISTS push_subscription jsonb;

-- Optional: keep when the follow was created
ALTER TABLE IF EXISTS follows
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Create notifications table to persist notification history
CREATE TABLE IF NOT EXISTS notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  store_id uuid,
  title text,
  body text,
  meta jsonb,
  created_at timestamptz DEFAULT now()
);

-- Index to quickly find followers of a store
CREATE INDEX IF NOT EXISTS idx_follows_store ON follows (following_store_id);
CREATE INDEX IF NOT EXISTS idx_follows_push ON follows USING gin (push_subscription);
