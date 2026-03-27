const CACHE = 'kumar-health-v2';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});

// Handle reminder scheduling from the app
const scheduledTimers = [];

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SCHEDULE_REMINDERS') {
    // Clear existing timers
    scheduledTimers.forEach(t => clearTimeout(t));
    scheduledTimers.length = 0;

    const reminders = e.data.reminders || [];
    const now = new Date();

    reminders.forEach(r => {
      const [h, m] = r.time.split(':').map(Number);
      const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
      if (target > now) {
        const delay = target - now;
        const timer = setTimeout(() => {
          self.registration.showNotification("💊 Kumar's Medicine Reminder", {
            body: `Time to take ${r.name}${r.note ? ' · ' + r.note : ''}`,
            icon: './icon-192.png',
            badge: './icon-192.png',
            vibrate: [200, 100, 200],
            tag: 'med-' + r.name,
            requireInteraction: true
          });
        }, delay);
        scheduledTimers.push(timer);
      }
    });
  }
});
