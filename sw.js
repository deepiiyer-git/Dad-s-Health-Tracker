const CACHE = 'kumar-health-v3';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => clients.claim())
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).catch(() => caches.match('./index.html'))));
});

const timers = {};

self.addEventListener('message', e => {
  if (!e.data) return;

  if (e.data.type === 'NOTIFY_IN') {
    const { delay, title, body, tag } = e.data;
    if (timers[tag]) clearTimeout(timers[tag]);
    timers[tag] = setTimeout(() => {
      self.registration.showNotification(title, {
        body,
        icon: './icon-192.png',
        badge: './icon-192.png',
        vibrate: [300, 100, 300, 100, 300],
        requireInteraction: true,
        tag,
        actions: [{ action: 'done', title: 'Taken ✓' }]
      });
    }, delay);
  }

  if (e.data.type === 'SCHEDULE_REMINDERS') {
    const reminders = e.data.reminders || [];
    const now = Date.now();
    reminders.forEach(r => {
      const [h, m] = r.time.split(':').map(Number);
      const d = new Date();
      d.setHours(h, m, 0, 0);
      if (d.getTime() <= now) d.setDate(d.getDate() + 1);
      const delay = d.getTime() - now;
      const tag = 'med-' + r.name;
      if (timers[tag]) clearTimeout(timers[tag]);
      timers[tag] = setTimeout(() => {
        self.registration.showNotification("💊 Medicine Time — Kumar's Health", {
          body: `Time to take ${r.name}${r.note ? ' · ' + r.note : ''}`,
          icon: './icon-192.png',
          badge: './icon-192.png',
          vibrate: [300, 100, 300, 100, 300],
          requireInteraction: true,
          tag
        });
      }, delay);
    });
  }
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'done') return;
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      if (list.length > 0) return list[0].focus();
      return clients.openWindow('./');
    })
  );
});
