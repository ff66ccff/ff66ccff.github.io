const CACHE_NAME = 'static-cache-v-auto-1';
const PRECACHE = `${CACHE_NAME}-precache`;
const RUNTIME = `${CACHE_NAME}-runtime`;

const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/blog.html',
    '/scripts/blog-inline.js',
    '/posts/metadata.json',
    '/posts/search-index.json'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(PRECACHE)
            .then((cache) => Promise.all(
                PRECACHE_URLS.map((url) => cache.add(url).catch(() => undefined))
            ))
    );
});

self.addEventListener('activate', (event) => {
    self.clients.claim();
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== PRECACHE && name !== RUNTIME)
                    .map((name) => caches.delete(name))
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') {
        return;
    }

    const requestUrl = new URL(event.request.url);
    if (requestUrl.origin !== self.location.origin) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.ok) {
                        const responseClone = networkResponse.clone();
                        caches.open(RUNTIME).then((cache) => cache.put(event.request, responseClone));
                    }
                    return networkResponse;
                })
                .catch(() => cachedResponse);

            return cachedResponse || fetchPromise;
        })
    );
});
