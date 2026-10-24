// Cryptographic utilities using Web Crypto API (SubtleCrypto)
// Enforces zero-knowledge client-side encryption for Secret Account Notes

const ITERATIONS = 100000;
const HASH_ALGO = 'SHA-256';

export function generateSalt(): string {
  const arr = new Uint8Array(16);
  window.crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Derive AES-GCM Key from Password & Salt using PBKDF2
async function deriveKey(password: string, saltHex: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const saltBytes = hexToBytes(saltHex);
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes.buffer as ArrayBuffer,
      iterations: ITERATIONS,
      hash: HASH_ALGO
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Hash password for vault verification
export async function hashVaultPassword(password: string, saltHex: string): Promise<string> {
  const enc = new TextEncoder();
  const saltBytes = hexToBytes(saltHex);
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes.buffer as ArrayBuffer,
      iterations: ITERATIONS,
      hash: HASH_ALGO
    },
    keyMaterial,
    256
  );

  return bytesToHex(new Uint8Array(derivedBits));
}

// Encrypt string with AES-GCM 256
export async function encryptSecret(plainText: string, password: string, saltHex: string): Promise<{ ciphertext: string; iv: string }> {
  const enc = new TextEncoder();
  const key = await deriveKey(password, saltHex);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encryptedBuf = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    key,
    enc.encode(plainText)
  );

  return {
    ciphertext: bytesToHex(new Uint8Array(encryptedBuf)),
    iv: bytesToHex(iv)
  };
}

// Decrypt string with AES-GCM 256
export async function decryptSecret(ciphertextHex: string, ivHex: string, password: string, saltHex: string): Promise<string> {
  try {
    const dec = new TextDecoder();
    const key = await deriveKey(password, saltHex);
    const ivBytes = hexToBytes(ivHex);
    const ciphertextBytes = hexToBytes(ciphertextHex);

    const decryptedBuf = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBytes.buffer as ArrayBuffer },
      key,
      ciphertextBytes.buffer as ArrayBuffer
    );

    return dec.decode(decryptedBuf);
  } catch (error) {
    throw new Error('Gagal mendekripsi: Password Catatan Rahasia salah atau data rusak.');
  }
}
