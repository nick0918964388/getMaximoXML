import { describe, it, expect } from 'vitest';
import { moveFieldUp, moveFieldDown, normalizeFieldOrders } from './field-ordering';
import type { SAFieldDefinition } from './types';
import { DEFAULT_FIELD } from './types';

// Helper to create test fields
const createField = (overrides: Partial<SAFieldDefinition> = {}): SAFieldDefinition => ({
  ...DEFAULT_FIELD,
  ...overrides,
});

describe('moveFieldUp', () => {
  it('should not move the first field in a group up', () => {
    const fields = [
      createField({ label: 'Field 1', order: 0, area: 'header', tabName: 'Tab1' }),
      createField({ label: 'Field 2', order: 1, area: 'header', tabName: 'Tab1' }),
    ];

    const result = moveFieldUp(fields, 0);

    // Should return same array (no change)
    expect(result).toEqual(fields);
  });

  it('should move a field up within the same group', () => {
    const fields = [
      createField({ label: 'Field 1', order: 0, area: 'header', tabName: 'Tab1' }),
      createField({ label: 'Field 2', order: 1, area: 'header', tabName: 'Tab1' }),
      createField({ label: 'Field 3', order: 2, area: 'header', tabName: 'Tab1' }),
    ];

    const result = moveFieldUp(fields, 1);

    // Field 2 should now have order 0, Field 1 should have order 1
    expect(result[0].order).toBe(1);
    expect(result[0].label).toBe('Field 1');
    expect(result[1].order).toBe(0);
    expect(result[1].label).toBe('Field 2');
    expect(result[2].order).toBe(2);
    expect(result[2].label).toBe('Field 3');
  });

  it('should not move a field up if it is the first in its group (different groups)', () => {
    const fields = [
      createField({ label: 'Header 1', order: 0, area: 'header', tabName: 'Tab1' }),
      createField({ label: 'Detail 1', order: 0, area: 'detail', tabName: 'Tab1', relationship: 'REL1' }),
      createField({ label: 'Detail 2', order: 1, area: 'detail', tabName: 'Tab1', relationship: 'REL1' }),
    ];

    // Detail 1 is at index 1, but it's the first in its group
    const result = moveFieldUp(fields, 1);

    expect(result).toEqual(fields);
  });

  it('should move a field up within its own group (detail)', () => {
    const fields = [
      createField({ label: 'Header 1', order: 0, area: 'header', tabName: 'Tab1' }),
      createField({ label: 'Detail 1', order: 0, area: 'detail', tabName: 'Tab1', relationship: 'REL1' }),
      createField({ label: 'Detail 2', order: 1, area: 'detail', tabName: 'Tab1', relationship: 'REL1' }),
    ];

    // Move Detail 2 (index 2) up
    const result = moveFieldUp(fields, 2);

    expect(result[1].order).toBe(1);
    expect(result[1].label).toBe('Detail 1');
    expect(result[2].order).toBe(0);
    expect(result[2].label).toBe('Detail 2');
  });

  it('should handle list fields separately', () => {
    const fields = [
      createField({ label: 'List 1', order: 0, area: 'list' }),
      createField({ label: 'List 2', order: 1, area: 'list' }),
      createField({ label: 'Header 1', order: 0, area: 'header', tabName: 'Tab1' }),
    ];

    const result = moveFieldUp(fields, 1);

    expect(result[0].order).toBe(1);
    expect(result[0].label).toBe('List 1');
    expect(result[1].order).toBe(0);
    expect(result[1].label).toBe('List 2');
  });
});

describe('moveFieldDown', () => {
  it('should not move the last field in a group down', () => {
    const fields = [
      createField({ label: 'Field 1', order: 0, area: 'header', tabName: 'Tab1' }),
      createField({ label: 'Field 2', order: 1, area: 'header', tabName: 'Tab1' }),
    ];

    const result = moveFieldDown(fields, 1);

    expect(result).toEqual(fields);
  });

  it('should move a field down within the same group', () => {
    const fields = [
      createField({ label: 'Field 1', order: 0, area: 'header', tabName: 'Tab1' }),
      createField({ label: 'Field 2', order: 1, area: 'header', tabName: 'Tab1' }),
      createField({ label: 'Field 3', order: 2, area: 'header', tabName: 'Tab1' }),
    ];

    const result = moveFieldDown(fields, 0);

    expect(result[0].order).toBe(1);
    expect(result[0].label).toBe('Field 1');
    expect(result[1].order).toBe(0);
    expect(result[1].label).toBe('Field 2');
    expect(result[2].order).toBe(2);
    expect(result[2].label).toBe('Field 3');
  });

  it('should not move a field down if it is the last in its group (different groups)', () => {
    const fields = [
      createField({ label: 'Header 1', order: 0, area: 'header', tabName: 'Tab1' }),
      createField({ label: 'Detail 1', order: 0, area: 'detail', tabName: 'Tab1', relationship: 'REL1' }),
      createField({ label: 'Detail 2', order: 1, area: 'detail', tabName: 'Tab1', relationship: 'REL1' }),
    ];

    // Header 1 is the last (and only) in its group
    const result = moveFieldDown(fields, 0);

    expect(result).toEqual(fields);
  });

  it('should move a field down within its own group (detail)', () => {
    const fields = [
      createField({ label: 'Header 1', order: 0, area: 'header', tabName: 'Tab1' }),
      createField({ label: 'Detail 1', order: 0, area: 'detail', tabName: 'Tab1', relationship: 'REL1' }),
      createField({ label: 'Detail 2', order: 1, area: 'detail', tabName: 'Tab1', relationship: 'REL1' }),
    ];

    // Move Detail 1 (index 1) down
    const result = moveFieldDown(fields, 1);

    expect(result[1].order).toBe(1);
    expect(result[1].label).toBe('Detail 1');
    expect(result[2].order).toBe(0);
    expect(result[2].label).toBe('Detail 2');
  });

  it('should handle list fields separately', () => {
    const fields = [
      createField({ label: 'List 1', order: 0, area: 'list' }),
      createField({ label: 'List 2', order: 1, area: 'list' }),
      createField({ label: 'Header 1', order: 0, area: 'header', tabName: 'Tab1' }),
    ];

    const result = moveFieldDown(fields, 0);

    expect(result[0].order).toBe(1);
    expect(result[0].label).toBe('List 1');
    expect(result[1].order).toBe(0);
    expect(result[1].label).toBe('List 2');
  });
});

describe('normalizeFieldOrders', () => {
  it('should normalize orders to be continuous starting from 0', () => {
    const fields = [
      createField({ label: 'Field 1', order: 5, area: 'header', tabName: 'Tab1' }),
      createField({ label: 'Field 2', order: 10, area: 'header', tabName: 'Tab1' }),
      createField({ label: 'Field 3', order: 2, area: 'header', tabName: 'Tab1' }),
    ];

    const result = normalizeFieldOrders(fields);

    // Should be sorted by original order and renumbered
    const sortedByOrder = [...result].sort((a, b) => a.order - b.order);
    expect(sortedByOrder[0].label).toBe('Field 3'); // was order 2
    expect(sortedByOrder[0].order).toBe(0);
    expect(sortedByOrder[1].label).toBe('Field 1'); // was order 5
    expect(sortedByOrder[1].order).toBe(1);
    expect(sortedByOrder[2].label).toBe('Field 2'); // was order 10
    expect(sortedByOrder[2].order).toBe(2);
  });

  it('should normalize each group separately', () => {
    const fields = [
      createField({ label: 'Header 1', order: 5, area: 'header', tabName: 'Tab1' }),
      createField({ label: 'Header 2', order: 10, area: 'header', tabName: 'Tab1' }),
      createField({ label: 'Detail 1', order: 3, area: 'detail', tabName: 'Tab1', relationship: 'REL1' }),
      createField({ label: 'Detail 2', order: 7, area: 'detail', tabName: 'Tab1', relationship: 'REL1' }),
    ];

    const result = normalizeFieldOrders(fields);

    const headers = result.filter(f => f.area === 'header');
    const details = result.filter(f => f.area === 'detail');

    // Headers should be normalized within their group
    expect(headers.find(f => f.label === 'Header 1')?.order).toBe(0);
    expect(headers.find(f => f.label === 'Header 2')?.order).toBe(1);

    // Details should be normalized within their group
    expect(details.find(f => f.label === 'Detail 1')?.order).toBe(0);
    expect(details.find(f => f.label === 'Detail 2')?.order).toBe(1);
  });

  it('should handle different tabs separately', () => {
    const fields = [
      createField({ label: 'Tab1 Field 1', order: 5, area: 'header', tabName: 'Tab1' }),
      createField({ label: 'Tab2 Field 1', order: 3, area: 'header', tabName: 'Tab2' }),
      createField({ label: 'Tab1 Field 2', order: 2, area: 'header', tabName: 'Tab1' }),
    ];

    const result = normalizeFieldOrders(fields);

    const tab1 = result.filter(f => f.tabName === 'Tab1');
    const tab2 = result.filter(f => f.tabName === 'Tab2');

    // Tab1 fields normalized
    expect(tab1.find(f => f.label === 'Tab1 Field 2')?.order).toBe(0); // was 2
    expect(tab1.find(f => f.label === 'Tab1 Field 1')?.order).toBe(1); // was 5

    // Tab2 field normalized
    expect(tab2.find(f => f.label === 'Tab2 Field 1')?.order).toBe(0);
  });

  it('should handle list fields as a separate group', () => {
    const fields = [
      createField({ label: 'List 1', order: 10, area: 'list' }),
      createField({ label: 'List 2', order: 5, area: 'list' }),
      createField({ label: 'Header 1', order: 3, area: 'header', tabName: 'Tab1' }),
    ];

    const result = normalizeFieldOrders(fields);

    const listFields = result.filter(f => f.area === 'list');

    expect(listFields.find(f => f.label === 'List 2')?.order).toBe(0); // was 5
    expect(listFields.find(f => f.label === 'List 1')?.order).toBe(1); // was 10
  });

  it('should handle different relationships as separate groups', () => {
    const fields = [
      createField({ label: 'REL1 Field 1', order: 5, area: 'detail', tabName: 'Tab1', relationship: 'REL1' }),
      createField({ label: 'REL2 Field 1', order: 3, area: 'detail', tabName: 'Tab1', relationship: 'REL2' }),
      createField({ label: 'REL1 Field 2', order: 2, area: 'detail', tabName: 'Tab1', relationship: 'REL1' }),
    ];

    const result = normalizeFieldOrders(fields);

    const rel1 = result.filter(f => f.relationship === 'REL1');
    const rel2 = result.filter(f => f.relationship === 'REL2');

    expect(rel1.find(f => f.label === 'REL1 Field 2')?.order).toBe(0); // was 2
    expect(rel1.find(f => f.label === 'REL1 Field 1')?.order).toBe(1); // was 5
    expect(rel2.find(f => f.label === 'REL2 Field 1')?.order).toBe(0);
  });

  it('should handle empty array', () => {
    const result = normalizeFieldOrders([]);
    expect(result).toEqual([]);
  });

  it('should handle fields with undefined order', () => {
    const fields = [
      createField({ label: 'Field 1', area: 'header', tabName: 'Tab1' }), // order is 0 from DEFAULT_FIELD
      createField({ label: 'Field 2', order: 1, area: 'header', tabName: 'Tab1' }),
    ];

    const result = normalizeFieldOrders(fields);

    expect(result.find(f => f.label === 'Field 1')?.order).toBe(0);
    expect(result.find(f => f.label === 'Field 2')?.order).toBe(1);
  });
});
