import { describe, it, expect } from 'vitest';
import { generateFormTab } from './form-tab';
import type { TabDefinition, ProcessedField } from '../types';

describe('form-tab assembler', () => {
  describe('generateFormTab', () => {
    it('should generate form tab with header section', () => {
      const tab: TabDefinition = {
        id: 'main',
        label: '進廠動態管理',
        headerFields: [
          {
            id: '1629195850121',
            fieldName: 'ZZ_EQ24',
            dataattribute: 'ZZ_EQ24',
            label: '車號',
            type: 'textbox',
            inputMode: 'required',
            lookup: 'ASSET',
            relationship: '',
            applink: 'ZZ_ASSET',
            width: '12',
            filterable: false,
            sortable: false,
            area: 'header',
            tabName: 'main',
            tableName: '',
          },
          {
            id: '1623935994850',
            fieldName: 'ZZ_TYPE',
            dataattribute: 'ZZ_TYPE',
            label: '檢修級別',
            type: 'textbox',
            inputMode: 'required',
            lookup: 'worktype',
            relationship: '',
            applink: '',
            width: '12',
            filterable: false,
            sortable: false,
            area: 'header',
            tabName: 'main',
            tableName: '',
          },
        ],
        detailTables: new Map(),
      };

      const result = generateFormTab(tab);

      expect(result).toContain('<tab');
      expect(result).toContain('id="main"');
      expect(result).toContain('label="進廠動態管理"');
      expect(result).toContain('type="insert"');
      expect(result).toContain('<section');
      expect(result).toContain('<textbox');
      expect(result).toContain('dataattribute="ZZ_EQ24"');
      expect(result).toContain('dataattribute="ZZ_TYPE"');
      expect(result).toContain('</tab>');
    });

    it('should generate form tab with detail tables', () => {
      const detailFields: ProcessedField[] = [
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

      const detailTables = new Map<string, ProcessedField[]>();
      detailTables.set('ZZ_JOB_NUMBER', detailFields);

      const tab: TabDefinition = {
        id: '開工車登錄',
        label: '開工車登錄',
        headerFields: [
          {
            id: '1623142381218',
            fieldName: 'STARTDATE',
            dataattribute: 'STARTDATE',
            label: '開工日期',
            type: 'textbox',
            inputMode: '',
            lookup: 'DATELOOKUP',
            relationship: '',
            applink: '',
            width: '12',
            filterable: false,
            sortable: false,
            area: 'header',
            tabName: '開工車登錄',
            tableName: '',
          },
        ],
        detailTables,
      };

      const result = generateFormTab(tab);

      expect(result).toContain('label="開工車登錄"');
      expect(result).toContain('<table');
      expect(result).toContain('relationship="ZZ_JOB_NUMBER"');
      expect(result).toContain('<tablecol');
      expect(result).toContain('dataattribute="eq24"');
      expect(result).toContain('dataattribute="jobnum"');
    });

    it('should handle tab with only detail tables (no header fields)', () => {
      const detailFields: ProcessedField[] = [
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

      const detailTables = new Map<string, ProcessedField[]>();
      detailTables.set('ZZ_WOLISTS', detailFields);

      const tab: TabDefinition = {
        id: '檢修進度',
        label: '檢修進度',
        headerFields: [],
        detailTables,
      };

      const result = generateFormTab(tab);

      expect(result).toContain('<tab');
      expect(result).toContain('label="檢修進度"');
      expect(result).toContain('<table');
    });
  });
});
