import { describe, it, expect } from 'vitest';
import { moveSubTabLeft, moveSubTabRight } from './sub-tab-manager';
import { SubTabDefinition } from '@/lib/types';

describe('sub-tab ordering', () => {
  const createSubTabs = (): SubTabDefinition[] => [
    { id: 'subtab_1', label: 'SubTab 1', order: 0 },
    { id: 'subtab_2', label: 'SubTab 2', order: 1 },
    { id: 'subtab_3', label: 'SubTab 3', order: 2 },
  ];

  describe('moveSubTabLeft', () => {
    it('should move a sub-tab to the left', () => {
      const subTabs = createSubTabs();
      const result = moveSubTabLeft(subTabs, subTabs[1]);

      expect(result[0].id).toBe('subtab_2');
      expect(result[1].id).toBe('subtab_1');
      expect(result[2].id).toBe('subtab_3');
      expect(result[0].order).toBe(0);
      expect(result[1].order).toBe(1);
      expect(result[2].order).toBe(2);
    });

    it('should not move the first sub-tab', () => {
      const subTabs = createSubTabs();
      const result = moveSubTabLeft(subTabs, subTabs[0]);

      expect(result).toBe(subTabs);
    });

    it('should move the last sub-tab to the left', () => {
      const subTabs = createSubTabs();
      const result = moveSubTabLeft(subTabs, subTabs[2]);

      expect(result[0].id).toBe('subtab_1');
      expect(result[1].id).toBe('subtab_3');
      expect(result[2].id).toBe('subtab_2');
    });

    it('should handle out-of-order sub-tabs', () => {
      const subTabs: SubTabDefinition[] = [
        { id: 'subtab_3', label: 'SubTab 3', order: 2 },
        { id: 'subtab_1', label: 'SubTab 1', order: 0 },
        { id: 'subtab_2', label: 'SubTab 2', order: 1 },
      ];
      const result = moveSubTabLeft(subTabs, subTabs[2]); // SubTab 2

      // SubTab 2 (order 1) should move to order 0
      expect(result.find(st => st.id === 'subtab_2')?.order).toBe(0);
      expect(result.find(st => st.id === 'subtab_1')?.order).toBe(1);
      expect(result.find(st => st.id === 'subtab_3')?.order).toBe(2);
    });
  });

  describe('moveSubTabRight', () => {
    it('should move a sub-tab to the right', () => {
      const subTabs = createSubTabs();
      const result = moveSubTabRight(subTabs, subTabs[1]);

      expect(result[0].id).toBe('subtab_1');
      expect(result[1].id).toBe('subtab_3');
      expect(result[2].id).toBe('subtab_2');
      expect(result[0].order).toBe(0);
      expect(result[1].order).toBe(1);
      expect(result[2].order).toBe(2);
    });

    it('should not move the last sub-tab', () => {
      const subTabs = createSubTabs();
      const result = moveSubTabRight(subTabs, subTabs[2]);

      expect(result).toBe(subTabs);
    });

    it('should move the first sub-tab to the right', () => {
      const subTabs = createSubTabs();
      const result = moveSubTabRight(subTabs, subTabs[0]);

      expect(result[0].id).toBe('subtab_2');
      expect(result[1].id).toBe('subtab_1');
      expect(result[2].id).toBe('subtab_3');
    });

    it('should handle out-of-order sub-tabs', () => {
      const subTabs: SubTabDefinition[] = [
        { id: 'subtab_3', label: 'SubTab 3', order: 2 },
        { id: 'subtab_1', label: 'SubTab 1', order: 0 },
        { id: 'subtab_2', label: 'SubTab 2', order: 1 },
      ];
      const result = moveSubTabRight(subTabs, subTabs[1]); // SubTab 1

      // SubTab 1 (order 0) should move to order 1
      expect(result.find(st => st.id === 'subtab_1')?.order).toBe(1);
      expect(result.find(st => st.id === 'subtab_2')?.order).toBe(0);
      expect(result.find(st => st.id === 'subtab_3')?.order).toBe(2);
    });
  });
});
