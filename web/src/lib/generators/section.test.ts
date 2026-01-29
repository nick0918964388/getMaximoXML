import { describe, it, expect, beforeEach } from 'vitest';
import { generateSection, generateSectionWithFields, groupFieldsIntoColumns } from './section';
import { ProcessedField, DEFAULT_FIELD } from '../types';
import { resetIdGenerator } from '../utils/id-generator';

describe('section generators', () => {
  beforeEach(() => {
    resetIdGenerator();
  });

  const createProcessedField = (overrides: Partial<ProcessedField> = {}): ProcessedField => ({
    ...DEFAULT_FIELD,
    id: '12345001',
    dataattribute: 'TEST_FIELD',
    ...overrides,
  });

  describe('generateSection', () => {
    it('should generate section with id only', () => {
      const result = generateSection('section_1', '<content/>');
      expect(result).toContain('<section id="section_1">');
      expect(result).toContain('<content/>');
      expect(result).toContain('</section>');
    });

    it('should include border attribute when border is true', () => {
      const result = generateSection('section_1', '<content/>', { border: true });
      expect(result).toContain('border="true"');
    });

    it('should include border attribute when border is false', () => {
      const result = generateSection('section_1', '<content/>', { border: false });
      expect(result).toContain('border="false"');
    });

    it('should not include border attribute when not specified', () => {
      const result = generateSection('section_1', '<content/>');
      expect(result).not.toContain('border=');
    });

    it('should include relationship when specified', () => {
      const result = generateSection('section_1', '<content/>', { relationship: 'WORKLOG' });
      expect(result).toContain('relationship="WORKLOG"');
    });
  });

  describe('generateSectionWithFields', () => {
    it('should generate section with fields', () => {
      const fields = [
        createProcessedField({ dataattribute: 'STATUS', label: 'Status' }),
        createProcessedField({ dataattribute: 'DESCRIPTION', label: 'Description' }),
      ];

      const result = generateSectionWithFields('main_grid', fields);

      expect(result).toContain('<section id="main_grid"');
      expect(result).toContain('dataattribute="STATUS"');
      expect(result).toContain('dataattribute="DESCRIPTION"');
    });

    it('should use readable IDs for sectionrow and sectioncol', () => {
      const fields = [
        createProcessedField({ dataattribute: 'STATUS', label: 'Status' }),
      ];

      const result = generateSectionWithFields('main_grid', fields);

      expect(result).toContain('id="main_grid_row1"');
      expect(result).toContain('id="main_grid_row1_col1"');
    });

    it('should use readable IDs for inner section', () => {
      const fields = [
        createProcessedField({ dataattribute: 'STATUS', label: 'Status' }),
      ];

      const result = generateSectionWithFields('main_grid', fields);

      // Inner section should have readable ID based on column
      expect(result).toContain('id="main_grid_row1_col1_section"');
    });

    it('should include border=true when border option is true', () => {
      const fields = [
        createProcessedField({ dataattribute: 'STATUS', label: 'Status' }),
      ];

      const result = generateSectionWithFields('main_grid', fields, {
        border: true,
      });

      expect(result).toContain('<section id="main_grid" border="true"');
    });

    it('should not include border when border option is not specified', () => {
      const fields = [
        createProcessedField({ dataattribute: 'STATUS', label: 'Status' }),
      ];

      const result = generateSectionWithFields('main_grid', fields);

      expect(result).not.toContain('border=');
    });

    it('should include relationship when specified', () => {
      const fields = [
        createProcessedField({ dataattribute: 'LINE_NO', label: 'Line No' }),
      ];

      const result = generateSectionWithFields('detail_grid', fields, {
        relationship: 'DETAIL',
      });

      expect(result).toContain('relationship="DETAIL"');
    });

    it('should include both border and relationship when both specified', () => {
      const fields = [
        createProcessedField({ dataattribute: 'LINE_NO', label: 'Line No' }),
      ];

      const result = generateSectionWithFields('detail_grid', fields, {
        border: true,
        relationship: 'DETAIL',
      });

      expect(result).toContain('border="true"');
      expect(result).toContain('relationship="DETAIL"');
    });
  });

  describe('groupFieldsIntoColumns', () => {
    it('should group fields into single column when count is less than fieldsPerColumn', () => {
      const fields = [
        createProcessedField({ dataattribute: 'F1' }),
        createProcessedField({ dataattribute: 'F2' }),
      ];

      const result = groupFieldsIntoColumns(fields, 4);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveLength(2);
    });

    it('should group fields into multiple columns based on fieldsPerColumn', () => {
      const fields = [
        createProcessedField({ dataattribute: 'F1' }),
        createProcessedField({ dataattribute: 'F2' }),
        createProcessedField({ dataattribute: 'F3' }),
        createProcessedField({ dataattribute: 'F4' }),
        createProcessedField({ dataattribute: 'F5' }),
      ];

      const result = groupFieldsIntoColumns(fields, 2);

      expect(result).toHaveLength(3);
      expect(result[0]).toHaveLength(2);
      expect(result[1]).toHaveLength(2);
      expect(result[2]).toHaveLength(1);
    });

    it('should respect manual column assignment', () => {
      const fields = [
        createProcessedField({ dataattribute: 'F1', column: 1 }),
        createProcessedField({ dataattribute: 'F2', column: 2 }),
        createProcessedField({ dataattribute: 'F3', column: 1 }),
      ];

      const result = groupFieldsIntoColumns(fields);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveLength(2); // F1 and F3
      expect(result[1]).toHaveLength(1); // F2
    });
  });

  describe('generateSectionWithFields buttongroup behavior', () => {
    it('should wrap consecutive pushbuttons in buttongroup', () => {
      const fields = [
        createProcessedField({ dataattribute: 'STATUS', label: 'Status', type: 'textbox' }),
        createProcessedField({ label: 'Save', type: 'pushbutton' }),
        createProcessedField({ label: 'Cancel', type: 'pushbutton' }),
        createProcessedField({ dataattribute: 'NOTES', label: 'Notes', type: 'textbox' }),
      ];

      const result = generateSectionWithFields('main_grid', fields);

      expect(result).toContain('<buttongroup');
      expect(result).toContain('</buttongroup>');
      expect(result).toContain('label="Save"');
      expect(result).toContain('label="Cancel"');
    });

    it('should generate multiple buttongroups for non-consecutive pushbutton groups', () => {
      // All fields in column 1 to ensure they're in the same column
      const fields = [
        createProcessedField({ label: 'Btn1', type: 'pushbutton', column: 1 }),
        createProcessedField({ label: 'Btn2', type: 'pushbutton', column: 1 }),
        createProcessedField({ dataattribute: 'STATUS', label: 'Status', type: 'textbox', column: 1 }),
        createProcessedField({ label: 'Btn3', type: 'pushbutton', column: 1 }),
        createProcessedField({ label: 'Btn4', type: 'pushbutton', column: 1 }),
      ];

      const result = generateSectionWithFields('main_grid', fields);

      // Count buttongroup occurrences - two groups of 2 pushbuttons each
      const matches = result.match(/<buttongroup/g);
      expect(matches).toHaveLength(2);
    });

    it('should not create buttongroup for single isolated pushbutton', () => {
      const fields = [
        createProcessedField({ dataattribute: 'STATUS', label: 'Status', type: 'textbox' }),
        createProcessedField({ label: 'Save', type: 'pushbutton' }),
        createProcessedField({ dataattribute: 'NOTES', label: 'Notes', type: 'textbox' }),
      ];

      const result = generateSectionWithFields('main_grid', fields);

      // Single pushbutton should NOT be wrapped in buttongroup
      expect(result).not.toContain('<buttongroup');
      expect(result).toContain('<pushbutton');
      expect(result).toContain('label="Save"');
    });

    it('should generate non-pushbutton fields normally', () => {
      const fields = [
        createProcessedField({ dataattribute: 'STATUS', label: 'Status', type: 'textbox' }),
        createProcessedField({ dataattribute: 'ACTIVE', label: 'Active', type: 'checkbox' }),
      ];

      const result = generateSectionWithFields('main_grid', fields);

      expect(result).toContain('<textbox');
      expect(result).toContain('<checkbox');
      expect(result).not.toContain('<buttongroup');
    });
  });
});
