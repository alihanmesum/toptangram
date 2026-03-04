-- 002_product_trigger_notify.sql
-- Create trigger function to persist notification and notify listeners when a product row is inserted.

-- Ensure notifications table exists (migration 001 already creates it)

-- Create trigger function
CREATE OR REPLACE FUNCTION public.notify_on_product_insert()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  payload JSON;
  edge_url TEXT := 'https://ncebtxitvbbekbehesxy.functions.supabase.co/triggerNotification';
BEGIN
  -- Build payload for notifications table
  INSERT INTO public.notifications (store_id, title, body, meta, created_at)
  VALUES (NEW.store_id, NEW.name, COALESCE(NEW.description, ''), jsonb_build_object('product_id', NEW.id), NOW());

  -- Notify local listeners (useful for realtime listeners or external listeners)
  payload := json_build_object('store_id', NEW.store_id, 'product_id', NEW.id, 'title', NEW.name, 'body', COALESCE(NEW.description,''));
  PERFORM pg_notify('product_insert', payload::text);

  -- Optional: If the pg_net extension (or similar) is installed, attempt to call the Edge Function directly from the DB.
  -- NOTE: This will run only when the pg_net.http_post function exists. If you prefer DB to call the Edge Function,
  -- install the pg_net extension in your DB and ensure outbound HTTP is allowed.
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'http_post') THEN
    BEGIN
      -- Attempt to POST to the Edge Function. Replace the Authorization header value with your service role key if needed.
      PERFORM pg_net.http_post(edge_url,
        json_build_object('store_id', NEW.store_id, 'title', NEW.name, 'body', COALESCE(NEW.description,''), 'url', '/')::text,
        json_build_object('headers', json_build_object('Content-Type','application/json', 'Authorization','Bearer <SERVICE_ROLE_KEY>'))::json);
    EXCEPTION WHEN others THEN
      -- If the http call fails, don't abort the transaction; log to NOTICE for visibility
      RAISE NOTICE 'Edge function call failed: %', SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on products table
DROP TRIGGER IF EXISTS trg_notify_on_product_insert ON public.products;
CREATE TRIGGER trg_notify_on_product_insert
AFTER INSERT ON public.products
FOR EACH ROW EXECUTE FUNCTION public.notify_on_product_insert();

-- Notes:
-- 1) If you want the DB to call the Edge Function directly, install the pg_net extension and replace <SERVICE_ROLE_KEY>
--    with your SUPABASE_SERVICE_ROLE_KEY. Keep in mind storing secrets in triggers is sensitive; prefer using a secure
--    vault or let an external listener (Edge Function) consume pg_notify events.
-- 2) The trigger always inserts into the notifications table and emits a NOTIFY which can be consumed by a listener.
