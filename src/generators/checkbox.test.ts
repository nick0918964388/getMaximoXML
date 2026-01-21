import { describe, it, expect } from 'vitest';
import { generateCheckbox } from './checkbox';
import type { ProcessedField } from '../types';

describe('checkbox generator', () => {
  describe('generateCheckbox', () => {
    it('should generate basic checkbox XML', () => {
      const field: ProcessedField = {
        id: '1748950219286',
        fieldName: 'SITEVISIT',
        dataattribute: 'SITEVISIT',
        label: '再進廠',
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
      };

      const result = generateCheckbox(field);

      expect(result).toContain('<checkbox');
      expect(result).toContain('id="1748950219286"');
      expect(result).toContain('dataattribute="SITEVISIT"');
      expect(result).toContain('label="再進廠"');
      expect(result).toContain('/>');
    });

    it('should include relationship in dataattribute when provided', () => {
      const field: ProcessedField = {
        id: '1706251665871',
        fieldName: 'ZZ_PAINT',
        dataattribute: 'workorder.ZZ_PAINT',
        label: '油漆',
        type: 'checkbox',
        inputMode: '',
        lookup: '',
        relationship: 'workorder',
        applink: '',
        width: '',
        filterable: false,
        sortable: false,
        area: 'header',
        tabName: '開工車登錄',
        tableName: '',
      };

      const result = generateCheckbox(field);

      expect(result).toContain('dataattribute="workorder.ZZ_PAINT"');
    });

    it('should not include label when empty', () => {
      const field: ProcessedField = {
        id: '1706251665871',
        fieldName: 'ZZ_PAINT',
        dataattribute: 'workorder.ZZ_PAINT',
        label: '',
        type: 'checkbox',
        inputMode: '',
        lookup: '',
        relationship: 'workorder',
        applink: '',
        width: '',
        filterable: false,
        sortable: false,
        area: 'header',
        tabName: '開工車登錄',
        tableName: '',
      };

      const result = generateCheckbox(field);

      expect(result).not.toContain('label=');
    });
  });
});
