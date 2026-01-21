import { describe, it, expect } from 'vitest';
import { generateSearchMoreDialog } from './dialog';
import type { ProcessedField } from '../types';

describe('dialog assembler', () => {
  describe('generateSearchMoreDialog', () => {
    it('should generate searchmore dialog', () => {
      const fields: ProcessedField[] = [
        {
          id: '1',
          fieldName: 'ZZ_EQ24',
          dataattribute: 'ZZ_EQ24',
          label: '車號',
          type: 'textbox',
          inputMode: '',
          lookup: 'ASSET',
          relationship: '',
          applink: '',
          width: '12',
          filterable: true,
          sortable: false,
          area: 'header',
          tabName: 'main',
          tableName: '',
        },
        {
          id: '2',
          fieldName: 'status',
          dataattribute: 'status',
          label: '狀態',
          type: 'textbox',
          inputMode: '',
          lookup: '',
          relationship: '',
          applink: '',
          width: '',
          filterable: true,
          sortable: false,
          area: 'header',
          tabName: 'main',
          tableName: '',
        },
      ];

      const result = generateSearchMoreDialog(fields);

      expect(result).toContain('<dialog');
      expect(result).toContain('id="searchmore"');
      expect(result).toContain('label="更多搜尋欄位"');
      expect(result).toContain('mboname="SR"');
      expect(result).toContain('<textbox');
      expect(result).toContain('dataattribute="ZZ_EQ24"');
      expect(result).toContain('</dialog>');
    });

    it('should include search buttons', () => {
      const fields: ProcessedField[] = [
        {
          id: '1',
          fieldName: 'status',
          dataattribute: 'status',
          label: '',
          type: 'textbox',
          inputMode: '',
          lookup: '',
          relationship: '',
          applink: '',
          width: '',
          filterable: true,
          sortable: false,
          area: 'header',
          tabName: 'main',
          tableName: '',
        },
      ];

      const result = generateSearchMoreDialog(fields);

      expect(result).toContain('<pushbutton');
      expect(result).toContain('mxevent="dialogok"');
      expect(result).toContain('mxevent="dialogcancel"');
    });
  });
});
