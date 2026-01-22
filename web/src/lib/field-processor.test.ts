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
