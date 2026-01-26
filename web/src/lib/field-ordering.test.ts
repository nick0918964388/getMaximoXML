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

  it('should handle fields without order property (legacy data)', () => {
    // Simulate legacy data without order property
    const fields = [
      { ...DEFAULT_FIELD, label: 'Field 1', area: 'list' as const },
      { ...DEFAULT_FIELD, label: 'Field 2', area: 'list' as const },
      { ...DEFAULT_FIELD, label: 'Field 3', area: 'list' as const },
    ];
    // Remove order property to simulate legacy data
    delete (fields[0] as Partial<SAFieldDefinition>).order;
    delete (fields[1] as Partial<SAFieldDefinition>).order;
    delete (fields[2] as Partial<SAFieldDefinition>).order;

    // Move Field 2 (index 1) up
    const result = moveFieldUp(fields, 1);

    // After moving up, Field 2 should be before Field 1
    // The function should use array index as fallback order
    expect(result[0].label).toBe('Field 1');
    expect(result[1].label).toBe('Field 2');
    // Check that orders are now set
    expect(result[0].order).toBeDefined();
    expect(result[1].order).toBeDefined();
    // Field 2 should have lower order than Field 1 after moving up
    expect(result[1].order).toBeLessThan(result[0].order);
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

describe('moveFieldUp with subTabs', () => {
  it('should not move a field up across different subTabs', () => {
    const fields = [
      createField({ label: 'SubTab1 Field 1', order: 0, area: 'detail', tabName: 'Tab1', relationship: 'REL1', subTabName: 'SubTab1' }),
      createField({ label: 'SubTab2 Field 1', order: 0, area: 'detail', tabName: 'Tab1', relationship: 'REL1', subTabName: 'SubTab2' }),
    ];

    // SubTab2 Field 1 is the first in its subTab group, should not move
    const result = moveFieldUp(fields, 1);

    expect(result).toEqual(fields);
  });

  it('should move a field up within the same subTab', () => {
    const fields = [
      createField({ label: 'SubTab1 Field 1', order: 0, area: 'detail', tabName: 'Tab1', relationship: 'REL1', subTabName: 'SubTab1' }),
      createField({ label: 'SubTab1 Field 2', order: 1, area: 'detail', tabName: 'Tab1', relationship: 'REL1', subTabName: 'SubTab1' }),
      createField({ label: 'SubTab2 Field 1', order: 0, area: 'detail', tabName: 'Tab1', relationship: 'REL1', subTabName: 'SubTab2' }),
    ];

    // Move SubTab1 Field 2 up
    const result = moveFieldUp(fields, 1);

    expect(result[0].order).toBe(1);
    expect(result[0].label).toBe('SubTab1 Field 1');
    expect(result[1].order).toBe(0);
    expect(result[1].label).toBe('SubTab1 Field 2');
    // SubTab2 field should be unchanged
    expect(result[2].order).toBe(0);
    expect(result[2].label).toBe('SubTab2 Field 1');
  });

  it('should handle header fields in subTabs separately', () => {
    const fields = [
      createField({ label: 'Main Header', order: 0, area: 'header', tabName: 'Tab1', subTabName: '' }),
      createField({ label: 'SubTab1 Header', order: 0, area: 'header', tabName: 'Tab1', subTabName: 'SubTab1' }),
    ];

    // SubTab1 Header is the first in its subTab group
    const result = moveFieldUp(fields, 1);

    expect(result).toEqual(fields);
  });
});

describe('moveFieldDown with subTabs', () => {
  it('should not move a field down across different subTabs', () => {
    const fields = [
      createField({ label: 'SubTab1 Field 1', order: 0, area: 'detail', tabName: 'Tab1', relationship: 'REL1', subTabName: 'SubTab1' }),
      createField({ label: 'SubTab2 Field 1', order: 0, area: 'detail', tabName: 'Tab1', relationship: 'REL1', subTabName: 'SubTab2' }),
    ];

    // SubTab1 Field 1 is the last in its subTab group, should not move
    const result = moveFieldDown(fields, 0);

    expect(result).toEqual(fields);
  });

  it('should move a field down within the same subTab', () => {
    const fields = [
      createField({ label: 'SubTab1 Field 1', order: 0, area: 'detail', tabName: 'Tab1', relationship: 'REL1', subTabName: 'SubTab1' }),
      createField({ label: 'SubTab1 Field 2', order: 1, area: 'detail', tabName: 'Tab1', relationship: 'REL1', subTabName: 'SubTab1' }),
      createField({ label: 'SubTab2 Field 1', order: 0, area: 'detail', tabName: 'Tab1', relationship: 'REL1', subTabName: 'SubTab2' }),
    ];

    // Move SubTab1 Field 1 down
    const result = moveFieldDown(fields, 0);

    expect(result[0].order).toBe(1);
    expect(result[0].label).toBe('SubTab1 Field 1');
    expect(result[1].order).toBe(0);
    expect(result[1].label).toBe('SubTab1 Field 2');
    // SubTab2 field should be unchanged
    expect(result[2].order).toBe(0);
    expect(result[2].label).toBe('SubTab2 Field 1');
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

  it('should handle different subTabs as separate groups', () => {
    const fields = [
      createField({ label: 'SubTab1 Field 1', order: 5, area: 'detail', tabName: 'Tab1', relationship: 'REL1', subTabName: 'SubTab1' }),
      createField({ label: 'SubTab2 Field 1', order: 3, area: 'detail', tabName: 'Tab1', relationship: 'REL1', subTabName: 'SubTab2' }),
      createField({ label: 'SubTab1 Field 2', order: 2, area: 'detail', tabName: 'Tab1', relationship: 'REL1', subTabName: 'SubTab1' }),
    ];

    const result = normalizeFieldOrders(fields);

    const subTab1 = result.filter(f => f.subTabName === 'SubTab1');
    const subTab2 = result.filter(f => f.subTabName === 'SubTab2');

    // SubTab1 fields normalized within their group
    expect(subTab1.find(f => f.label === 'SubTab1 Field 2')?.order).toBe(0); // was 2
    expect(subTab1.find(f => f.label === 'SubTab1 Field 1')?.order).toBe(1); // was 5

    // SubTab2 field normalized
    expect(subTab2.find(f => f.label === 'SubTab2 Field 1')?.order).toBe(0);
  });

  it('should treat main area (empty subTabName) and subTabs as different groups', () => {
    const fields = [
      createField({ label: 'Main Field 1', order: 5, area: 'detail', tabName: 'Tab1', relationship: 'REL1', subTabName: '' }),
      createField({ label: 'SubTab1 Field 1', order: 3, area: 'detail', tabName: 'Tab1', relationship: 'REL1', subTabName: 'SubTab1' }),
      createField({ label: 'Main Field 2', order: 2, area: 'detail', tabName: 'Tab1', relationship: 'REL1', subTabName: '' }),
    ];

    const result = normalizeFieldOrders(fields);

    const mainFields = result.filter(f => f.subTabName === '');
    const subTab1Fields = result.filter(f => f.subTabName === 'SubTab1');

    // Main fields normalized
    expect(mainFields.find(f => f.label === 'Main Field 2')?.order).toBe(0);
    expect(mainFields.find(f => f.label === 'Main Field 1')?.order).toBe(1);

    // SubTab1 field normalized
    expect(subTab1Fields.find(f => f.label === 'SubTab1 Field 1')?.order).toBe(0);
  });
});
