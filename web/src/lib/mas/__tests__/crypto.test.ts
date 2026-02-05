import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('MAS Crypto Module', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('encrypt', () => {
    it('should encrypt a token and return base64 string', async () => {
      process.env.MAS_ENCRYPTION_KEY = 'test-encryption-key-32-chars-ok';
      const { encrypt } = await import('../crypto');

      const token = 'eyJhbGciOiJSUzI1NiIsImtpZCI6InRlc3QifQ.payload.signature';
      const encrypted = encrypt(token);

      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
      expect(encrypted).not.toBe(token);
      // Encrypted data should be base64
      expect(() => Buffer.from(encrypted, 'base64')).not.toThrow();
    });

    it('should produce different ciphertext for same input (random IV)', async () => {
      process.env.MAS_ENCRYPTION_KEY = 'test-encryption-key-32-chars-ok';
      const { encrypt } = await import('../crypto');

      const token = 'test-token';
      const encrypted1 = encrypt(token);
      const encrypted2 = encrypt(token);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should throw error if encryption key is not set', async () => {
      delete process.env.MAS_ENCRYPTION_KEY;
      const { encrypt } = await import('../crypto');

      expect(() => encrypt('test-token')).toThrow('MAS_ENCRYPTION_KEY environment variable is not set');
    });

    it('should handle empty string token', async () => {
      process.env.MAS_ENCRYPTION_KEY = 'test-encryption-key-32-chars-ok';
      const { encrypt } = await import('../crypto');

      const encrypted = encrypt('');
      expect(encrypted).toBeDefined();
    });

    it('should handle unicode characters in token', async () => {
      process.env.MAS_ENCRYPTION_KEY = 'test-encryption-key-32-chars-ok';
      const { encrypt } = await import('../crypto');

      const token = 'token-with-unicode-中文-日本語';
      const encrypted = encrypt(token);
      expect(encrypted).toBeDefined();
    });
  });

  describe('decrypt', () => {
    it('should decrypt an encrypted token correctly', async () => {
      process.env.MAS_ENCRYPTION_KEY = 'test-encryption-key-32-chars-ok';
      const { encrypt, decrypt } = await import('../crypto');

      const originalToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6InRlc3QifQ.payload.signature';
      const encrypted = encrypt(originalToken);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(originalToken);
    });

    it('should throw error if encryption key is not set', async () => {
      delete process.env.MAS_ENCRYPTION_KEY;
      const { decrypt } = await import('../crypto');

      expect(() => decrypt('some-encrypted-data')).toThrow('MAS_ENCRYPTION_KEY environment variable is not set');
    });

    it('should throw error for invalid encrypted data', async () => {
      process.env.MAS_ENCRYPTION_KEY = 'test-encryption-key-32-chars-ok';
      const { decrypt } = await import('../crypto');

      expect(() => decrypt('not-valid-encrypted-data')).toThrow();
    });

    it('should throw error for tampered data', async () => {
      process.env.MAS_ENCRYPTION_KEY = 'test-encryption-key-32-chars-ok';
      const { encrypt, decrypt } = await import('../crypto');

      const encrypted = encrypt('test-token');
      // Tamper with the encrypted data
      const tamperedBuffer = Buffer.from(encrypted, 'base64');
      tamperedBuffer[20] = tamperedBuffer[20] ^ 0xff; // Flip some bits
      const tampered = tamperedBuffer.toString('base64');

      expect(() => decrypt(tampered)).toThrow();
    });

    it('should handle empty string encryption/decryption', async () => {
      process.env.MAS_ENCRYPTION_KEY = 'test-encryption-key-32-chars-ok';
      const { encrypt, decrypt } = await import('../crypto');

      const encrypted = encrypt('');
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe('');
    });

    it('should handle unicode characters correctly', async () => {
      process.env.MAS_ENCRYPTION_KEY = 'test-encryption-key-32-chars-ok';
      const { encrypt, decrypt } = await import('../crypto');

      const originalToken = 'token-with-unicode-中文-日本語-🎉';
      const encrypted = encrypt(originalToken);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(originalToken);
    });
  });

  describe('getEncryptionKey', () => {
    it('should derive a 32-byte key from the environment variable', async () => {
      process.env.MAS_ENCRYPTION_KEY = 'short-key';
      const { getEncryptionKey } = await import('../crypto');

      const key = getEncryptionKey();
      expect(key).toBeDefined();
      expect(key.length).toBe(32);
    });

    it('should produce consistent key for same input', async () => {
      process.env.MAS_ENCRYPTION_KEY = 'test-key';
      const { getEncryptionKey } = await import('../crypto');

      const key1 = getEncryptionKey();
      const key2 = getEncryptionKey();
      expect(key1.toString('hex')).toBe(key2.toString('hex'));
    });

    it('should throw if MAS_ENCRYPTION_KEY is not set', async () => {
      delete process.env.MAS_ENCRYPTION_KEY;
      const { getEncryptionKey } = await import('../crypto');

      expect(() => getEncryptionKey()).toThrow('MAS_ENCRYPTION_KEY environment variable is not set');
    });
  });

  describe('isEncrypted', () => {
    it('should return true for encrypted data', async () => {
      process.env.MAS_ENCRYPTION_KEY = 'test-encryption-key-32-chars-ok';
      const { encrypt, isEncrypted } = await import('../crypto');

      const encrypted = encrypt('test-token');
      expect(isEncrypted(encrypted)).toBe(true);
    });

    it('should return false for plain text', async () => {
      process.env.MAS_ENCRYPTION_KEY = 'test-encryption-key-32-chars-ok';
      const { isEncrypted } = await import('../crypto');

      expect(isEncrypted('plain-text-token')).toBe(false);
      expect(isEncrypted('eyJhbGciOiJSUzI1NiJ9.test.sig')).toBe(false);
    });

    it('should return false for invalid base64', async () => {
      process.env.MAS_ENCRYPTION_KEY = 'test-encryption-key-32-chars-ok';
      const { isEncrypted } = await import('../crypto');

      expect(isEncrypted('not-valid-base64!!!')).toBe(false);
    });
  });
});
