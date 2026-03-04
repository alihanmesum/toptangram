// @ts-ignore - Deno runtime
import { serve } from 'std/server';
// @ts-ignore - Deno runtime
import { createClient } from 'npm:@supabase/supabase-js';

// @ts-ignore - Deno.env is available at runtime
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
// @ts-ignore - Deno.env is available at runtime
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

serve(async (req) => {
  try {
    const body = await req.json();
    const { subscription, user_id, store_id } = body;
    if (!subscription) return new Response(JSON.stringify({ error: 'subscription required' }), { status: 400 });

    // Persist to follows table securely using service role key
    const payload = {
      follower_id: user_id || null,
      following_store_id: store_id || null,
      push_subscription: subscription,
      created_at: new Date().toISOString()
    };

    const { error } = await supabase.from('follows').insert([payload]);
    if (error) {
      console.error('supabase insert error', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error('subscribe function error', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
  }
});
