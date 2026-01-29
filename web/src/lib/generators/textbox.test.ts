import { describe, it, expect, beforeEach } from 'vitest';
import { generateTextbox, generateMultilineTextbox, generateMultipartTextbox, generateStaticText, generatePushbutton, generateButtongroup } from './textbox';
import { ProcessedField, DEFAULT_FIELD } from '../types';
import { resetIdGenerator } from '../utils/id-generator';

describe('textbox generators', () => {
  beforeEach(() => {
    resetIdGenerator();
  });

  const createProcessedField = (overrides: Partial<ProcessedField> = {}): ProcessedField => ({
    ...DEFAULT_FIELD,
    id: '12345001',
    dataattribute: 'TEST_FIELD',
    ...overrides,
  });

  describe('generateTextbox', () => {
    it('should generate basic textbox XML', () => {
      const field = createProcessedField({
        dataattribute: 'TICKETID',
      });

      const result = generateTextbox(field);

      expect(result).toContain('<textbox');
      expect(result).toContain('dataattribute="TICKETID"');
      expect(result).toContain('/>');
    });

    it('should include label when provided', () => {
      const field = createProcessedField({
        dataattribute: 'STATUS',
        label: 'Status',
      });

      const result = generateTextbox(field);

      expect(result).toContain('label="Status"');
    });

    it('should include lookup when provided', () => {
      const field = createProcessedField({
        dataattribute: 'STATUS',
        lookup: 'VALUELIST',
      });

      const result = generateTextbox(field);

      expect(result).toContain('lookup="VALUELIST"');
    });

    it('should include inputmode when provided', () => {
      const field = createProcessedField({
        dataattribute: 'TICKETID',
        inputMode: 'required',
      });

      const result = generateTextbox(field);

      expect(result).toContain('inputmode="required"');
    });

    it('should include applink and menutype when applink provided', () => {
      const field = createProcessedField({
        dataattribute: 'ASSETNUM',
        applink: 'ASSET',
      });

      const result = generateTextbox(field);

      expect(result).toContain('applink="ASSET"');
      expect(result).toContain('menutype="NORMAL"');
    });

    it('should include size when width provided', () => {
      const field = createProcessedField({
        dataattribute: 'DESCRIPTION',
        width: '50',
      });

      const result = generateTextbox(field);

      expect(result).toContain('size="50"');
    });
  });

  describe('generateMultilineTextbox', () => {
    it('should generate multiline textbox XML', () => {
      const field = createProcessedField({
        dataattribute: 'DESCRIPTION',
        label: 'Description',
      });

      const result = generateMultilineTextbox(field);

      expect(result).toContain('<multilinetextbox');
      expect(result).toContain('dataattribute="DESCRIPTION"');
      expect(result).toContain('rows="7"');
    });

    it('should use custom row count', () => {
      const field = createProcessedField({
        dataattribute: 'DESCRIPTION',
      });

      const result = generateMultilineTextbox(field, 10);

      expect(result).toContain('rows="10"');
    });

    it('should use width for columns', () => {
      const field = createProcessedField({
        dataattribute: 'DESCRIPTION',
        width: '60',
      });

      const result = generateMultilineTextbox(field);

      expect(result).toContain('columns="60"');
    });
  });

  describe('generateMultipartTextbox', () => {
    it('should generate multipart textbox XML', () => {
      const field = createProcessedField({
        fieldName: 'ASSETNUM',
        dataattribute: 'ASSETNUM',
        label: 'Asset',
      });

      const result = generateMultipartTextbox(field);

      expect(result).toContain('<multiparttextbox');
      expect(result).toContain('dataattribute="ASSETNUM"');
      expect(result).toContain('descdataattribute="ASSETNUM.DESCRIPTION"');
    });

    it('should include lookup when provided', () => {
      const field = createProcessedField({
        fieldName: 'LOCATION',
        dataattribute: 'LOCATION',
        lookup: 'VALUELIST',
      });

      const result = generateMultipartTextbox(field);

      expect(result).toContain('lookup="VALUELIST"');
    });

    it('should include descinputmode when descInputMode is readonly', () => {
      const field = createProcessedField({
        fieldName: 'ASSETNUM',
        dataattribute: 'ASSETNUM',
        descInputMode: 'readonly',
      });

      const result = generateMultipartTextbox(field);

      expect(result).toContain('descinputmode="readonly"');
    });

    it('should include descinputmode when descInputMode is required', () => {
      const field = createProcessedField({
        fieldName: 'ASSETNUM',
        dataattribute: 'ASSETNUM',
        descInputMode: 'required',
      });

      const result = generateMultipartTextbox(field);

      expect(result).toContain('descinputmode="required"');
    });

    it('should not include descinputmode when descInputMode is optional', () => {
      const field = createProcessedField({
        fieldName: 'ASSETNUM',
        dataattribute: 'ASSETNUM',
        descInputMode: 'optional',
      });

      const result = generateMultipartTextbox(field);

      expect(result).not.toContain('descinputmode');
    });
  });

  describe('generateStaticText', () => {
    it('should generate basic statictext XML', () => {
      const field = createProcessedField({
        dataattribute: 'STATUS',
      });

      const result = generateStaticText(field);

      expect(result).toContain('<statictext');
      expect(result).toContain('dataattribute="STATUS"');
      expect(result).toContain('/>');
    });

    it('should include label when provided', () => {
      const field = createProcessedField({
        dataattribute: 'STATUS',
        label: 'Status',
      });

      const result = generateStaticText(field);

      expect(result).toContain('label="Status"');
    });
  });

  describe('generatePushbutton', () => {
    it('should generate basic pushbutton XML', () => {
      const field = createProcessedField({
        label: 'Save',
      });

      const result = generatePushbutton(field);

      expect(result).toContain('<pushbutton');
      expect(result).toContain('/>');
    });

    it('should include label when provided', () => {
      const field = createProcessedField({
        label: 'Submit',
      });

      const result = generatePushbutton(field);

      expect(result).toContain('label="Submit"');
    });

    it('should include mxevent when provided', () => {
      const field = createProcessedField({
        label: 'Save',
        mxevent: 'SAVE',
      });

      const result = generatePushbutton(field);

      expect(result).toContain('mxevent="SAVE"');
    });
  });

  describe('generateButtongroup', () => {
    it('should wrap multiple pushbuttons in buttongroup', () => {
      const buttons = [
        createProcessedField({ type: 'pushbutton', label: 'Save' }),
        createProcessedField({ type: 'pushbutton', label: 'Cancel' }),
      ];

      const result = generateButtongroup(buttons);

      expect(result).toContain('<buttongroup id=');
      expect(result).toContain('</buttongroup>');
      expect(result).toContain('label="Save"');
      expect(result).toContain('label="Cancel"');
    });

    it('should generate single pushbutton in buttongroup', () => {
      const buttons = [
        createProcessedField({ type: 'pushbutton', label: 'Submit' }),
      ];

      const result = generateButtongroup(buttons);

      expect(result).toContain('<buttongroup id=');
      expect(result).toContain('<pushbutton');
      expect(result).toContain('label="Submit"');
    });

    it('should preserve mxevent on pushbuttons inside buttongroup', () => {
      const buttons = [
        createProcessedField({ type: 'pushbutton', label: 'Save', mxevent: 'SAVE' }),
        createProcessedField({ type: 'pushbutton', label: 'Report', mxevent: 'REPORT' }),
      ];

      const result = generateButtongroup(buttons);

      expect(result).toContain('mxevent="SAVE"');
      expect(result).toContain('mxevent="REPORT"');
    });

    it('should generate unique ID for buttongroup', () => {
      const buttons = [
        createProcessedField({ type: 'pushbutton', label: 'Action' }),
      ];

      const result = generateButtongroup(buttons);

      expect(result).toMatch(/<buttongroup id="\d+"/);
    });
  });
});
