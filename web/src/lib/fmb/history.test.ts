import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../storage', () => ({
  getUsername: vi.fn(() => 'testuser'),
}));

import { getUsername } from '../storage';
import { getUploadHistory, addUploadHistory, deleteUploadHistory, clearUploadHistory } from './history';

vi.stubGlobal('crypto', { randomUUID: () => 'test-uuid-123' });

// The global setup mocks localStorage with vi.fn() stubs.
// We need a functional localStorage for these tests.
const store = new Map<string, string>();
const localStorageMock = {
  getItem: vi.fn((key: string) => store.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => store.set(key, value)),
  removeItem: vi.fn((key: string) => store.delete(key)),
  clear: vi.fn(() => store.clear()),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });

describe('FMB upload history', () => {
  beforeEach(() => {
    store.clear();
    vi.clearAllMocks();
  });

  it('returns empty array when no history', () => {
    expect(getUploadHistory()).toEqual([]);
  });

  it('adds a record to history', () => {
    const result = addUploadHistory({
      fileName: 'test.xml',
      moduleName: 'TEST_APP',
      fieldCount: 10,
      xmlContent: '<xml/>',
    });
    expect(result).not.toBeNull();
    const history = getUploadHistory();
    expect(history).toHaveLength(1);
    expect(history[0].fileName).toBe('test.xml');
    expect(history[0].moduleName).toBe('TEST_APP');
    expect(history[0].id).toBe('test-uuid-123');
  });

  it('prepends new records (most recent first)', () => {
    let counter = 0;
    vi.stubGlobal('crypto', { randomUUID: () => `uuid-${counter++}` });

    addUploadHistory({ fileName: 'a.xml', moduleName: 'A', fieldCount: 1, xmlContent: '<a/>' });
    addUploadHistory({ fileName: 'b.xml', moduleName: 'B', fieldCount: 2, xmlContent: '<b/>' });
    const history = getUploadHistory();
    expect(history[0].fileName).toBe('b.xml');
    expect(history[1].fileName).toBe('a.xml');
  });

  it('deletes a record by id', () => {
    vi.stubGlobal('crypto', { randomUUID: () => 'del-id' });
    addUploadHistory({ fileName: 'x.xml', moduleName: 'X', fieldCount: 1, xmlContent: '<x/>' });
    expect(getUploadHistory()).toHaveLength(1);
    deleteUploadHistory('del-id');
    expect(getUploadHistory()).toHaveLength(0);
  });

  it('clears all history', () => {
    vi.stubGlobal('crypto', { randomUUID: () => 'c1' });
    addUploadHistory({ fileName: 'a.xml', moduleName: 'A', fieldCount: 1, xmlContent: '' });
    clearUploadHistory();
    expect(getUploadHistory()).toHaveLength(0);
  });

  it('returns null when no username', () => {
    vi.mocked(getUsername).mockReturnValueOnce(null);
    const result = addUploadHistory({ fileName: 'x.xml', moduleName: 'X', fieldCount: 1, xmlContent: '' });
    expect(result).toBeNull();
  });
});
