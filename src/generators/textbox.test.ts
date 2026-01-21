import { describe, it, expect } from 'vitest';
import { generateTextbox, generateMultilineTextbox, generateMultipartTextbox } from './textbox';
import type { ProcessedField } from '../types';

describe('textbox generator', () => {
  describe('generateTextbox', () => {
    it('should generate basic textbox XML', () => {
      const field: ProcessedField = {
        id: '1629195850121',
        fieldName: 'ZZ_EQ24',
        dataattribute: 'ZZ_EQ24',
        label: '車號',
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
      };

      const result = generateTextbox(field);

      expect(result).toContain('<textbox');
      expect(result).toContain('id="1629195850121"');
      expect(result).toContain('dataattribute="ZZ_EQ24"');
      expect(result).toContain('/>');
    });

    it('should include inputmode when required', () => {
      const field: ProcessedField = {
        id: '1629195850121',
        fieldName: 'ZZ_EQ24',
        dataattribute: 'ZZ_EQ24',
        label: '車號',
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
      };

      const result = generateTextbox(field);

      expect(result).toContain('inputmode="required"');
    });

    it('should include inputmode when readonly', () => {
      const field: ProcessedField = {
        id: '1629195850121',
        fieldName: 'desc',
        dataattribute: 'asset.description',
        label: '說明',
        type: 'textbox',
        inputMode: 'readonly',
        lookup: '',
        relationship: '',
        applink: '',
        width: '30',
        filterable: false,
        sortable: false,
        area: 'header',
        tabName: 'main',
        tableName: '',
      };

      const result = generateTextbox(field);

      expect(result).toContain('inputmode="readonly"');
    });

    it('should include lookup attribute', () => {
      const field: ProcessedField = {
        id: '1629195850121',
        fieldName: 'ZZ_EQ24',
        dataattribute: 'ZZ_EQ24',
        label: '車號',
        type: 'textbox',
        inputMode: 'required',
        lookup: 'ASSET',
        relationship: '',
        applink: '',
        width: '',
        filterable: false,
        sortable: false,
        area: 'header',
        tabName: 'main',
        tableName: '',
      };

      const result = generateTextbox(field);

      expect(result).toContain('lookup="ASSET"');
    });

    it('should include applink and menutype', () => {
      const field: ProcessedField = {
        id: '1629195850121',
        fieldName: 'ZZ_EQ24',
        dataattribute: 'ZZ_EQ24',
        label: '車號',
        type: 'textbox',
        inputMode: 'required',
        lookup: 'ASSET',
        relationship: '',
        applink: 'ZZ_ASSET',
        width: '',
        filterable: false,
        sortable: false,
        area: 'header',
        tabName: 'main',
        tableName: '',
      };

      const result = generateTextbox(field);

      expect(result).toContain('applink="ZZ_ASSET"');
      expect(result).toContain('menutype="NORMAL"');
    });

    it('should include size when width is provided', () => {
      const field: ProcessedField = {
        id: '1629195850121',
        fieldName: 'ZZ_EQ24',
        dataattribute: 'ZZ_EQ24',
        label: '車號',
        type: 'textbox',
        inputMode: '',
        lookup: '',
        relationship: '',
        applink: '',
        width: '12',
        filterable: false,
        sortable: false,
        area: 'header',
        tabName: 'main',
        tableName: '',
      };

      const result = generateTextbox(field);

      expect(result).toContain('size="12"');
    });

    it('should include label when different from dataattribute', () => {
      const field: ProcessedField = {
        id: '1629195850121',
        fieldName: 'zz_imnum',
        dataattribute: 'zz_imnum',
        label: '進廠申請編號',
        type: 'textbox',
        inputMode: 'readonly',
        lookup: '',
        relationship: '',
        applink: '',
        width: '12',
        filterable: false,
        sortable: false,
        area: 'header',
        tabName: 'main',
        tableName: '',
      };

      const result = generateTextbox(field);

      expect(result).toContain('label="進廠申請編號"');
    });
  });

  describe('generateMultilineTextbox', () => {
    it('should generate multiline textbox with columns and rows', () => {
      const field: ProcessedField = {
        id: '1629174215932',
        fieldName: 'DESCRIPTION_LONGDESCRIPTION',
        dataattribute: 'ZZ_VEHICLE_DYNAMIC.DESCRIPTION_LONGDESCRIPTION',
        label: '原因說明',
        type: 'multilinetextbox',
        inputMode: '',
        lookup: '',
        relationship: 'ZZ_VEHICLE_DYNAMIC',
        applink: '',
        width: '45',
        filterable: false,
        sortable: false,
        area: 'header',
        tabName: 'main',
        tableName: '',
      };

      const result = generateMultilineTextbox(field);

      expect(result).toContain('<multilinetextbox');
      expect(result).toContain('id="1629174215932"');
      expect(result).toContain('dataattribute="ZZ_VEHICLE_DYNAMIC.DESCRIPTION_LONGDESCRIPTION"');
      expect(result).toContain('label="原因說明"');
      expect(result).toContain('columns="45"');
      expect(result).toContain('rows="7"');
    });
  });

  describe('generateMultipartTextbox', () => {
    it('should generate multipart textbox with description attribute', () => {
      const field: ProcessedField = {
        id: '1628245842927',
        fieldName: 'RECEIVINGSITE',
        dataattribute: 'RECEIVINGSITE',
        label: '',
        type: 'multiparttextbox',
        inputMode: '',
        lookup: 'ZZ_DEPT',
        relationship: '',
        applink: '',
        width: '',
        filterable: false,
        sortable: false,
        area: 'header',
        tabName: '進廠車登錄',
        tableName: '',
      };

      const result = generateMultipartTextbox(field);

      expect(result).toContain('<multiparttextbox');
      expect(result).toContain('id="1628245842927"');
      expect(result).toContain('dataattribute="RECEIVINGSITE"');
      expect(result).toContain('descdataattribute="RECEIVINGSITE.DESCRIPTION"');
      expect(result).toContain('lookup="ZZ_DEPT"');
    });

    it('should include applink and menutype when provided', () => {
      const field: ProcessedField = {
        id: '1627991424338',
        fieldName: 'WOJP3',
        dataattribute: 'WOJP3',
        label: 'MMIS工作單',
        type: 'multiparttextbox',
        inputMode: '',
        lookup: '',
        relationship: '',
        applink: 'ZZ_PMWO,ZZ_CMWO',
        width: '',
        filterable: false,
        sortable: false,
        area: 'header',
        tabName: '開工車登錄',
        tableName: '',
      };

      const result = generateMultipartTextbox(field);

      expect(result).toContain('applink="ZZ_PMWO,ZZ_CMWO"');
      expect(result).toContain('menutype="normal"');
      expect(result).toContain('label="MMIS工作單"');
    });
  });
});
