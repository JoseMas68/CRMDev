/**
 * Encryption utilities for sensitive data
 *
 * Uses AES-256-GCM for authenticated encryption.
 * Requires ENCRYPTION_SECRET environment variable (min 32 chars).
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Get encryption key from environment
 * ENCRYPTION_SECRET must be at least 32 characters
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error('ENCRYPTION_SECRET environment variable not set');
  }
  if (secret.length < 32) {
    throw new Error('ENCRYPTION_SECRET must be at least 32 characters');
  }
  // Use first 32 bytes as key
  return Buffer.from(secret.slice(0, 32), 'utf-8');
}

/**
 * Encrypt text using AES-256-GCM
 *
 * @param text - Plain text to encrypt
 * @returns Object containing encrypted data and nonce (required for decryption)
 *
 * @example
 * const { encrypted, nonce } = encrypt('my-secret-key');
 * // Store both encrypted and nonce in database
 */
export function encrypt(text: string): { encrypted: string; nonce: string } {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  // Encrypt and convert to hex
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Get auth tag and append to encrypted data
  const authTag = cipher.getAuthTag();
  const encryptedWithTag = encrypted + authTag.toString('hex');

  return {
    encrypted: encryptedWithTag,
    nonce: iv.toString('hex'),
  };
}

/**
 * Decrypt text using AES-256-GCM
 *
 * @param encrypted - Encrypted string (with auth tag)
 * @param nonce - Nonce/IV used during encryption
 * @returns Decrypted plain text
 * @throws Error if decryption fails
 *
 * @example
 * const decrypted = decrypt(encrypted, nonce);
 */
export function decrypt(encrypted: string, nonce: string): string {
  const key = getEncryptionKey();
  const iv = Buffer.from(nonce, 'hex');

  // Split encrypted data and auth tag
  const authTagHex = encrypted.slice(-AUTH_TAG_LENGTH * 2);
  const encryptedText = encrypted.slice(0, -AUTH_TAG_LENGTH * 2);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Safe decrypt that returns null on failure
 *
 * @param encrypted - Encrypted string (can be null)
 * @param nonce - Nonce used during encryption (can be null)
 * @returns Decrypted text or null if decryption fails
 *
 * @example
 * const apiKey = safeDecrypt(org.openaiApiKeyEncrypted, org.openaiApiKeyNonce);
 * if (!apiKey) {
 *   // Handle missing or invalid encryption
 * }
 */
export function safeDecrypt(
  encrypted: string | null,
  nonce: string | null
): string | null {
  if (!encrypted || !nonce) return null;

  try {
    return decrypt(encrypted, nonce);
  } catch {
    return null;
  }
}

/**
 * Generate a secure random encryption secret
 *
 * @returns 64-character hex string (32 bytes)
 *
 * @example
 * const secret = generateEncryptionSecret();
 * // Add to .env: ENCRYPTION_SECRET=<secret>
 */
export function generateEncryptionSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}
