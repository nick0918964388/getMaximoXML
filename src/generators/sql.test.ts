import { describe, it, expect } from 'vitest';
import {
  generateAlterTableSQL,
  generateMaxAttributeSQL,
  generateAllSQL,
  getOracleDataType,
} from './sql';
import type { ProcessedField } from '../types';

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

  describe('generateAlterTableSQL', () => {
    it('should generate ALTER TABLE statement for a field', () => {
      const field: ProcessedField = {
        id: '1',
        fieldName: 'ZZ_CUSTOMFIELD',
        dataattribute: 'ZZ_CUSTOMFIELD',
        label: '自訂欄位',
        type: 'textbox',
        inputMode: '',
        lookup: '',
        relationship: '',
        applink: '',
        width: '30',
        filterable: false,
        sortable: false,
        area: 'header',
        tabName: 'main',
        tableName: '',
        maxType: 'ALN',
        length: 30,
        scale: 0,
        dbRequired: false,
        defaultValue: '',
        persistent: true,
        title: '自訂欄位',
        objectName: '',
      };

      const sql = generateAlterTableSQL(field, 'SR');

      expect(sql).toContain('ALTER TABLE SR ADD');
      expect(sql).toContain('ZZ_CUSTOMFIELD');
      expect(sql).toContain('VARCHAR2(30)');
    });

    it('should include DEFAULT clause when defaultValue is provided', () => {
      const field: ProcessedField = {
        id: '1',
        fieldName: 'ZZ_STATUS',
        dataattribute: 'ZZ_STATUS',
        label: '狀態',
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
        tableName: '',
        maxType: 'ALN',
        length: 20,
        scale: 0,
        dbRequired: false,
        defaultValue: 'ACTIVE',
        persistent: true,
        title: '狀態',
        objectName: '',
      };

      const sql = generateAlterTableSQL(field, 'SR');

      expect(sql).toContain("DEFAULT 'ACTIVE'");
    });

    it('should include NOT NULL when dbRequired is true', () => {
      const field: ProcessedField = {
        id: '1',
        fieldName: 'ZZ_REQUIRED',
        dataattribute: 'ZZ_REQUIRED',
        label: '必填欄位',
        type: 'textbox',
        inputMode: 'required',
        lookup: '',
        relationship: '',
        applink: '',
        width: '',
        filterable: false,
        sortable: false,
        area: 'header',
        tabName: 'main',
        tableName: '',
        maxType: 'ALN',
        length: 50,
        scale: 0,
        dbRequired: true,
        defaultValue: '',
        persistent: true,
        title: '必填欄位',
        objectName: '',
      };

      const sql = generateAlterTableSQL(field, 'SR');

      expect(sql).toContain('NOT NULL');
    });

    it('should skip non-persistent fields', () => {
      const field: ProcessedField = {
        id: '1',
        fieldName: 'CALC_FIELD',
        dataattribute: 'CALC_FIELD',
        label: '計算欄位',
        type: 'textbox',
        inputMode: 'readonly',
        lookup: '',
        relationship: '',
        applink: '',
        width: '',
        filterable: false,
        sortable: false,
        area: 'header',
        tabName: 'main',
        tableName: '',
        maxType: 'ALN',
        length: 50,
        scale: 0,
        dbRequired: false,
        defaultValue: '',
        persistent: false,
        title: '計算欄位',
        objectName: '',
      };

      const sql = generateAlterTableSQL(field, 'SR');

      expect(sql).toBe('');
    });
  });

  describe('generateMaxAttributeSQL', () => {
    it('should generate INSERT into MAXATTRIBUTE', () => {
      const field: ProcessedField = {
        id: '1',
        fieldName: 'ZZ_CUSTOMFIELD',
        dataattribute: 'ZZ_CUSTOMFIELD',
        label: '自訂欄位',
        type: 'textbox',
        inputMode: '',
        lookup: '',
        relationship: '',
        applink: '',
        width: '30',
        filterable: false,
        sortable: false,
        area: 'header',
        tabName: 'main',
        tableName: '',
        maxType: 'ALN',
        length: 30,
        scale: 0,
        dbRequired: false,
        defaultValue: '',
        persistent: true,
        title: '自訂欄位',
        objectName: '',
      };

      const sql = generateMaxAttributeSQL(field, 'SR');

      expect(sql).toContain('INSERT INTO MAXATTRIBUTE');
      expect(sql).toContain("OBJECTNAME, ATTRIBUTENAME, ATTRIBUTENO");
      expect(sql).toContain("'SR'");
      expect(sql).toContain("'ZZ_CUSTOMFIELD'");
      expect(sql).toContain("'ALN'");
      expect(sql).toContain("TITLE");
    });

    it('should use objectName if provided', () => {
      const field: ProcessedField = {
        id: '1',
        fieldName: 'CHILDFIELD',
        dataattribute: 'CHILDFIELD',
        label: '子物件欄位',
        type: 'textbox',
        inputMode: '',
        lookup: '',
        relationship: '',
        applink: '',
        width: '',
        filterable: false,
        sortable: false,
        area: 'detail',
        tabName: 'main',
        tableName: 'CHILDOBJ',
        maxType: 'ALN',
        length: 50,
        scale: 0,
        dbRequired: false,
        defaultValue: '',
        persistent: true,
        title: '子物件欄位',
        objectName: 'CHILDOBJ',
      };

      const sql = generateMaxAttributeSQL(field, 'SR');

      expect(sql).toContain("'CHILDOBJ'");
    });

    it('should include REQUIRED flag when dbRequired is true', () => {
      const field: ProcessedField = {
        id: '1',
        fieldName: 'ZZ_REQ',
        dataattribute: 'ZZ_REQ',
        label: '必填',
        type: 'textbox',
        inputMode: 'required',
        lookup: '',
        relationship: '',
        applink: '',
        width: '',
        filterable: false,
        sortable: false,
        area: 'header',
        tabName: 'main',
        tableName: '',
        maxType: 'ALN',
        length: 30,
        scale: 0,
        dbRequired: true,
        defaultValue: '',
        persistent: true,
        title: '必填',
        objectName: '',
      };

      const sql = generateMaxAttributeSQL(field, 'SR');

      expect(sql).toContain('REQUIRED');
      expect(sql).toContain('1'); // REQUIRED = 1
    });
  });

  describe('generateAllSQL', () => {
    it('should generate combined SQL for multiple fields', () => {
      const fields: ProcessedField[] = [
        {
          id: '1',
          fieldName: 'ZZ_FIELD1',
          dataattribute: 'ZZ_FIELD1',
          label: '欄位1',
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
          tableName: '',
          maxType: 'ALN',
          length: 30,
          scale: 0,
          dbRequired: false,
          defaultValue: '',
          persistent: true,
          title: '欄位1',
          objectName: '',
        },
        {
          id: '2',
          fieldName: 'ZZ_FIELD2',
          dataattribute: 'ZZ_FIELD2',
          label: '欄位2',
          type: 'checkbox',
          inputMode: '',
          lookup: '',
          relationship: '',
          applink: '',
          width: '',
          filterable: false,
          sortable: false,
          area: 'header',
          tabName: 'main',
          tableName: '',
          maxType: 'YORN',
          length: 0,
          scale: 0,
          dbRequired: false,
          defaultValue: '0',
          persistent: true,
          title: '欄位2',
          objectName: '',
        },
      ];

      const sql = generateAllSQL(fields, 'SR');

      expect(sql).toContain('-- Database Configuration SQL');
      expect(sql).toContain('-- ALTER TABLE statements');
      expect(sql).toContain('ALTER TABLE SR ADD ZZ_FIELD1');
      expect(sql).toContain('ALTER TABLE SR ADD ZZ_FIELD2');
      expect(sql).toContain('-- MAXATTRIBUTE INSERT statements');
      expect(sql).toContain('INSERT INTO MAXATTRIBUTE');
    });

    it('should skip fields with relationship (they belong to other objects)', () => {
      const fields: ProcessedField[] = [
        {
          id: '1',
          fieldName: 'CONTAINMENTDATE',
          dataattribute: 'ZZ_VEHICLE_DYNAMIC.CONTAINMENTDATE',
          label: '收容日期',
          type: 'textbox',
          inputMode: '',
          lookup: 'DATELOOKUP',
          relationship: 'ZZ_VEHICLE_DYNAMIC',
          applink: '',
          width: '',
          filterable: false,
          sortable: false,
          area: 'header',
          tabName: 'main',
          tableName: '',
          maxType: 'DATE',
          length: 0,
          scale: 0,
          dbRequired: false,
          defaultValue: '',
          persistent: true,
          title: '收容日期',
          objectName: '',
        },
      ];

      const sql = generateAllSQL(fields, 'SR');

      // Should not generate ALTER TABLE for fields with relationship
      expect(sql).not.toContain('ALTER TABLE SR ADD CONTAINMENTDATE');
    });
  });
});
