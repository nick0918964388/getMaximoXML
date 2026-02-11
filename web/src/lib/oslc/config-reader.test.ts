import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockReadFile, mockWriteFile, mockMkdir } = vi.hoisted(() => ({
  mockReadFile: vi.fn(),
  mockWriteFile: vi.fn(),
  mockMkdir: vi.fn(),
}));

// Mock fs — share the same fn refs between default.promises and promises
vi.mock('fs', () => {
  const promisesObj = {
    readFile: mockReadFile,
    writeFile: mockWriteFile,
    mkdir: mockMkdir,
    unlink: vi.fn(),
  };
  return { default: { promises: promisesObj }, promises: promisesObj };
});

// Mock crypto
vi.mock('@/lib/mas/crypto', () => ({
  decrypt: vi.fn((val: string) => `decrypted-${val}`),
  encrypt: vi.fn((val: string) => `encrypted-${val}`),
}));

import { readOslcConfig, saveOslcConfig, getAuthenticatedOslcClient } from './config-reader';

describe('readOslcConfig', () => {
  beforeEach(() => {
    mockReadFile.mockReset();
  });

  it('should return parsed config when file exists', async () => {
    const config = { baseUrl: 'https://maximo.test', authMethod: 'apikey', encryptedApiKey: 'enc123' };
    mockReadFile.mockResolvedValueOnce(JSON.stringify(config));

    const result = await readOslcConfig();
    expect(result).toEqual(config);
  });

  it('should return null when file does not exist', async () => {
    mockReadFile.mockRejectedValueOnce(new Error('ENOENT'));

    const result = await readOslcConfig();
    expect(result).toBeNull();
  });
});

describe('saveOslcConfig', () => {
  beforeEach(() => {
    mockMkdir.mockReset();
    mockWriteFile.mockReset();
  });

  it('should create directory and write config', async () => {
    mockMkdir.mockResolvedValueOnce(undefined);
    mockWriteFile.mockResolvedValueOnce(undefined);

    await saveOslcConfig({
      baseUrl: 'https://maximo.test',
      authMethod: 'apikey',
      encryptedApiKey: 'enc-key',
    });

    expect(mockMkdir).toHaveBeenCalledWith(expect.stringContaining('.oslc-config'), { recursive: true });
    expect(mockWriteFile).toHaveBeenCalled();
  });
});

describe('getAuthenticatedOslcClient', () => {
  beforeEach(() => {
    mockReadFile.mockReset();
  });

  it('should throw when no config exists', async () => {
    mockReadFile.mockRejectedValueOnce(new Error('ENOENT'));

    await expect(getAuthenticatedOslcClient()).rejects.toThrow('OSLC configuration not found');
  });

  it('should create client with apikey auth', async () => {
    mockReadFile.mockResolvedValueOnce(
      JSON.stringify({
        baseUrl: 'https://maximo.test',
        authMethod: 'apikey',
        encryptedApiKey: 'enc-key',
      })
    );

    const { client, config } = await getAuthenticatedOslcClient();
    expect(client).toBeDefined();
    expect(config.authMethod).toBe('apikey');
  });

  it('should create client with basic auth', async () => {
    mockReadFile.mockResolvedValueOnce(
      JSON.stringify({
        baseUrl: 'https://maximo.test',
        authMethod: 'basic',
        encryptedUsername: 'enc-user',
        encryptedPassword: 'enc-pass',
      })
    );

    const { client } = await getAuthenticatedOslcClient();
    expect(client).toBeDefined();
  });

  it('should throw when apikey is missing', async () => {
    mockReadFile.mockResolvedValueOnce(
      JSON.stringify({
        baseUrl: 'https://maximo.test',
        authMethod: 'apikey',
      })
    );

    await expect(getAuthenticatedOslcClient()).rejects.toThrow('No API key configured');
  });

  it('should throw when basic auth credentials are missing', async () => {
    mockReadFile.mockResolvedValueOnce(
      JSON.stringify({
        baseUrl: 'https://maximo.test',
        authMethod: 'basic',
      })
    );

    await expect(getAuthenticatedOslcClient()).rejects.toThrow('No username/password configured');
  });
});
