// IndexedDB-based key storage for identity keys and room keys
// Private keys never leave the client

const DB_NAME = "veil-keys";
const DB_VERSION = 1;
const IDENTITY_STORE = "identity";
const ROOM_KEYS_STORE = "room-keys";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(IDENTITY_STORE)) {
        db.createObjectStore(IDENTITY_STORE);
      }
      if (!db.objectStoreNames.contains(ROOM_KEYS_STORE)) {
        db.createObjectStore(ROOM_KEYS_STORE);
      }
    };
  });
}

// --- Identity Key ---

export async function saveIdentityKey(keyPair: CryptoKeyPair): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(IDENTITY_STORE, "readwrite");
  tx.objectStore(IDENTITY_STORE).put(keyPair, "identity-key");
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadIdentityKey(): Promise<CryptoKeyPair | null> {
  const db = await openDB();
  const tx = db.transaction(IDENTITY_STORE, "readonly");
  const request = tx.objectStore(IDENTITY_STORE).get("identity-key");
  return new Promise((resolve) => {
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => resolve(null);
  });
}

// --- Room Keys ---

export async function saveRoomKey(
  roomId: string,
  key: CryptoKey
): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(ROOM_KEYS_STORE, "readwrite");
  tx.objectStore(ROOM_KEYS_STORE).put(key, roomId);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadRoomKey(roomId: string): Promise<CryptoKey | null> {
  const db = await openDB();
  const tx = db.transaction(ROOM_KEYS_STORE, "readonly");
  const request = tx.objectStore(ROOM_KEYS_STORE).get(roomId);
  return new Promise((resolve) => {
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => resolve(null);
  });
}

export async function deleteRoomKey(roomId: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(ROOM_KEYS_STORE, "readwrite");
  tx.objectStore(ROOM_KEYS_STORE).delete(roomId);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
