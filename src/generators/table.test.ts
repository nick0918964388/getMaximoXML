import { describe, it, expect } from 'vitest';
import { generateTable, generateListTable } from './table';
import type { ProcessedField } from '../types';

describe('table generator', () => {
  describe('generateTable', () => {
    it('should generate detail table with relationship', () => {
      const fields: ProcessedField[] = [
        {
          id: '1632281841791',
          fieldName: 'eq24',
          dataattribute: 'eq24',
          label: '',
          type: 'tablecol',
          inputMode: 'readonly',
          lookup: '',
          relationship: '',
          applink: '',
          width: '120',
          filterable: false,
          sortable: false,
          area: 'detail',
          tabName: '開工車登錄',
          tableName: 'ZZ_JOB_NUMBER',
        },
        {
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
        },
      ];

      const result = generateTable(fields, 'ZZ_JOB_NUMBER', '工作號清單');

      expect(result).toContain('<table');
      expect(result).toContain('relationship="ZZ_JOB_NUMBER"');
      expect(result).toContain('label="工作號清單"');
      expect(result).toContain('<tablebody');
      expect(result).toContain('displayrowsperpage="10"');
      expect(result).toContain('</tablebody>');
      expect(result).toContain('</table>');
      expect(result).toContain('<tablecol');
      // Should contain both columns
      expect(result).toContain('dataattribute="eq24"');
      expect(result).toContain('dataattribute="jobnum"');
    });

    it('should include orderby when provided', () => {
      const fields: ProcessedField[] = [
        {
          id: '1',
          fieldName: 'status',
          dataattribute: 'status',
          label: '',
          type: 'tablecol',
          inputMode: '',
          lookup: '',
          relationship: '',
          applink: '',
          width: '',
          filterable: false,
          sortable: false,
          area: 'detail',
          tabName: '檢修進度',
          tableName: 'ZZ_WOLISTS',
        },
      ];

      const result = generateTable(fields, 'ZZ_WOLISTS', '檢修工單', 'status desc');

      expect(result).toContain('orderby="status desc"');
    });
  });

  describe('generateListTable', () => {
    it('should generate list table with selectmode multiple', () => {
      const fields: ProcessedField[] = [
        {
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
        },
        {
          id: '1693482800317',
          fieldName: 'status',
          dataattribute: 'status',
          label: '',
          type: 'tablecol',
          inputMode: '',
          lookup: '',
          relationship: '',
          applink: '',
          width: '45',
          filterable: true,
          sortable: true,
          area: 'list',
          tabName: '',
          tableName: '',
        },
      ];

      const result = generateListTable(fields, 'SR', 'zz_imnum desc');

      expect(result).toContain('id="results_showlist"');
      expect(result).toContain('datasrc="results_showlist"');
      expect(result).toContain('mboname="SR"');
      expect(result).toContain('orderby="zz_imnum desc"');
      expect(result).toContain('selectmode="multiple"');
      expect(result).toContain('inputmode="readonly"');
      expect(result).toContain('<tablebody');
      expect(result).toContain('filterable="true"');
      expect(result).toContain('filterexpanded="true"');
      expect(result).toContain('displayrowsperpage="50"');
    });

    it('should include checkbox column for row selection', () => {
      const fields: ProcessedField[] = [
        {
          id: '1',
          fieldName: 'status',
          dataattribute: 'status',
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
        },
      ];

      const result = generateListTable(fields, 'SR');

      expect(result).toContain('mxevent="toggleselectrow"');
      expect(result).toContain('mxevent_desc="選取橫列 {0}"');
      expect(result).toContain('type="event"');
    });

    it('should include bookmark column', () => {
      const fields: ProcessedField[] = [
        {
          id: '1',
          fieldName: 'status',
          dataattribute: 'status',
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
        },
      ];

      const result = generateListTable(fields, 'SR');

      expect(result).toContain('id="results_bookmark"');
      expect(result).toContain('mxevent="BOOKMARK"');
      expect(result).toContain('mxevent_desc="新增至書籤"');
    });
  });
});
