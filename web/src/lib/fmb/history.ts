import { getUsername } from '../storage';

export interface FmbUploadRecord {
  id: string;
  fileName: string;
  moduleName: string;
  fieldCount: number;
  uploadedAt: string;
  /** The raw XML content stored for re-loading */
  xmlContent: string;
}

const STORAGE_KEY_PREFIX = 'fmb-upload-history';
const MAX_HISTORY = 20;

function storageKey(username: string): string {
  return `${STORAGE_KEY_PREFIX}:${username}`;
}

export function getUploadHistory(): FmbUploadRecord[] {
  if (typeof window === 'undefined') return [];
  const username = getUsername();
  if (!username) return [];

  try {
    const raw = localStorage.getItem(storageKey(username));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addUploadHistory(record: Omit<FmbUploadRecord, 'id' | 'uploadedAt'>): FmbUploadRecord | null {
  const username = getUsername();
  if (!username) return null;

  const entry: FmbUploadRecord = {
    ...record,
    id: crypto.randomUUID(),
    uploadedAt: new Date().toISOString(),
  };

  const history = getUploadHistory();
  history.unshift(entry);
  // Keep only the latest N records
  const trimmed = history.slice(0, MAX_HISTORY);
  localStorage.setItem(storageKey(username), JSON.stringify(trimmed));
  return entry;
}

export function deleteUploadHistory(id: string): void {
  const username = getUsername();
  if (!username) return;

  const history = getUploadHistory().filter((r) => r.id !== id);
  localStorage.setItem(storageKey(username), JSON.stringify(history));
}

export function clearUploadHistory(): void {
  const username = getUsername();
  if (!username) return;
  localStorage.removeItem(storageKey(username));
}
