/**
 * MAS Token Encryption Module
 * Uses AES-256-GCM for secure token storage
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits
const SALT = 'mas-dbc-import-salt'; // Static salt for key derivation

/**
 * Get the encryption key from environment variable
 * Derives a 32-byte key using PBKDF2
 * @throws Error if MAS_ENCRYPTION_KEY is not set
 */
export function getEncryptionKey(): Buffer {
  const envKey = process.env.MAS_ENCRYPTION_KEY;
  if (!envKey) {
    throw new Error('MAS_ENCRYPTION_KEY environment variable is not set');
  }

  // Derive a 256-bit key using PBKDF2
  return crypto.pbkdf2Sync(envKey, SALT, 100000, 32, 'sha256');
}

/**
 * Encrypt a plaintext token using AES-256-GCM
 * @param plaintext The token to encrypt
 * @returns Base64-encoded encrypted data (IV + ciphertext + authTag)
 * @throws Error if MAS_ENCRYPTION_KEY is not set
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  // Combine: IV (12 bytes) + AuthTag (16 bytes) + Ciphertext
  const combined = Buffer.concat([iv, authTag, encrypted]);

  return combined.toString('base64');
}

/**
 * Decrypt an encrypted token using AES-256-GCM
 * @param encryptedData Base64-encoded encrypted data
 * @returns Decrypted plaintext token
 * @throws Error if MAS_ENCRYPTION_KEY is not set or decryption fails
 */
export function decrypt(encryptedData: string): string {
  const key = getEncryptionKey();
  const combined = Buffer.from(encryptedData, 'base64');

  // Validate minimum length: IV (12) + AuthTag (16) = 28 bytes
  if (combined.length < IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error(
      `Encrypted data is too short (${combined.length} bytes, minimum ${IV_LENGTH + AUTH_TAG_LENGTH})`
    );
  }

  // Extract components
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

/**
 * Check if a string appears to be encrypted (base64 with correct structure)
 * @param data The string to check
 * @returns true if the data appears to be encrypted
 */
export function isEncrypted(data: string): boolean {
  try {
    const buffer = Buffer.from(data, 'base64');
    // Check if it's valid base64 by re-encoding
    if (buffer.toString('base64') !== data) {
      return false;
    }
    // Minimum size: IV (12) + AuthTag (16) = 28 bytes
    // Even empty plaintext would have at least 28 bytes
    return buffer.length >= IV_LENGTH + AUTH_TAG_LENGTH;
  } catch {
    return false;
  }
}

/**
 * Check if the encryption key is configured
 * @returns true if MAS_ENCRYPTION_KEY environment variable is set
 */
export function hasEncryptionKey(): boolean {
  return !!process.env.MAS_ENCRYPTION_KEY;
}
