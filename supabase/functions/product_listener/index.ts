// @ts-ignore - Deno runtime
import { serve } from 'std/server';
// @ts-ignore - Deno runtime
import { createClient } from 'npm:@supabase/supabase-js';

// @ts-ignore - Deno.env is available at runtime
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
// @ts-ignore - Deno.env is available at runtime
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async (req: Request) => {
  try {
    const body = await req.json();
    const { store_id } = body; // optional: if provided, only process for that store

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Alternative approach: Poll and process the notifications table
    // (More reliable in serverless than LISTEN with persistent connections)
    // This function finds unprocessed notifications and calls triggerNotification for each store

    const { data: notifications, error: queryError } = await supabase
      .from('notifications')
      .select('*')
      .eq('processed', false) // assumes you add a 'processed' boolean column in migration
      .limit(100);

    if (queryError) {
      console.error('query error', queryError);
      return new Response(JSON.stringify({ error: queryError.message }), { status: 500 });
    }

    // Group notifications by store_id and trigger push for each store
    const byStore = new Map();
    (notifications || []).forEach((n: any) => {
      if (!byStore.has(n.store_id)) byStore.set(n.store_id, []);
      byStore.get(n.store_id).push(n);
    });

    const results = [];
    for (const [storeId, notifs] of byStore.entries()) {
      // Call triggerNotification for each store
      const latestNotif = notifs[notifs.length - 1];
      try {
        const triggerResp = await fetch(`${SUPABASE_URL}/functions/v1/triggerNotification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
          },
          body: JSON.stringify({
            store_id: storeId,
            title: latestNotif.title,
            body: latestNotif.body,
            url: latestNotif.meta?.product_id ? `/product/${latestNotif.meta.product_id}` : '/',
            icon: ''
          })
        });
        const triggerResult = await triggerResp.json();
        results.push({ store_id: storeId, trigger_result: triggerResult });
        
        // Mark as processed
        await supabase.from('notifications')
          .update({ processed: true })
          .in('id', notifs.map((n: any) => n.id));
      } catch (e) {
        console.error(`Error triggering for store ${storeId}:`, e);
        results.push({ store_id: storeId, error: (e as Error).message });
      }
    }

    return new Response(JSON.stringify({ results, pending_count: (notifications || []).length }), { status: 200 });
  } catch (err) {
    console.error('product_listener error', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
  }
});

/**
 * ALTERNATIVE: Direct LISTEN approach (requires persistent connection / long timeout)
 * 
 * If you prefer to use Postgres LISTEN directly, use this pattern:
 * 
 * import { createClient } from 'npm:@supabase/supabase-js/dist/main/index.js';
 * const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
 * 
 * // Subscribe to realtime changes (if using Supabase Realtime)
 * const channel = supabase
 *   .channel('product_insert')
 *   .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, payload => {
 *     // Call triggerNotification for each new notification
 *     console.log('New notification:', payload);
 *   })
 *   .subscribe();
 * 
 * However, for Supabase Edge Functions, polling (above) is more reliable than maintaining
 * persistent connections. Consider scheduling this function via:
 * - Supabase Cron extension: runs every N minutes
 * - An external job scheduler (e.g., ci/cd, cron, or a separate worker service)
 */
