/*
 * Service worker for the installable app. Navigations are network-first so a
 * new deploy is picked up immediately and the app still opens offline from the
 * cached shell; hashed build assets are cache-first because their URLs change
 * on every build. Kept as plain JS so it is served as-is, not bundled.
 */
const CACHE = 'cua-evaluation-v3';
const APP_SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icons/icon-192.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE);

  try {
    const response = await fetch(request);

    if (response.ok) {
      await cache.put('/index.html', response.clone());
    }

    return response;
  } catch {
    const cached = (await cache.match('/index.html')) ?? (await cache.match('/'));

    return cached ?? Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);

  if (cached !== undefined) {
    return cached;
  }

  const response = await fetch(request);

  if (response.ok) {
    await cache.put(request, response.clone());
  }

  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(request.mode === 'navigate' ? networkFirst(request) : cacheFirst(request));
});
