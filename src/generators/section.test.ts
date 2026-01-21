import { describe, it, expect } from 'vitest';
import { generateSection, generateSectionWithFields, groupFieldsIntoColumns } from './section';
import type { ProcessedField } from '../types';

// Helper to create a minimal ProcessedField
function createField(overrides: Partial<ProcessedField> = {}): ProcessedField {
  return {
    id: '1629195850121',
    fieldName: 'TEST_FIELD',
    dataattribute: 'TEST_FIELD',
    label: 'Test Field',
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
    column: 0,
    maxType: 'ALN',
    length: 0,
    scale: 0,
    dbRequired: false,
    defaultValue: '',
    persistent: true,
    title: '',
    objectName: '',
    ...overrides,
  };
}

describe('section generator', () => {
  describe('generateSection', () => {
    it('should generate basic section with ID', () => {
      const result = generateSection('main_grid3', '<textbox id="1"/>');

      expect(result).toContain('<section');
      expect(result).toContain('id="main_grid3"');
      expect(result).toContain('<textbox id="1"/>');
      expect(result).toContain('</section>');
    });

    it('should include border attribute when specified', () => {
      const result = generateSection('section1', '<textbox id="1"/>', { border: false });

      expect(result).toContain('border="false"');
    });

    it('should include relationship when specified', () => {
      const result = generateSection('section1', '<textbox id="1"/>', {
        relationship: 'ZZ_VEHICLE_DYNAMIC',
      });

      expect(result).toContain('relationship="ZZ_VEHICLE_DYNAMIC"');
    });
  });

  describe('generateSectionWithFields', () => {
    it('should wrap fields in sectionrow and sectioncol', () => {
      const fields: ProcessedField[] = [
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
      ];

      const result = generateSectionWithFields('main_grid3', fields);

      expect(result).toContain('<section');
      expect(result).toContain('<sectionrow');
      expect(result).toContain('<sectioncol');
      expect(result).toContain('</sectioncol>');
      expect(result).toContain('</sectionrow>');
      expect(result).toContain('</section>');
      expect(result).toContain('dataattribute="ZZ_EQ24"');
      expect(result).toContain('dataattribute="ZZ_TYPE"');
    });

    it('should include relationship when all fields share same relationship', () => {
      const fields: ProcessedField[] = [
        {
          id: '1623140702119',
          fieldName: 'CONTAINMENTDATE',
          dataattribute: 'CONTAINMENTDATE',
          label: '',
          type: 'textbox',
          inputMode: '',
          lookup: 'DATELOOKUP',
          relationship: 'ZZ_VEHICLE_DYNAMIC',
          applink: '',
          width: '14',
          filterable: false,
          sortable: false,
          area: 'header',
          tabName: '進廠收容車登錄',
          tableName: '',
        },
      ];

      const result = generateSectionWithFields('section1', fields, 'ZZ_VEHICLE_DYNAMIC');

      expect(result).toContain('relationship="ZZ_VEHICLE_DYNAMIC"');
    });

    it('should handle checkbox fields', () => {
      const fields: ProcessedField[] = [
        {
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
        },
      ];

      const result = generateSectionWithFields('section1', fields);

      expect(result).toContain('<checkbox');
    });

    it('should generate multiple sectioncols for manual column assignment', () => {
      const fields: ProcessedField[] = [
        createField({ fieldName: 'FIELD1', dataattribute: 'FIELD1', label: 'Field 1', column: 1 }),
        createField({ fieldName: 'FIELD2', dataattribute: 'FIELD2', label: 'Field 2', column: 1 }),
        createField({ fieldName: 'FIELD3', dataattribute: 'FIELD3', label: 'Field 3', column: 2 }),
        createField({ fieldName: 'FIELD4', dataattribute: 'FIELD4', label: 'Field 4', column: 2 }),
      ];

      const result = generateSectionWithFields('test_section', fields);

      // Should have 2 sectioncol elements
      const sectioncolMatches = result.match(/<sectioncol/g);
      expect(sectioncolMatches).toHaveLength(2);

      // All fields should be present
      expect(result).toContain('dataattribute="FIELD1"');
      expect(result).toContain('dataattribute="FIELD2"');
      expect(result).toContain('dataattribute="FIELD3"');
      expect(result).toContain('dataattribute="FIELD4"');
    });

    it('should auto-split fields into columns when no manual assignment', () => {
      // Create 6 fields without column assignment
      const fields: ProcessedField[] = [
        createField({ fieldName: 'FIELD1', dataattribute: 'FIELD1', column: 0 }),
        createField({ fieldName: 'FIELD2', dataattribute: 'FIELD2', column: 0 }),
        createField({ fieldName: 'FIELD3', dataattribute: 'FIELD3', column: 0 }),
        createField({ fieldName: 'FIELD4', dataattribute: 'FIELD4', column: 0 }),
        createField({ fieldName: 'FIELD5', dataattribute: 'FIELD5', column: 0 }),
        createField({ fieldName: 'FIELD6', dataattribute: 'FIELD6', column: 0 }),
      ];

      // With default 4 fields per column, should get 2 columns
      const result = generateSectionWithFields('test_section', fields);

      const sectioncolMatches = result.match(/<sectioncol/g);
      expect(sectioncolMatches).toHaveLength(2);
    });
  });

  describe('groupFieldsIntoColumns', () => {
    it('should return single column for few fields', () => {
      const fields = [
        createField({ fieldName: 'FIELD1', column: 0 }),
        createField({ fieldName: 'FIELD2', column: 0 }),
        createField({ fieldName: 'FIELD3', column: 0 }),
      ];

      const result = groupFieldsIntoColumns(fields);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveLength(3);
    });

    it('should auto-split when exceeding fields per column', () => {
      const fields = [
        createField({ fieldName: 'FIELD1', column: 0 }),
        createField({ fieldName: 'FIELD2', column: 0 }),
        createField({ fieldName: 'FIELD3', column: 0 }),
        createField({ fieldName: 'FIELD4', column: 0 }),
        createField({ fieldName: 'FIELD5', column: 0 }),
      ];

      const result = groupFieldsIntoColumns(fields, 4);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveLength(4);
      expect(result[1]).toHaveLength(1);
    });

    it('should respect manual column assignment', () => {
      const fields = [
        createField({ fieldName: 'FIELD1', column: 1 }),
        createField({ fieldName: 'FIELD2', column: 2 }),
        createField({ fieldName: 'FIELD3', column: 1 }),
        createField({ fieldName: 'FIELD4', column: 3 }),
      ];

      const result = groupFieldsIntoColumns(fields);

      expect(result).toHaveLength(3);
      expect(result[0].map(f => f.fieldName)).toEqual(['FIELD1', 'FIELD3']);
      expect(result[1].map(f => f.fieldName)).toEqual(['FIELD2']);
      expect(result[2].map(f => f.fieldName)).toEqual(['FIELD4']);
    });

    it('should default unassigned fields to column 1 when some have manual assignment', () => {
      const fields = [
        createField({ fieldName: 'FIELD1', column: 1 }),
        createField({ fieldName: 'FIELD2', column: 0 }), // Should go to column 1
        createField({ fieldName: 'FIELD3', column: 2 }),
      ];

      const result = groupFieldsIntoColumns(fields);

      expect(result).toHaveLength(2);
      expect(result[0].map(f => f.fieldName)).toEqual(['FIELD1', 'FIELD2']);
      expect(result[1].map(f => f.fieldName)).toEqual(['FIELD3']);
    });
  });
});
