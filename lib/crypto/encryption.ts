// E2E Encryption using Web Crypto API
// X25519 for key exchange + AES-GCM for message encryption

const ALGORITHM_KEY_GEN = { name: "X25519" } as const;
const ALGORITHM_ENCRYPT = { name: "AES-GCM" } as const;

// --- Key Generation ---

export async function generateIdentityKeyPair(): Promise<CryptoKeyPair> {
  const key = await crypto.subtle.generateKey(ALGORITHM_KEY_GEN, false, ["deriveKey", "deriveBits"]);
  return key as CryptoKeyPair;
}

export async function exportPublicKey(keyPair: CryptoKeyPair): Promise<string> {
  const raw = await crypto.subtle.exportKey("raw", keyPair.publicKey);
  return bufferToBase64(raw);
}

// --- Key Exchange ---

export async function deriveSharedKey(
  privateKey: CryptoKey,
  peerPublicKeyRaw: ArrayBuffer
): Promise<CryptoKey> {
  const peerPublicKey = await crypto.subtle.importKey(
    "raw",
    peerPublicKeyRaw,
    ALGORITHM_KEY_GEN,
    false,
    []
  );

  const key = await crypto.subtle.deriveKey(
    { name: "X25519", public: peerPublicKey },
    privateKey,
    ALGORITHM_ENCRYPT,
    false,
    ["encrypt", "decrypt"]
  );
  return key as CryptoKey;
}

// --- Room Key Management ---

export async function generateRoomKey(): Promise<CryptoKey> {
  const key = await crypto.subtle.generateKey(ALGORITHM_ENCRYPT, true, ["encrypt", "decrypt"]);
  return key as CryptoKey;
}

export async function exportRoomKey(key: CryptoKey): Promise<ArrayBuffer> {
  return crypto.subtle.exportKey("raw", key);
}

export async function importRoomKey(raw: ArrayBuffer): Promise<CryptoKey> {
  const key = await crypto.subtle.importKey("raw", raw, ALGORITHM_ENCRYPT, true, [
    "encrypt",
    "decrypt",
  ]);
  return key as CryptoKey;
}

// --- Encrypt Room Key for a Member ---

export async function encryptRoomKeyForMember(
  roomKeyRaw: ArrayBuffer,
  memberPublicKeyRaw: ArrayBuffer
): Promise<{ encryptedKey: string; ephemeralPublicKey: string; iv: string }> {
  const memberPubKey = await crypto.subtle.importKey(
    "raw",
    memberPublicKeyRaw,
    ALGORITHM_KEY_GEN,
    false,
    []
  );

  const ephemeral = (await crypto.subtle.generateKey(ALGORITHM_KEY_GEN, false, [
    "deriveKey",
  ])) as CryptoKeyPair;

  const sharedKey = await crypto.subtle.deriveKey(
    { name: "X25519", public: memberPubKey },
    ephemeral.privateKey,
    ALGORITHM_ENCRYPT,
    false,
    ["encrypt"]
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedKey = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    sharedKey,
    roomKeyRaw
  );

  const ephemeralPubRaw = await crypto.subtle.exportKey(
    "raw",
    ephemeral.publicKey
  );

  return {
    encryptedKey: bufferToBase64(encryptedKey),
    ephemeralPublicKey: bufferToBase64(ephemeralPubRaw),
    iv: bufferToBase64(iv.buffer),
  };
}

// --- Decrypt Room Key (client-side) ---

export async function decryptRoomKey(
  encryptedKeyBase64: string,
  ephemeralPublicKeyBase64: string,
  ivBase64: string,
  identityPrivateKey: CryptoKey
): Promise<CryptoKey> {
  const ephemeralPubRaw = base64ToBuffer(ephemeralPublicKeyBase64);
  const ephemeralPubKey = await crypto.subtle.importKey(
    "raw",
    ephemeralPubRaw,
    ALGORITHM_KEY_GEN,
    false,
    []
  );

  const sharedKey = await crypto.subtle.deriveKey(
    { name: "X25519", public: ephemeralPubKey },
    identityPrivateKey,
    ALGORITHM_ENCRYPT,
    false,
    ["decrypt"]
  );

  const iv = new Uint8Array(base64ToBuffer(ivBase64));
  const encryptedKey = base64ToBuffer(encryptedKeyBase64);

  const rawKey = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    sharedKey,
    encryptedKey
  );

  return importRoomKey(rawKey);
}

// --- Per-Message Key Derivation (Forward Secrecy) ---

async function deriveMessageKey(
  roomKey: CryptoKey,
  messageIndex: number
): Promise<CryptoKey> {
  const info = new Uint8Array(4);
  new DataView(info.buffer).setUint32(0, messageIndex, false);

  const key = await crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new Uint8Array(32),
      info,
    },
    roomKey,
    ALGORITHM_ENCRYPT,
    false,
    ["encrypt", "decrypt"]
  );
  return key as CryptoKey;
}

// --- Message Encryption ---

export async function encryptMessage(
  plaintext: string,
  roomKey: CryptoKey,
  messageIndex: number
): Promise<{ ciphertext: string; iv: string; messageIndex: number }> {
  const msgKey = await deriveMessageKey(roomKey, messageIndex);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    msgKey,
    encoded
  );

  return {
    ciphertext: bufferToBase64(ciphertext),
    iv: bufferToBase64(iv.buffer),
    messageIndex,
  };
}

// --- Message Decryption ---

export async function decryptMessage(
  ciphertextBase64: string,
  ivBase64: string,
  messageIndex: number,
  roomKey: CryptoKey
): Promise<string> {
  const msgKey = await deriveMessageKey(roomKey, messageIndex);
  const iv = new Uint8Array(base64ToBuffer(ivBase64));
  const ciphertext = base64ToBuffer(ciphertextBase64);

  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    msgKey,
    ciphertext
  );

  return new TextDecoder().decode(plaintext);
}

// --- Utilities ---

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
