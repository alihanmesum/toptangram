// @ts-ignore - Deno runtime
import { serve } from 'std/server';

serve(async () => {
  // @ts-ignore - Deno.env is available at runtime
const publicKey = Deno.env.get('VAPID_PUBLIC_KEY') || '';
  return new Response(JSON.stringify({ publicKey }), { headers: { 'content-type': 'application/json' } });
});
