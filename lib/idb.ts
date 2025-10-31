import { openDB, DBSchema } from 'idb';

interface OfflineDB extends DBSchema {
  queue: {
    key: string;
    value: any;
  };
  submitted: {
    key: string;
    value: any;
  };
}

export async function getDB() {
  return openDB<OfflineDB>('offline-forms-db', 2, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('queue')) {
        db.createObjectStore('queue', { keyPath: 'clientId' });
      }
      if (!db.objectStoreNames.contains('submitted')) {
        db.createObjectStore('submitted', { keyPath: 'clientId' });
      }
    },
  });
}

export async function addToQueue(item: any) {
  const db = await getDB();
  await db.put('queue', item);
}

export async function getAllQueued() {
  const db = await getDB();
  return db.getAll('queue');
}

export async function removeFromQueue(clientId: string) {
  const db = await getDB();
  await db.delete('queue', clientId);
}

export async function clearQueue() {
  const db = await getDB();
  const tx = db.transaction('queue', 'readwrite');
  await tx.store.clear();
  await tx.done;
}

export async function addSubmitted(item: any) {
  const db = await getDB();
  await db.put('submitted', item);
}

export async function getAllSubmitted() {
  const db = await getDB();
  return db.getAll('submitted');
}


