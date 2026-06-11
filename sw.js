// Gaia Animali & Ambiente – Colonie Basiglio — Service Worker
const CACHE = 'gaia-v1';
const OFFLINE_URL = '/';

// ── INSTALL: metti in cache le risorse base ─────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      cache.addAll([OFFLINE_URL, '/manifest.json', '/icon-192.png'])
    ).then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: pulisci cache vecchie ────────────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── FETCH: serve dalla cache se offline ────────────────────────────────────
self.addEventListener('fetch', e => {
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

// ── PUSH: ricevi notifica dal server ────────────────────────────────────────
self.addEventListener('push', e => {
  let data = {
    title: 'Gaia Colonie Basiglio',
    body: 'Hai un nuovo messaggio',
    icon: '/icon-192.png'
  };
  try { data = { ...data, ...e.data.json() }; } catch {}
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body:     data.body,
      icon:     data.icon || '/icon-192.png',
      badge:    '/icon-192.png',
      tag:      data.tag || 'gaia-notif',
      renotify: true,
      data:     data.url || '/',
      vibrate:  [200, 100, 200],
    })
  );
});

// ── NOTIFICATION CLICK: apri l'app ─────────────────────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(wins => {
      const url = e.notification.data || '/';
      const existing = wins.find(w => w.url.includes(location.origin));
      if (existing) { existing.focus(); existing.navigate(url); }
      else clients.openWindow(url);
    })
  );
});

// ── BACKGROUND SYNC ────────────────────────────────────────────────────────
self.addEventListener('sync', e => {
  if (e.tag === 'sync-data') {
    console.log('[SW] Background sync triggered');
  }
});
