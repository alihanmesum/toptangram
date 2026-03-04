// Centralized push helpers
const FUNCTIONS_BASE = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL || 'https://ncebtxitvbbekbehesxy.functions.supabase.co';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = typeof window !== 'undefined' ? window.atob(base64) : Buffer.from(base64, 'base64').toString('binary');
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export async function registerAndSubscribe(userId = null, storeId = null) {
  if (typeof window === 'undefined') return null;
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push not supported'); return null;
  }
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return null;

    let vapidPublicKey = null;
    try {
      const resp = await fetch(`${FUNCTIONS_BASE}/vapid`);
      const j = await resp.json(); vapidPublicKey = j.publicKey;
    } catch (e) {
      console.warn('Could not fetch VAPID key', e);
    }
    const subscribeOptions = vapidPublicKey ? { userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) } : { userVisibleOnly: true };
    const subscription = await reg.pushManager.subscribe(subscribeOptions);

    try {
      await fetch(`${FUNCTIONS_BASE}/subscribe`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription, user_id: userId, store_id: storeId })
      });
    } catch (e) { console.warn('subscribe post failed', e); }

    return subscription;
  } catch (err) { console.error('register/subscribe error', err); return null; }
}

export default { registerAndSubscribe };
