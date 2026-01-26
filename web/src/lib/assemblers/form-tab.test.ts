import { describe, it, expect, beforeEach } from 'vitest';
import { generateFormTab, generateNestedTabGroup } from './form-tab';
import { TabDefinition, ProcessedField, DEFAULT_FIELD, DetailTableConfig } from '../types';
import { resetIdGenerator } from '../utils/id-generator';

describe('form-tab assemblers', () => {
  beforeEach(() => {
    resetIdGenerator();
  });

  const createProcessedField = (overrides: Partial<ProcessedField> = {}): ProcessedField => ({
    ...DEFAULT_FIELD,
    id: '12345001',
    dataattribute: 'TEST_FIELD',
    ...overrides,
  });

  const createTabDefinition = (overrides: Partial<TabDefinition> = {}): TabDefinition => ({
    id: 'tab_main',
    label: 'Main',
    headerFields: [],
    detailTables: new Map(),
    subTabs: new Map(),
    ...overrides,
  });

  describe('generateFormTab', () => {
    it('should generate basic tab XML without fields', () => {
      const tab = createTabDefinition();
      const result = generateFormTab(tab);

      expect(result).toContain('<tab id="tab_main"');
      expect(result).toContain('label="Main"');
      expect(result).toContain('</tab>');
    });

    it('should generate tab with header fields', () => {
      const tab = createTabDefinition({
        headerFields: [
          createProcessedField({ dataattribute: 'STATUS', label: 'Status' }),
          createProcessedField({ dataattribute: 'DESCRIPTION', label: 'Description' }),
        ],
      });
      const result = generateFormTab(tab);

      expect(result).toContain('dataattribute="STATUS"');
      expect(result).toContain('dataattribute="DESCRIPTION"');
    });

    it('should generate tab with detail tables', () => {
      const detailTables = new Map<string, ProcessedField[]>();
      detailTables.set('WORKLOG', [
        createProcessedField({ dataattribute: 'LOGTYPE', label: 'Log Type', area: 'detail' }),
      ]);

      const tab = createTabDefinition({ detailTables });
      const result = generateFormTab(tab);

      expect(result).toContain('<table');
      expect(result).toContain('relationship="WORKLOG"');
      expect(result).toContain('dataattribute="LOGTYPE"');
    });

    it('should use detail table config when provided', () => {
      const detailTables = new Map<string, ProcessedField[]>();
      detailTables.set('WORKLOG', [
        createProcessedField({ dataattribute: 'LOGTYPE', label: 'Log Type', area: 'detail' }),
      ]);

      const tab = createTabDefinition({ label: 'Work Info', detailTables });
      const configs: Record<string, DetailTableConfig> = {
        'Work Info:WORKLOG': {
          relationship: 'WORKLOG',
          label: 'Work Log Details',
          orderBy: 'CREATEDATE DESC',
          beanclass: 'psdi.webclient.beans.worklog.WorklogBean',
        },
      };
      const result = generateFormTab(tab, configs);

      expect(result).toContain('label="Work Log Details"');
      expect(result).toContain('orderby="CREATEDATE DESC"');
      expect(result).toContain('beanclass="psdi.webclient.beans.worklog.WorklogBean"');
    });
  });

  describe('generateFormTab with subTabs', () => {
    it('should generate nested tabgroup when subTabs exist', () => {
      const subTabs = new Map<string, {
        id: string;
        label: string;
        headerFields: ProcessedField[];
        detailTables: Map<string, ProcessedField[]>;
      }>();

      subTabs.set('Details', {
        id: 'subtab_details',
        label: 'Details',
        headerFields: [
          createProcessedField({ dataattribute: 'DETAIL_FIELD', label: 'Detail Field', subTabName: 'Details' }),
        ],
        detailTables: new Map(),
      });

      subTabs.set('History', {
        id: 'subtab_history',
        label: 'History',
        headerFields: [
          createProcessedField({ dataattribute: 'HISTORY_FIELD', label: 'History Field', subTabName: 'History' }),
        ],
        detailTables: new Map(),
      });

      const tab = createTabDefinition({ subTabs });
      const result = generateFormTab(tab);

      expect(result).toContain('<tabgroup');
      expect(result).toContain('style="form"');
      expect(result).toContain('<tab id="subtab_details"');
      expect(result).toContain('label="Details"');
      expect(result).toContain('<tab id="subtab_history"');
      expect(result).toContain('label="History"');
      expect(result).toContain('dataattribute="DETAIL_FIELD"');
      expect(result).toContain('dataattribute="HISTORY_FIELD"');
    });

    it('should generate both header fields and nested subTabs', () => {
      const subTabs = new Map<string, {
        id: string;
        label: string;
        headerFields: ProcessedField[];
        detailTables: Map<string, ProcessedField[]>;
      }>();

      subTabs.set('SubTab1', {
        id: 'subtab_1',
        label: 'SubTab1',
        headerFields: [
          createProcessedField({ dataattribute: 'SUB_FIELD', label: 'Sub Field', subTabName: 'SubTab1' }),
        ],
        detailTables: new Map(),
      });

      const tab = createTabDefinition({
        headerFields: [
          createProcessedField({ dataattribute: 'MAIN_FIELD', label: 'Main Field' }),
        ],
        subTabs,
      });
      const result = generateFormTab(tab);

      // Main header field should appear
      expect(result).toContain('dataattribute="MAIN_FIELD"');
      // SubTab content should appear
      expect(result).toContain('<tabgroup');
      expect(result).toContain('dataattribute="SUB_FIELD"');
    });

    it('should generate subTabs with detail tables', () => {
      const subTabDetailTables = new Map<string, ProcessedField[]>();
      subTabDetailTables.set('SUB_DETAIL', [
        createProcessedField({ dataattribute: 'SUB_DETAIL_FIELD', label: 'Sub Detail Field', area: 'detail', subTabName: 'SubDetails' }),
      ]);

      const subTabs = new Map<string, {
        id: string;
        label: string;
        headerFields: ProcessedField[];
        detailTables: Map<string, ProcessedField[]>;
      }>();

      subTabs.set('SubDetails', {
        id: 'subtab_subdetails',
        label: 'SubDetails',
        headerFields: [],
        detailTables: subTabDetailTables,
      });

      const tab = createTabDefinition({ subTabs });
      const result = generateFormTab(tab);

      expect(result).toContain('<tabgroup');
      expect(result).toContain('relationship="SUB_DETAIL"');
      expect(result).toContain('dataattribute="SUB_DETAIL_FIELD"');
    });
  });

  describe('generateNestedTabGroup', () => {
    it('should generate tabgroup with multiple tabs', () => {
      const tabs: TabDefinition[] = [
        createTabDefinition({ id: 'tab_1', label: 'Tab 1' }),
        createTabDefinition({ id: 'tab_2', label: 'Tab 2' }),
      ];
      const result = generateNestedTabGroup(tabs);

      expect(result).toContain('<tabgroup');
      expect(result).toContain('</tabgroup>');
      expect(result).toContain('<tab id="tab_1"');
      expect(result).toContain('<tab id="tab_2"');
    });

    it('should use provided id', () => {
      const tabs: TabDefinition[] = [
        createTabDefinition({ id: 'tab_1', label: 'Tab 1' }),
      ];
      const result = generateNestedTabGroup(tabs, 'custom_tabgroup_id');

      expect(result).toContain('id="custom_tabgroup_id"');
    });
  });
});
