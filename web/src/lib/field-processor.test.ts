import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateFieldName,
  processField,
  processFields,
  validateField,
} from './field-processor';
import { SAFieldDefinition, DEFAULT_FIELD } from './types';
import { resetIdGenerator } from './utils/id-generator';

describe('field-processor', () => {
  beforeEach(() => {
    resetIdGenerator();
  });

  describe('generateFieldName', () => {
    it('should generate field name from English label', () => {
      const result = generateFieldName('Customer Name');
      expect(result).toBe('ZZ_CUSTOMER_NAME');
    });

    it('should handle special characters', () => {
      const result = generateFieldName('Email@Address');
      expect(result).toBe('ZZ_EMAIL_ADDRESS');
    });

    it('should return empty string for empty label', () => {
      const result = generateFieldName('');
      expect(result).toBe('');
    });

    it('should remove leading and trailing underscores', () => {
      const result = generateFieldName(' Test ');
      expect(result).toBe('ZZ_TEST');
    });
  });

  describe('processField', () => {
    it('should generate id and dataattribute', () => {
      const field: SAFieldDefinition = {
        ...DEFAULT_FIELD,
        fieldName: 'TEST_FIELD',
        label: 'Test Field',
      };

      const result = processField(field);

      expect(result.id).toBeDefined();
      expect(result.dataattribute).toBe('TEST_FIELD');
    });

    it('should auto-generate field name from label', () => {
      const field: SAFieldDefinition = {
        ...DEFAULT_FIELD,
        fieldName: '',
        label: 'Customer Name',
      };

      const result = processField(field);

      expect(result.fieldName).toBe('ZZ_CUSTOMER_NAME');
      expect(result.dataattribute).toBe('ZZ_CUSTOMER_NAME');
    });

    it('should use relationship.fieldName for header fields with relationship', () => {
      const field: SAFieldDefinition = {
        ...DEFAULT_FIELD,
        fieldName: 'ASSETNUM',
        label: 'Asset',
        area: 'header',
        relationship: 'asset',
      };

      const result = processField(field);

      expect(result.dataattribute).toBe('asset.ASSETNUM');
    });

    it('should not use relationship for detail fields', () => {
      const field: SAFieldDefinition = {
        ...DEFAULT_FIELD,
        fieldName: 'ITEMNUM',
        label: 'Item',
        area: 'detail',
        relationship: 'worklog',
      };

      const result = processField(field);

      expect(result.dataattribute).toBe('ITEMNUM');
    });
  });

  describe('processFields', () => {
    it('should group fields by area and tab', () => {
      const fields: SAFieldDefinition[] = [
        { ...DEFAULT_FIELD, label: 'List Field', area: 'list', tabName: '' },
        { ...DEFAULT_FIELD, label: 'Header Field 1', area: 'header', tabName: 'Main' },
        { ...DEFAULT_FIELD, label: 'Header Field 2', area: 'header', tabName: 'Main' },
        { ...DEFAULT_FIELD, label: 'Detail Field', area: 'detail', tabName: 'Main', relationship: 'worklog' },
      ];

      const result = processFields(fields);

      expect(result.listFields).toHaveLength(1);
      expect(result.tabs.size).toBe(1);
      expect(result.tabs.get('Main')?.headerFields).toHaveLength(2);
      expect(result.tabs.get('Main')?.detailTables.get('worklog')).toHaveLength(1);
    });

    it('should create default tab for fields without tabName', () => {
      const fields: SAFieldDefinition[] = [
        { ...DEFAULT_FIELD, label: 'Field 1', area: 'header', tabName: '' },
      ];

      const result = processFields(fields);

      expect(result.tabs.has('Main')).toBe(true);
    });

    it('should sort list fields by order', () => {
      const fields: SAFieldDefinition[] = [
        { ...DEFAULT_FIELD, label: 'Field C', area: 'list', order: 2 },
        { ...DEFAULT_FIELD, label: 'Field A', area: 'list', order: 0 },
        { ...DEFAULT_FIELD, label: 'Field B', area: 'list', order: 1 },
      ];

      const result = processFields(fields);

      expect(result.listFields[0].label).toBe('Field A');
      expect(result.listFields[1].label).toBe('Field B');
      expect(result.listFields[2].label).toBe('Field C');
    });

    it('should sort header fields by order', () => {
      const fields: SAFieldDefinition[] = [
        { ...DEFAULT_FIELD, label: 'Header C', area: 'header', tabName: 'Main', order: 2 },
        { ...DEFAULT_FIELD, label: 'Header A', area: 'header', tabName: 'Main', order: 0 },
        { ...DEFAULT_FIELD, label: 'Header B', area: 'header', tabName: 'Main', order: 1 },
      ];

      const result = processFields(fields);

      const headerFields = result.tabs.get('Main')?.headerFields || [];
      expect(headerFields[0].label).toBe('Header A');
      expect(headerFields[1].label).toBe('Header B');
      expect(headerFields[2].label).toBe('Header C');
    });

    it('should sort detail fields by order within each relationship', () => {
      const fields: SAFieldDefinition[] = [
        { ...DEFAULT_FIELD, label: 'Detail C', area: 'detail', tabName: 'Main', relationship: 'worklog', order: 2 },
        { ...DEFAULT_FIELD, label: 'Detail A', area: 'detail', tabName: 'Main', relationship: 'worklog', order: 0 },
        { ...DEFAULT_FIELD, label: 'Detail B', area: 'detail', tabName: 'Main', relationship: 'worklog', order: 1 },
      ];

      const result = processFields(fields);

      const detailFields = result.tabs.get('Main')?.detailTables.get('worklog') || [];
      expect(detailFields[0].label).toBe('Detail A');
      expect(detailFields[1].label).toBe('Detail B');
      expect(detailFields[2].label).toBe('Detail C');
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

      const result = processFields(fields);

      // Should maintain original order when order property is missing
      expect(result.listFields[0].label).toBe('Field 1');
      expect(result.listFields[1].label).toBe('Field 2');
      expect(result.listFields[2].label).toBe('Field 3');
    });

    it('should convert detail-only tabs to subTabs under parent tab', () => {
      const fields: SAFieldDefinition[] = [
        // Header fields in Main tab
        { ...DEFAULT_FIELD, label: 'Header Field', area: 'header', tabName: 'Main' },
        // Detail fields with different tabNames - should become subTabs
        { ...DEFAULT_FIELD, label: 'Worklog Field', area: 'detail', tabName: '工作紀錄', relationship: 'WORKLOG' },
        { ...DEFAULT_FIELD, label: 'Solution Field', area: 'detail', tabName: '解決方案', relationship: 'SOLUTION' },
      ];

      const result = processFields(fields);

      // Should only have one main tab (Main)
      expect(result.tabs.size).toBe(1);
      expect(result.tabs.has('Main')).toBe(true);

      const mainTab = result.tabs.get('Main')!;
      // Main tab should have header fields
      expect(mainTab.headerFields).toHaveLength(1);
      // Main tab should NOT have direct detail tables (they go to subTabs)
      expect(mainTab.detailTables.size).toBe(0);
      // Main tab should have subTabs for detail areas
      expect(mainTab.subTabs.size).toBe(2);
      expect(mainTab.subTabs.has('工作紀錄')).toBe(true);
      expect(mainTab.subTabs.has('解決方案')).toBe(true);

      // Each subTab should have its detail table
      const worklogSubTab = mainTab.subTabs.get('工作紀錄')!;
      expect(worklogSubTab.detailTables.has('WORKLOG')).toBe(true);
      expect(worklogSubTab.detailTables.get('WORKLOG')).toHaveLength(1);

      const solutionSubTab = mainTab.subTabs.get('解決方案')!;
      expect(solutionSubTab.detailTables.has('SOLUTION')).toBe(true);
    });

    it('should keep detail fields in same tab as subTabs when tabName differs from header tab', () => {
      const fields: SAFieldDefinition[] = [
        { ...DEFAULT_FIELD, label: 'Header 1', area: 'header', tabName: 'Info' },
        { ...DEFAULT_FIELD, label: 'Detail 1', area: 'detail', tabName: 'Details', relationship: 'REL1' },
        { ...DEFAULT_FIELD, label: 'Detail 2', area: 'detail', tabName: 'History', relationship: 'REL2' },
      ];

      const result = processFields(fields);

      // Should only have one main tab (Info - the first header tab)
      expect(result.tabs.size).toBe(1);
      expect(result.tabs.has('Info')).toBe(true);

      const infoTab = result.tabs.get('Info')!;
      expect(infoTab.headerFields).toHaveLength(1);
      expect(infoTab.subTabs.size).toBe(2);
      expect(infoTab.subTabs.has('Details')).toBe(true);
      expect(infoTab.subTabs.has('History')).toBe(true);
    });

    it('should create Main tab for detail-only fields when no header tab exists', () => {
      const fields: SAFieldDefinition[] = [
        { ...DEFAULT_FIELD, label: 'Detail 1', area: 'detail', tabName: 'Tab1', relationship: 'REL1' },
        { ...DEFAULT_FIELD, label: 'Detail 2', area: 'detail', tabName: 'Tab2', relationship: 'REL2' },
      ];

      const result = processFields(fields);

      // Should create a Main tab
      expect(result.tabs.size).toBe(1);
      expect(result.tabs.has('Main')).toBe(true);

      const mainTab = result.tabs.get('Main')!;
      expect(mainTab.headerFields).toHaveLength(0);
      expect(mainTab.subTabs.size).toBe(2);
      expect(mainTab.subTabs.has('Tab1')).toBe(true);
      expect(mainTab.subTabs.has('Tab2')).toBe(true);
    });

    it('should keep detail in same tab when tabName matches header tab', () => {
      const fields: SAFieldDefinition[] = [
        { ...DEFAULT_FIELD, label: 'Header', area: 'header', tabName: 'Main' },
        { ...DEFAULT_FIELD, label: 'Detail', area: 'detail', tabName: 'Main', relationship: 'REL1' },
      ];

      const result = processFields(fields);

      expect(result.tabs.size).toBe(1);
      const mainTab = result.tabs.get('Main')!;
      // Detail with same tabName as header should stay in detailTables, not subTabs
      expect(mainTab.detailTables.size).toBe(1);
      expect(mainTab.detailTables.has('REL1')).toBe(true);
      expect(mainTab.subTabs.size).toBe(0);
    });
  });

  describe('validateField', () => {
    it('should return error for missing label', () => {
      const field: SAFieldDefinition = {
        ...DEFAULT_FIELD,
        label: '',
      };

      const errors = validateField(field);

      expect(errors).toContain('Label is required');
    });

    it('should return error for detail field without relationship', () => {
      const field: SAFieldDefinition = {
        ...DEFAULT_FIELD,
        label: 'Test',
        area: 'detail',
        relationship: '',
      };

      const errors = validateField(field);

      expect(errors).toContain('Relationship is required for detail fields');
    });

    it('should return no errors for valid field', () => {
      const field: SAFieldDefinition = {
        ...DEFAULT_FIELD,
        label: 'Test Field',
        area: 'header',
      };

      const errors = validateField(field);

      expect(errors).toHaveLength(0);
    });
  });
});
