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
