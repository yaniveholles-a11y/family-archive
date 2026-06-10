const CACHE = 'family-archive-v1'
const OFFLINE_URL = '/offline'
const PRECACHE = [
  '/',
  '/he',
  '/offline',
  '/manifest.json',
]

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() =>
        caches.match(OFFLINE_URL) || caches.match('/')
      )
    )
    return
  }
  if (e.request.destination === 'image' || e.request.destination === 'font') {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached
        return fetch(e.request).then(res => {
          const clone = res.clone()
          caches.open(CACHE).then(c => c.put(e.request, clone))
          return res
        }).catch(() => cached)
      })
    )
    return
  }
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)))
})
