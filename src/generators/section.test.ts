import { describe, it, expect } from 'vitest';
import { generateSection, generateSectionWithFields } from './section';
import type { ProcessedField } from '../types';

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
  });
});
