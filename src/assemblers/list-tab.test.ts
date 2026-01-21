import { describe, it, expect } from 'vitest';
import { generateListTab } from './list-tab';
import type { ProcessedField } from '../types';

describe('list-tab assembler', () => {
  describe('generateListTab', () => {
    it('should generate list tab with results table', () => {
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
          label: '狀態',
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

      const result = generateListTab(fields, 'SR', 'zz_imnum desc', '清單');

      expect(result).toContain('<tab');
      expect(result).toContain('id="results"');
      expect(result).toContain('type="list"');
      expect(result).toContain('default="true"');
      expect(result).toContain('label="清單"');
      expect(result).toContain('<table');
      expect(result).toContain('</table>');
      expect(result).toContain('</tab>');
    });

    it('should include menubar with search options', () => {
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

      const result = generateListTab(fields, 'SR');

      expect(result).toContain('<menubar');
      expect(result).toContain('event="search"');
      expect(result).toContain('sourcemethod="getAppSearchOptions"');
    });
  });
});
