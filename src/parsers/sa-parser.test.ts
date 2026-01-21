import { describe, it, expect, beforeEach } from 'vitest';
import { SAParser, parseExcelRow, groupFieldsByArea } from './sa-parser';
import type { SAFieldDefinition, ProcessedField, ApplicationDefinition } from '../types';

describe('SAParser', () => {
  describe('parseExcelRow', () => {
    it('should parse a complete row with all fields', () => {
      const row = {
        '欄位名稱': 'ZZ_EQ24',
        '標籤': '車號',
        '型別': 'textbox',
        '輸入模式': 'required',
        'Lookup': 'ASSET',
        '關聯': '',
        '連結應用': 'ZZ_ASSET',
        '寬度': '12',
        '可篩選': 'TRUE',
        '可排序': 'TRUE',
        '區域': 'header',
        'Tab名稱': 'main',
      };

      const result = parseExcelRow(row);

      expect(result.fieldName).toBe('ZZ_EQ24');
      expect(result.label).toBe('車號');
      expect(result.type).toBe('textbox');
      expect(result.inputMode).toBe('required');
      expect(result.lookup).toBe('ASSET');
      expect(result.relationship).toBe('');
      expect(result.applink).toBe('ZZ_ASSET');
      expect(result.width).toBe('12');
      expect(result.filterable).toBe(true);
      expect(result.sortable).toBe(true);
      expect(result.area).toBe('header');
      expect(result.tabName).toBe('main');
    });

    it('should parse a detail area field with relationship as table key', () => {
      const row = {
        '欄位名稱': 'JOBNUM',
        '標籤': '工作號',
        '型別': 'tablecol',
        '輸入模式': 'readonly',
        'Lookup': '',
        '關聯': 'ZZ_JOB_NUMBER',  // relationship is used as detail table key
        '連結應用': 'ZZ_JOBNUM',
        '寬度': '200',
        '可篩選': 'TRUE',
        '可排序': 'TRUE',
        '區域': 'detail',
        'Tab名稱': '開工車登錄',
      };

      const result = parseExcelRow(row);

      expect(result.fieldName).toBe('JOBNUM');
      expect(result.area).toBe('detail');
      expect(result.tabName).toBe('開工車登錄');
      expect(result.relationship).toBe('ZZ_JOB_NUMBER');
    });

    it('should parse a list area field', () => {
      const row = {
        '欄位名稱': 'status',
        '標籤': '狀態',
        '型別': 'tablecol',
        '輸入模式': '',
        'Lookup': '',
        '關聯': '',
        '連結應用': '',
        '寬度': '',
        '可篩選': 'TRUE',
        '可排序': 'TRUE',
        '區域': 'list',
        'Tab名稱': '',
      };

      const result = parseExcelRow(row);

      expect(result.fieldName).toBe('status');
      expect(result.area).toBe('list');
      expect(result.filterable).toBe(true);
      expect(result.sortable).toBe(true);
    });

    it('should handle FALSE values for boolean fields', () => {
      const row = {
        '欄位名稱': 'desc',
        '標籤': '說明',
        '型別': 'textbox',
        '輸入模式': 'readonly',
        'Lookup': '',
        '關聯': '',
        '連結應用': '',
        '寬度': '30',
        '可篩選': 'FALSE',
        '可排序': 'FALSE',
        '區域': 'header',
        'Tab名稱': 'main',
      };

      const result = parseExcelRow(row);

      expect(result.filterable).toBe(false);
      expect(result.sortable).toBe(false);
    });

    it('should handle empty boolean fields as false', () => {
      const row = {
        '欄位名稱': 'desc',
        '標籤': '說明',
        '型別': 'textbox',
        '輸入模式': '',
        'Lookup': '',
        '關聯': '',
        '連結應用': '',
        '寬度': '',
        '可篩選': '',
        '可排序': '',
        '區域': 'header',
        'Tab名稱': 'main',
      };

      const result = parseExcelRow(row);

      expect(result.filterable).toBe(false);
      expect(result.sortable).toBe(false);
    });

    it('should handle checkbox type', () => {
      const row = {
        '欄位名稱': 'ZZ_PAINT',
        '標籤': '油漆',
        '型別': 'checkbox',
        '輸入模式': '',
        'Lookup': '',
        '關聯': 'workorder',
        '連結應用': '',
        '寬度': '',
        '可篩選': '',
        '可排序': '',
        '區域': 'header',
        'Tab名稱': '開工車登錄',
      };

      const result = parseExcelRow(row);

      expect(result.type).toBe('checkbox');
      expect(result.relationship).toBe('workorder');
    });
  });

  describe('groupFieldsByArea', () => {
    let sampleFields: ProcessedField[];

    beforeEach(() => {
      sampleFields = [
        {
          id: '1',
          fieldName: 'ZZ_EQ24',
          dataattribute: 'ZZ_EQ24',
          label: '車號',
          type: 'textbox',
          inputMode: 'required',
          lookup: 'ASSET',
          relationship: '',
          applink: 'ZZ_ASSET',
          width: '12',
          filterable: true,
          sortable: true,
          area: 'header',
          tabName: 'main',
        },
        {
          id: '2',
          fieldName: 'ZZ_TYPE',
          dataattribute: 'ZZ_TYPE',
          label: '檢修級別',
          type: 'textbox',
          inputMode: 'required',
          lookup: 'worktype',
          relationship: '',
          applink: '',
          width: '12',
          filterable: true,
          sortable: true,
          area: 'header',
          tabName: 'main',
        },
        {
          id: '3',
          fieldName: 'STARTDATE',
          dataattribute: 'STARTDATE',
          label: '開工日期',
          type: 'textbox',
          inputMode: '',
          lookup: 'DATELOOKUP',
          relationship: 'ZZ_VEHICLE_DYNAMIC',
          applink: '',
          width: '14',
          filterable: true,
          sortable: true,
          area: 'header',
          tabName: '開工車登錄',
        },
        {
          id: '4',
          fieldName: 'JOBNUM',
          dataattribute: 'JOBNUM',
          label: '工作號',
          type: 'tablecol',
          inputMode: 'readonly',
          lookup: '',
          relationship: 'ZZ_JOB_NUMBER',  // relationship is used as detail table key
          applink: 'ZZ_JOBNUM',
          width: '200',
          filterable: true,
          sortable: true,
          area: 'detail',
          tabName: '開工車登錄',
        },
        {
          id: '5',
          fieldName: 'EQ24',
          dataattribute: 'EQ24',
          label: '車號',
          type: 'tablecol',
          inputMode: 'readonly',
          lookup: '',
          relationship: 'ZZ_JOB_NUMBER',  // relationship is used as detail table key
          applink: '',
          width: '120',
          filterable: false,
          sortable: false,
          area: 'detail',
          tabName: '開工車登錄',
        },
        {
          id: '6',
          fieldName: 'status',
          dataattribute: 'status',
          label: '狀態',
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
        },
        {
          id: '7',
          fieldName: 'ZZ_IMNUM',
          dataattribute: 'ZZ_IMNUM',
          label: '進廠申請編號',
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
        },
      ] as ProcessedField[];
    });

    it('should group list fields correctly', () => {
      const result = groupFieldsByArea(sampleFields);

      expect(result.listFields).toHaveLength(2);
      expect(result.listFields[0].fieldName).toBe('status');
      expect(result.listFields[1].fieldName).toBe('ZZ_IMNUM');
    });

    it('should create tabs from unique tab names', () => {
      const result = groupFieldsByArea(sampleFields);

      expect(result.tabs.size).toBe(2);
      expect(result.tabs.has('main')).toBe(true);
      expect(result.tabs.has('開工車登錄')).toBe(true);
    });

    it('should assign header fields to correct tabs', () => {
      const result = groupFieldsByArea(sampleFields);

      const mainTab = result.tabs.get('main');
      expect(mainTab).toBeDefined();
      expect(mainTab!.headerFields).toHaveLength(2);
      expect(mainTab!.headerFields[0].fieldName).toBe('ZZ_EQ24');
      expect(mainTab!.headerFields[1].fieldName).toBe('ZZ_TYPE');

      const startTab = result.tabs.get('開工車登錄');
      expect(startTab).toBeDefined();
      expect(startTab!.headerFields).toHaveLength(1);
      expect(startTab!.headerFields[0].fieldName).toBe('STARTDATE');
    });

    it('should group detail fields by relationship within tabs', () => {
      const result = groupFieldsByArea(sampleFields);

      const startTab = result.tabs.get('開工車登錄');
      expect(startTab).toBeDefined();
      expect(startTab!.detailTables.size).toBe(1);
      expect(startTab!.detailTables.has('ZZ_JOB_NUMBER')).toBe(true);

      const detailFields = startTab!.detailTables.get('ZZ_JOB_NUMBER');
      expect(detailFields).toHaveLength(2);
      expect(detailFields![0].fieldName).toBe('JOBNUM');
      expect(detailFields![1].fieldName).toBe('EQ24');
    });

    it('should handle tabs with no detail tables', () => {
      const result = groupFieldsByArea(sampleFields);

      const mainTab = result.tabs.get('main');
      expect(mainTab).toBeDefined();
      expect(mainTab!.detailTables.size).toBe(0);
    });
  });

  describe('SAParser class', () => {
    it('should be instantiable', () => {
      const parser = new SAParser();
      expect(parser).toBeDefined();
    });
  });
});
