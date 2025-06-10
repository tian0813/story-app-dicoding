// src/public/sw.js
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';
import { clientsClaim, setCacheNameDetails } from 'workbox-core';
import * as navigationPreload from 'workbox-navigation-preload';

setCacheNameDetails({
  prefix: 'dicoding-story-app',
  suffix: 'v1',
  precache: 'precache',
  runtime: 'runtime',
});

navigationPreload.enable();

self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);

registerRoute(
  ({url}) => url.origin === 'https://story-api.dicoding.dev',
  new NetworkFirst({
    cacheName: 'stories-api-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24, 
        maxEntries: 50,
      }),
    ],
  })
);

registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  })
);

registerRoute(
  ({ request }) => request.mode === 'navigate',
  async ({ event }) => {
    try {
      return await new NetworkFirst({
        cacheName: 'pages-cache',
      }).handle({ event });
    } catch (error) {
      console.error('Navigation failed, serving offline page:', error);
      return caches.match('/offline.html');
    }
  }
);

// Push notification event handler
self.addEventListener('push', (event) => {
  let payload = {};

  try {
    payload = event.data?.json() || {
      title: 'New Story Available',
      body: 'Check out the latest stories!',
      url: '/stories' 
    };
  } catch (e) {
    payload = {
      title: 'New Story Available',
      body: event.data?.text() || 'Check out the latest stories!',
      url: '/stories' 
    };
  }

  const options = {
    body: payload.body,
    icon: '/images/icons/icon-192x192.png',
    badge: '/images/icons/icon-192x192.png',
    data: { url: payload.url },
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated. Cleaning old caches.');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheName.startsWith('dicoding-story-app-')) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});