import { describe, it, expect, beforeEach } from 'vitest';
import { generateId, generateSemanticId, resetIdGenerator } from './id-generator';

describe('id-generator', () => {
  beforeEach(() => {
    resetIdGenerator();
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    it('should generate timestamp-based IDs', () => {
      const id = generateId();
      expect(id).toMatch(/^\d+$/);
    });
  });

  describe('generateSemanticId', () => {
    it('should generate ID with prefix only', () => {
      const id = generateSemanticId('main');
      expect(id).toBe('main');
    });

    it('should generate ID with prefix and suffix', () => {
      const id = generateSemanticId('main', 'grid');
      expect(id).toBe('main_grid');
    });

    it('should convert to lowercase', () => {
      const id = generateSemanticId('Main', 'GRID');
      expect(id).toBe('main_grid');
    });

    it('should replace spaces with underscores', () => {
      const id = generateSemanticId('main tab', 'grid row');
      expect(id).toBe('main_tab_grid_row');
    });

    it('should remove non-alphanumeric characters except underscore', () => {
      const id = generateSemanticId('main@tab#1', 'grid!col$2');
      expect(id).toBe('maintab1_gridcol2');
    });

    it('should handle Chinese characters by keeping them', () => {
      const id = generateSemanticId('subtab', '費用');
      expect(id).toBe('subtab_費用');
    });

    it('should handle empty suffix', () => {
      const id = generateSemanticId('section', '');
      expect(id).toBe('section');
    });

    it('should handle multiple underscores in input', () => {
      const id = generateSemanticId('main__grid', 'row__1');
      expect(id).toBe('main__grid_row__1');
    });

    it('should generate section row IDs correctly', () => {
      const id = generateSemanticId('main_grid', 'row1');
      expect(id).toBe('main_grid_row1');
    });

    it('should generate section col IDs correctly', () => {
      const id = generateSemanticId('main_grid_row1', 'col1');
      expect(id).toBe('main_grid_row1_col1');
    });

    it('should generate subtab IDs correctly', () => {
      const id = generateSemanticId('subtab', 'expense');
      expect(id).toBe('subtab_expense');
    });
  });
});
