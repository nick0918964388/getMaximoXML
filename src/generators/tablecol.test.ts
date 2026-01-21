import { describe, it, expect } from 'vitest';
import { generateTablecol } from './tablecol';
import type { ProcessedField } from '../types';

describe('tablecol generator', () => {
  describe('generateTablecol', () => {
    it('should generate basic tablecol for list view', () => {
      const field: ProcessedField = {
        id: '1625826474803',
        fieldName: 'zz_eq24',
        dataattribute: 'zz_eq24',
        label: '',
        type: 'tablecol',
        inputMode: '',
        lookup: '',
        relationship: '',
        applink: '',
        width: '',
        filterable: true,
        sortable: true,
        area: 'list',
        tabName: '',
        tableName: '',
      };

      const result = generateTablecol(field, true);

      expect(result).toContain('<tablecol');
      expect(result).toContain('id="1625826474803"');
      expect(result).toContain('dataattribute="zz_eq24"');
      expect(result).toContain('filterable="true"');
      expect(result).toContain('sortable="true"');
      expect(result).toContain('mxevent="selectrecord"');
      expect(result).toContain('mxevent_desc="移至%1"');
    });

    it('should include applink and lookup', () => {
      const field: ProcessedField = {
        id: '1625826474803',
        fieldName: 'zz_eq24',
        dataattribute: 'zz_eq24',
        label: '',
        type: 'tablecol',
        inputMode: '',
        lookup: 'asset',
        relationship: '',
        applink: 'zz_asset',
        width: '',
        filterable: true,
        sortable: true,
        area: 'list',
        tabName: '',
        tableName: '',
      };

      const result = generateTablecol(field, true);

      expect(result).toContain('applink="zz_asset"');
      expect(result).toContain('lookup="asset"');
      expect(result).toContain('menutype="normal"');
      expect(result).toContain('type="link"');
    });

    it('should include width attribute', () => {
      const field: ProcessedField = {
        id: '1623936807768',
        fieldName: 'STATUS.DESCRIPTION',
        dataattribute: 'ZZ_VEHICLE_DYNAMIC.STATUS.DESCRIPTION',
        label: '檢修動態',
        type: 'tablecol',
        inputMode: '',
        lookup: '',
        relationship: 'ZZ_VEHICLE_DYNAMIC',
        applink: '',
        width: '65',
        filterable: true,
        sortable: false,
        area: 'list',
        tabName: '',
        tableName: '',
      };

      const result = generateTablecol(field, true);

      expect(result).toContain('width="65"');
      expect(result).toContain('label="檢修動態"');
    });

    it('should include inputmode when readonly', () => {
      const field: ProcessedField = {
        id: '1632281841791',
        fieldName: 'eq24',
        dataattribute: 'eq24',
        label: '',
        type: 'tablecol',
        inputMode: 'readonly',
        lookup: '',
        relationship: '',
        applink: '',
        width: '',
        filterable: false,
        sortable: false,
        area: 'detail',
        tabName: '開工車登錄',
        tableName: 'ZZ_JOB_NUMBER',
      };

      const result = generateTablecol(field, false);

      expect(result).toContain('inputmode="readonly"');
      expect(result).not.toContain('mxevent'); // detail table should not have selectrecord
    });

    it('should generate detail table column without list-specific attributes', () => {
      const field: ProcessedField = {
        id: '1634264189331',
        fieldName: 'jobnum',
        dataattribute: 'jobnum',
        label: '',
        type: 'tablecol',
        inputMode: 'readonly',
        lookup: '',
        relationship: '',
        applink: 'ZZ_JOBNUM',
        width: '200',
        filterable: false,
        sortable: false,
        area: 'detail',
        tabName: '開工車登錄',
        tableName: 'ZZ_JOB_NUMBER',
      };

      const result = generateTablecol(field, false);

      expect(result).toContain('applink="ZZ_JOBNUM"');
      expect(result).toContain('menutype="normal"');
      expect(result).toContain('width="200"');
      expect(result).not.toContain('mxevent="selectrecord"');
    });

    it('should use hyperlink menutype when in detail table with applink', () => {
      const field: ProcessedField = {
        id: '1628246004231',
        fieldName: 'WOJP3',
        dataattribute: 'WOJP3',
        label: '',
        type: 'tablecol',
        inputMode: '',
        lookup: '',
        relationship: '',
        applink: 'ZZ_PMWO,ZZ_PMWOTF',
        width: '200',
        filterable: false,
        sortable: false,
        area: 'detail',
        tabName: '檢修進度',
        tableName: 'ZZ_WOLISTS',
      };

      const result = generateTablecol(field, false, true);

      expect(result).toContain('menutype="hyperlink"');
    });
  });
});
