self.addEventListener('push', function(event) {
  let data = {};
  try { data = event.data.json(); } catch (e) { data = { title: 'Toptangram', body: 'Yeni bildirim', tag: 'toptangram' }; }
  const title = data.title || 'Toptangram';
  const options = {
    body: data.body || 'Yeni bir bildirim var',
    icon: data.icon || '/icons/icon-192.png',
    badge: data.badge || '/icons/badge-72.png',
    data: data.meta || {},
    tag: data.tag || ('toptangram-' + Date.now())
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(clients.matchAll({ type: 'window' }).then(windowClients => {
    for (let client of windowClients) {
      if (client.url === url && 'focus' in client) return client.focus();
    }
    if (clients.openWindow) return clients.openWindow(url);
  }));
});
