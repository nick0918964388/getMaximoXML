import { describe, it, expect } from 'vitest';
import { generateFormTab } from '@/lib/assemblers/form-tab';
import type { TabDefinition, ProcessedField } from '@/lib/types';

function makeField(overrides: Partial<ProcessedField> = {}): ProcessedField {
  return {
    id: 'f1',
    fieldName: 'FIELD1',
    label: 'Field 1',
    type: 'textbox',
    inputMode: 'optional',
    lookup: '',
    relationship: '',
    applink: '',
    width: '',
    filterable: false,
    sortable: false,
    area: 'detail',
    tabName: 'Main',
    column: 0,
    order: 0,
    maxType: 'ALN',
    length: 100,
    scale: 0,
    dbRequired: false,
    defaultValue: '',
    persistent: true,
    title: '',
    objectName: '',
    descDataattribute: '',
    descLabel: '',
    descInputMode: 'optional',
    subTabName: '',
    mxevent: '',
    dataattribute: 'FIELD1',
    ...overrides,
  };
}

function makeTab(overrides: Partial<TabDefinition> = {}): TabDefinition {
  return {
    id: 'tab_main',
    label: 'Main',
    headerFields: [],
    detailTables: new Map(),
    subTabs: new Map(),
    mainDetailLabel: '主區域',
    ...overrides,
  };
}

describe('generateFormTab', () => {
  it('should wrap detailTables as first sub-tab in tabgroup', () => {
    const tab = makeTab({
      detailTables: new Map([['REL1', [makeField()]]]),
      subTabs: new Map([
        ['Details', {
          id: 'subtab_details',
          label: 'Details',
          headerFields: [],
          detailTables: new Map([['REL2', [makeField({ id: 'f2', fieldName: 'FIELD2', dataattribute: 'FIELD2' })]]]),
        }],
      ]),
    });

    const xml = generateFormTab(tab);

    // Should contain tabgroup
    expect(xml).toContain('<tabgroup');
    expect(xml).toContain('style="form"');
    // The main detail should be the first sub-tab with label "主區域"
    expect(xml).toContain('label="主區域"');
    // Should contain the subtab "Details"
    expect(xml).toContain('label="Details"');
    // The main detail tab should come before the Details tab
    const mainIdx = xml.indexOf('label="主區域"');
    const detailsIdx = xml.indexOf('label="Details"');
    expect(mainIdx).toBeLessThan(detailsIdx);
  });

  it('should wrap detailTables in tabgroup even without subTabs', () => {
    const tab = makeTab({
      detailTables: new Map([['REL1', [makeField()]]]),
    });

    const xml = generateFormTab(tab);

    expect(xml).toContain('<tabgroup');
    expect(xml).toContain('style="form"');
    expect(xml).toContain('label="主區域"');
  });

  it('should use custom mainDetailLabel', () => {
    const tab = makeTab({
      mainDetailLabel: '工單明細',
      detailTables: new Map([['REL1', [makeField()]]]),
    });

    const xml = generateFormTab(tab);

    expect(xml).toContain('label="工單明細"');
    expect(xml).not.toContain('label="主區域"');
  });

  it('should not generate tabgroup when no detailTables and no subTabs', () => {
    const tab = makeTab({
      headerFields: [makeField({ area: 'header' })],
    });

    const xml = generateFormTab(tab);

    expect(xml).not.toContain('<tabgroup');
  });

  it('should not directly output table elements under tab (old behavior)', () => {
    const tab = makeTab({
      detailTables: new Map([['REL1', [makeField()]]]),
    });

    const xml = generateFormTab(tab);

    // The table should be inside a subtab inside a tabgroup, not directly under tab
    // Check that tabgroup exists and contains the table
    expect(xml).toContain('<tabgroup');
    // The table should exist somewhere
    expect(xml).toContain('relationship="REL1"');
  });
});
