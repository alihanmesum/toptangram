// @ts-ignore - Deno runtime
import { serve } from 'std/server';
// @ts-ignore - Deno runtime
import { createClient } from 'npm:@supabase/supabase-js';
// @ts-ignore - Deno runtime
import webpush from 'npm:web-push';

// @ts-ignore - Deno.env is available at runtime
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
// @ts-ignore - Deno.env is available at runtime
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
// @ts-ignore - Deno.env is available at runtime
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') || '';
// @ts-ignore - Deno.env is available at runtime
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') || '';

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) console.warn('VAPID keys missing in env');
webpush.setVapidDetails('mailto:admin@toptangram.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

serve(async (req: Request) => {
  try {
    const body = await req.json();
    const { store_id, title, body: msgBody, url, icon } = body;
    if (!store_id || !title) return new Response(JSON.stringify({ error: 'store_id and title required' }), { status: 400 });

    // fetch followers with push_subscription
    const { data: subs, error } = await supabase.from('follows').select('id, follower_id, following_store_id, push_subscription').eq('following_store_id', store_id).not('push_subscription', 'is', null);
    if (error) {
      console.error('fetch subs error', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    const payload = JSON.stringify({ title, body: msgBody, icon, meta: { url } });
    const results = [];

    for (const s of subs || []) {
      try {
        const subscription = s.push_subscription;
        await webpush.sendNotification(subscription, payload);
        results.push({ id: s.id, status: 'ok' });
      } catch (e) {
        console.error('push send error', e);
        results.push({ id: s.id, status: 'error', error: (e as Error).message });
      }
    }

    // Optionally insert into notifications table
    try {
      await supabase.from('notifications').insert(subs?.map((s: any)=>({ user_id: s.follower_id, store_id: s.following_store_id, title, body: msgBody, created_at: new Date().toISOString() })) || []);
    } catch (e) { console.warn('notifications insert skipped', e); }

    return new Response(JSON.stringify({ results }), { status: 200 });
  } catch (err) {
    console.error('triggerNotification error', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
  }
});
