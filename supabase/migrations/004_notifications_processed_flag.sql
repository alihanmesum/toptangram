-- 004_notifications_processed_flag.sql
-- Add a 'processed' flag to track which notifications have been sent via push

ALTER TABLE IF EXISTS public.notifications
  ADD COLUMN IF NOT EXISTS processed boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_notifications_processed ON public.notifications (processed)
  WHERE processed = false;
