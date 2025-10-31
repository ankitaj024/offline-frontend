import { addToQueue, getAllQueued, removeFromQueue } from './idb';
import { addSubmitted } from './idb';

const API_BASE = (() => {
  if (typeof window !== 'undefined') {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const origin = isLocal ? 'https://fd3de600e774.ngrok-free.app' : window.location.origin;
    return origin.replace(/\/+$/, '') + '/api';
  }
  return 'https://fd3de600e774.ngrok-free.app/api';
})();

async function registerBackgroundSync() {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const reg = await navigator.serviceWorker.ready;
      await (reg as any).sync.register('sync-forms');
    } catch {
      // ignore
    }
  }
}

export async function queueForm(item: any) {
  await addToQueue(item);
  await addSubmitted(item);
  registerBackgroundSync();
}

export async function trySyncQueued() {
  if (!navigator.onLine) return;
  const items = await getAllQueued();
  if (!items.length) return;
  try {
    const res = await fetch(API_BASE + '/forms/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    if (!res.ok) return;
    const data = await res.json();
    for (const r of data.results || []) {
      if (r.ok && r.clientId) {
        await removeFromQueue(r.clientId);
      }
    }
  } catch {}
}


