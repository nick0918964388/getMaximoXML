export interface ReleaseNote {
  version: string;
  date: string;
  changes: {
    type: 'feature' | 'fix' | 'improvement';
    description: string;
  }[];
}

export interface ReleaseNotesData {
  notes: ReleaseNote[];
}

// 預設的 release notes（作為初始資料）
const defaultReleaseNotes: ReleaseNotesData = {
  notes: [
    {
      version: '1.0.0',
      date: '2026-02-04',
      changes: [
        { type: 'feature', description: '初始版本發布' },
        { type: 'feature', description: 'XML 產生器功能' },
        { type: 'feature', description: 'FMB 轉換器功能' },
      ],
    },
  ],
};

const STORAGE_KEY = 'release-notes';

export function getLatestVersion(): string {
  const notes = getAllReleaseNotes();
  return notes[0]?.version || '0.0.0';
}

export function getAllReleaseNotes(): ReleaseNote[] {
  if (typeof window === 'undefined') {
    return defaultReleaseNotes.notes;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as ReleaseNotesData;
      return parsed.notes;
    }
  } catch (e) {
    console.error('Failed to load release notes from localStorage:', e);
  }

  return defaultReleaseNotes.notes;
}

export function saveReleaseNotes(notes: ReleaseNote[]): void {
  if (typeof window === 'undefined') return;

  try {
    const data: ReleaseNotesData = { notes };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save release notes to localStorage:', e);
  }
}

export function getChangeTypeLabel(type: ReleaseNote['changes'][0]['type']): string {
  const labels: Record<string, string> = {
    feature: '新功能',
    fix: '修復',
    improvement: '改進',
  };
  return labels[type] || type;
}
