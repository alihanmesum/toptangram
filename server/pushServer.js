const express = require('express');
const bodyParser = require('body-parser');
const webpush = require('web-push');
const fs = require('fs');
const path = require('path');

// Simple file-backed storage for demo (replace with DB in production)
const SUBS_FILE = path.join(__dirname, 'subs.json');
function loadSubs(){ try { return JSON.parse(fs.readFileSync(SUBS_FILE)); } catch(e){ return []; } }
function saveSubs(s){ fs.writeFileSync(SUBS_FILE, JSON.stringify(s, null, 2)); }

// VAPID keys: generate once and persist
const VAPID_FILE = path.join(__dirname, 'vapid.json');
let vapidKeys;
if (fs.existsSync(VAPID_FILE)) {
  vapidKeys = JSON.parse(fs.readFileSync(VAPID_FILE));
} else {
  vapidKeys = webpush.generateVAPIDKeys();
  fs.writeFileSync(VAPID_FILE, JSON.stringify(vapidKeys, null, 2));
  console.log('Generated VAPID keys and saved to', VAPID_FILE);
}

webpush.setVapidDetails(
  'mailto:admin@toptangram.local',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

const app = express();
app.use(bodyParser.json());

// Allow CORS for testing
app.use((req, res, next)=>{
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  next();
});

// Save subscription (called from client when user subscribes)
app.post('/subscribe', (req, res) => {
  const { subscription, storeId, userId } = req.body;
  if (!subscription) return res.status(400).json({ error: 'subscription required' });
  const subs = loadSubs();
  subs.push({ id: Date.now(), subscription, storeId: storeId||null, userId: userId||null });
  saveSubs(subs);
  res.json({ ok:true });
});

// expose VAPID public key for clients (optional)
app.get('/vapid', (req, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

// List subscriptions (admin/debug)
app.get('/subs', (req, res) => {
  res.json(loadSubs());
});

// Trigger push for a store (call when a store publishes a product)
app.post('/trigger', async (req, res) => {
  const { storeId, title, body, url, icon } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  const subs = loadSubs().filter(s => !storeId || s.storeId === storeId);
  const payload = JSON.stringify({ title, body, icon, meta: { url } });
  const results = [];
  for (const s of subs) {
    try {
      await webpush.sendNotification(s.subscription, payload);
      results.push({ id: s.id, status: 'ok' });
    } catch (err) {
      console.error('send error', err);
      results.push({ id: s.id, status: 'error', error: err.message });
    }
  }
  res.json({ results });
});

const port = process.env.PORT || 4000;
app.listen(port, ()=>console.log('Push server running on port', port, 'VAPID publicKey:', vapidKeys.publicKey));
