import { describe, it, expect } from 'vitest';
import {
  getLatestVersion,
  getAllReleaseNotes,
  getChangeTypeLabel,
} from './release-notes';

describe('release-notes', () => {
  describe('getAllReleaseNotes', () => {
    it('should have at least one release note', () => {
      const notes = getAllReleaseNotes();
      expect(notes.length).toBeGreaterThan(0);
    });

    it('should have valid structure for each note', () => {
      const notes = getAllReleaseNotes();
      notes.forEach((note) => {
        expect(note.version).toMatch(/^\d+\.\d+\.\d+$/);
        expect(note.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(Array.isArray(note.changes)).toBe(true);
        expect(note.changes.length).toBeGreaterThan(0);
      });
    });

    it('should have valid change types', () => {
      const validTypes = ['feature', 'fix', 'improvement'];
      const notes = getAllReleaseNotes();
      notes.forEach((note) => {
        note.changes.forEach((change) => {
          expect(validTypes).toContain(change.type);
          expect(change.description).toBeTruthy();
        });
      });
    });
  });

  describe('getLatestVersion', () => {
    it('should return the first version in the list', () => {
      const notes = getAllReleaseNotes();
      const latest = getLatestVersion();
      expect(latest).toBe(notes[0].version);
    });
  });

  describe('getChangeTypeLabel', () => {
    it('should return correct Chinese labels', () => {
      expect(getChangeTypeLabel('feature')).toBe('新功能');
      expect(getChangeTypeLabel('fix')).toBe('修復');
      expect(getChangeTypeLabel('improvement')).toBe('改進');
    });

    it('should return original type if not found', () => {
      // @ts-expect-error testing invalid type
      expect(getChangeTypeLabel('unknown')).toBe('unknown');
    });
  });
});
