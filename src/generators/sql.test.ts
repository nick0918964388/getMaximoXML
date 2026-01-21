import { describe, it, expect } from 'vitest';
import {
  generateMaxAttributeCfgSQL,
  generateMaxAttributeSQL,
  generateAllSQL,
  getOracleDataType,
} from './sql';
import type { ProcessedField } from '../types';

// Helper to create a minimal ProcessedField
function createField(overrides: Partial<ProcessedField> = {}): ProcessedField {
  return {
    id: '1',
    fieldName: 'ZZ_TESTFIELD',
    dataattribute: 'ZZ_TESTFIELD',
    label: '測試欄位',
    type: 'textbox',
    inputMode: '',
    lookup: '',
    relationship: '',
    applink: '',
    width: '',
    filterable: false,
    sortable: false,
    area: 'header',
    tabName: 'main',
    column: 0,
    maxType: 'ALN',
    length: 30,
    scale: 0,
    dbRequired: false,
    defaultValue: '',
    persistent: true,
    title: '測試欄位',
    objectName: '',
    ...overrides,
  };
}

describe('SQL Generator', () => {
  describe('getOracleDataType', () => {
    it('should convert ALN to VARCHAR2', () => {
      expect(getOracleDataType('ALN', 30, 0)).toBe('VARCHAR2(30)');
    });

    it('should convert ALN with default length', () => {
      expect(getOracleDataType('ALN', 0, 0)).toBe('VARCHAR2(100)');
    });

    it('should convert INTEGER to NUMBER', () => {
      expect(getOracleDataType('INTEGER', 0, 0)).toBe('NUMBER(10)');
    });

    it('should convert DECIMAL with scale', () => {
      expect(getOracleDataType('DECIMAL', 10, 2)).toBe('NUMBER(10,2)');
    });

    it('should convert DATE', () => {
      expect(getOracleDataType('DATE', 0, 0)).toBe('DATE');
    });

    it('should convert DATETIME', () => {
      expect(getOracleDataType('DATETIME', 0, 0)).toBe('TIMESTAMP');
    });

    it('should convert YORN', () => {
      expect(getOracleDataType('YORN', 0, 0)).toBe('NUMBER(1)');
    });

    it('should convert CLOB', () => {
      expect(getOracleDataType('CLOB', 0, 0)).toBe('CLOB');
    });
  });

  describe('generateMaxAttributeCfgSQL', () => {
    it('should generate INSERT into MAXATTRIBUTECFG', () => {
      const field = createField({
        fieldName: 'ZZ_CUSTOMFIELD',
        dataattribute: 'ZZ_CUSTOMFIELD',
        label: '自訂欄位',
        maxType: 'ALN',
        length: 30,
        title: '自訂欄位',
      });

      const sql = generateMaxAttributeCfgSQL(field, 'SR');

      expect(sql).toContain('INSERT INTO MAXATTRIBUTECFG');
      expect(sql).toContain("'SR'");
      expect(sql).toContain("'ZZ_CUSTOMFIELD'");
      expect(sql).toContain("'ALN'");
      expect(sql).toContain("'I'"); // CHANGED = 'I' for insert
    });

    it('should include CHANGED column with value I', () => {
      const field = createField();
      const sql = generateMaxAttributeCfgSQL(field, 'SR');

      expect(sql).toContain('CHANGED');
      expect(sql).toContain("'I'");
    });

    it('should use objectName if provided', () => {
      const field = createField({
        fieldName: 'CHILDFIELD',
        dataattribute: 'CHILDFIELD',
        objectName: 'CHILDOBJ',
      });

      const sql = generateMaxAttributeCfgSQL(field, 'SR');

      expect(sql).toContain("'CHILDOBJ'");
    });

    it('should include REQUIRED flag when dbRequired is true', () => {
      const field = createField({
        fieldName: 'ZZ_REQ',
        dataattribute: 'ZZ_REQ',
        dbRequired: true,
      });

      const sql = generateMaxAttributeCfgSQL(field, 'SR');

      expect(sql).toContain('REQUIRED');
      // The value should be 1 for required
      expect(sql).toMatch(/REQUIRED.*1/s);
    });

    it('should skip fields with relationship (they belong to other objects)', () => {
      const field = createField({
        fieldName: 'CONTAINMENTDATE',
        relationship: 'ZZ_VEHICLE_DYNAMIC',
        objectName: '', // No explicit objectName
      });

      const sql = generateMaxAttributeCfgSQL(field, 'SR');

      expect(sql).toBe('');
    });
  });

  describe('generateMaxAttributeSQL (legacy)', () => {
    it('should generate INSERT into MAXATTRIBUTE', () => {
      const field = createField({
        fieldName: 'ZZ_CUSTOMFIELD',
        dataattribute: 'ZZ_CUSTOMFIELD',
        label: '自訂欄位',
        maxType: 'ALN',
        length: 30,
        title: '自訂欄位',
      });

      const sql = generateMaxAttributeSQL(field, 'SR');

      expect(sql).toContain('INSERT INTO MAXATTRIBUTE');
      expect(sql).toContain("'SR'");
      expect(sql).toContain("'ZZ_CUSTOMFIELD'");
      expect(sql).toContain("'ALN'");
    });

    it('should use objectName if provided', () => {
      const field = createField({
        fieldName: 'CHILDFIELD',
        dataattribute: 'CHILDFIELD',
        objectName: 'CHILDOBJ',
      });

      const sql = generateMaxAttributeSQL(field, 'SR');

      expect(sql).toContain("'CHILDOBJ'");
    });
  });

  describe('generateAllSQL', () => {
    it('should generate MAXATTRIBUTECFG inserts for custom fields', () => {
      const fields = [
        createField({
          fieldName: 'ZZ_FIELD1',
          dataattribute: 'ZZ_FIELD1',
          label: '欄位1',
          maxType: 'ALN',
          length: 30,
        }),
        createField({
          fieldName: 'ZZ_FIELD2',
          dataattribute: 'ZZ_FIELD2',
          label: '欄位2',
          type: 'checkbox',
          maxType: 'YORN',
          defaultValue: '0',
        }),
      ];

      const sql = generateAllSQL(fields, 'SR');

      expect(sql).toContain('-- Maximo Database Configuration SQL');
      expect(sql).toContain('MAXATTRIBUTECFG');
      expect(sql).toContain('ZZ_FIELD1');
      expect(sql).toContain('ZZ_FIELD2');
      expect(sql).toContain("'I'"); // CHANGED flag
    });

    it('should include usage instructions in comments', () => {
      const fields = [createField()];
      const sql = generateAllSQL(fields, 'SR');

      expect(sql).toContain('資料庫配置');
      expect(sql).toContain('套用配置變更');
    });

    it('should NOT generate ALTER TABLE statements (Maximo handles this)', () => {
      const fields = [createField()];
      const sql = generateAllSQL(fields, 'SR');

      expect(sql).not.toContain('ALTER TABLE');
    });

    it('should skip fields with relationship (they belong to other objects)', () => {
      const fields = [
        createField({
          fieldName: 'CONTAINMENTDATE',
          dataattribute: 'ZZ_VEHICLE_DYNAMIC.CONTAINMENTDATE',
          relationship: 'ZZ_VEHICLE_DYNAMIC',
        }),
      ];

      const sql = generateAllSQL(fields, 'SR');

      expect(sql).not.toContain('CONTAINMENTDATE');
    });

    it('should only include ZZ_ prefixed custom fields', () => {
      const fields = [
        createField({ fieldName: 'ZZ_CUSTOM' }),
        createField({ fieldName: 'STANDARD_FIELD' }), // Should be skipped
      ];

      const sql = generateAllSQL(fields, 'SR');

      expect(sql).toContain('ZZ_CUSTOM');
      expect(sql).not.toContain('STANDARD_FIELD');
    });
  });
});
