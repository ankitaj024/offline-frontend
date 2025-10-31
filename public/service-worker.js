const CACHE_NAME = 'offline-cache-v1';
const API_BASE = 'http://localhost:4000/api'; // adjust if backend URL differs
const ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/styles.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : undefined))))
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  // Network-first for pages and API; fallback to cache
  if (request.method === 'GET') {
    event.respondWith(
      fetch(request).then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, resClone));
        return res;
      }).catch(() => caches.match(request))
    );
  }
});

// Background Sync: send queued forms when connectivity returns
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-forms') {
    event.waitUntil(syncQueuedForms());
  }
});

async function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('offline-forms-db', 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('queue')) {
        db.createObjectStore('queue', { keyPath: 'clientId' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getAllQueued() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('queue', 'readonly');
    const store = tx.objectStore('queue');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function deleteQueued(clientId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('queue', 'readwrite');
    const store = tx.objectStore('queue');
    const req = store.delete(clientId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function syncQueuedForms() {
  try {
    const items = await getAllQueued();
    if (!items.length) return;
    const res = await fetch(API_BASE + '/forms/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    if (!res.ok) return;
    const data = await res.json();
    const results = data?.results || [];
    await Promise.all(results.filter(r => r?.ok && r?.clientId).map(r => deleteQueued(r.clientId)));
  } catch (e) {
    // keep items; will retry on next sync
  }
}


