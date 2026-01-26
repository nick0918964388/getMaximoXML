import { describe, it, expect, beforeEach } from 'vitest';
import { generateTable } from './table';
import { ProcessedField, DEFAULT_FIELD } from '../types';
import { resetIdGenerator } from '../utils/id-generator';

describe('table generator', () => {
  beforeEach(() => {
    resetIdGenerator();
  });

  const createProcessedField = (overrides: Partial<ProcessedField> = {}): ProcessedField => ({
    ...DEFAULT_FIELD,
    id: '12345001',
    dataattribute: 'TEST_FIELD',
    ...overrides,
  });

  describe('generateTable', () => {
    it('should generate basic table with tablecol fields', () => {
      const fields = [
        createProcessedField({ dataattribute: 'FIELD1', label: 'Field 1' }),
        createProcessedField({ dataattribute: 'FIELD2', label: 'Field 2' }),
      ];

      const result = generateTable(fields, 'WORKLOG', 'Work Log');

      expect(result).toContain('<table');
      expect(result).toContain('relationship="WORKLOG"');
      expect(result).toContain('label="Work Log"');
      expect(result).toContain('<tablebody');
      expect(result).toContain('</tablebody>');
      expect(result).toContain('dataattribute="FIELD1"');
      expect(result).toContain('dataattribute="FIELD2"');
    });

    it('should generate table with orderby and beanclass', () => {
      const fields = [
        createProcessedField({ dataattribute: 'LOGTYPE', label: 'Log Type' }),
      ];

      const result = generateTable(fields, 'WORKLOG', 'Work Log', 'CREATEDATE DESC', 'psdi.webclient.beans.WorklogBean');

      expect(result).toContain('orderby="CREATEDATE DESC"');
      expect(result).toContain('beanclass="psdi.webclient.beans.WorklogBean"');
    });

    it('should place pushbutton fields in buttongroup outside tablebody', () => {
      const fields = [
        createProcessedField({ dataattribute: 'FIELD1', label: 'Field 1', type: 'textbox' }),
        createProcessedField({ dataattribute: 'FIELD2', label: 'Field 2', type: 'textbox' }),
        createProcessedField({ label: 'Search', type: 'pushbutton', mxevent: 'dialogok' }),
        createProcessedField({ label: 'Cancel', type: 'pushbutton', mxevent: 'dialogcancel' }),
      ];

      const result = generateTable(fields, 'ALTITEM', 'Alt Items');

      // tablebody should contain only tablecol elements
      expect(result).toContain('<tablebody');
      expect(result).toContain('dataattribute="FIELD1"');
      expect(result).toContain('dataattribute="FIELD2"');

      // buttongroup should be outside tablebody but inside table
      expect(result).toContain('<buttongroup');
      expect(result).toContain('</buttongroup>');
      expect(result).toContain('<pushbutton');
      expect(result).toContain('label="Search"');
      expect(result).toContain('mxevent="dialogok"');
      expect(result).toContain('label="Cancel"');
      expect(result).toContain('mxevent="dialogcancel"');

      // buttongroup should come after tablebody (verify structure)
      const tablebodyEnd = result.indexOf('</tablebody>');
      const buttongroupStart = result.indexOf('<buttongroup');
      expect(buttongroupStart).toBeGreaterThan(tablebodyEnd);
    });

    it('should not generate buttongroup when no pushbutton fields', () => {
      const fields = [
        createProcessedField({ dataattribute: 'FIELD1', label: 'Field 1', type: 'textbox' }),
      ];

      const result = generateTable(fields, 'WORKLOG', 'Work Log');

      expect(result).not.toContain('<buttongroup');
      expect(result).not.toContain('<pushbutton');
    });

    it('should mark first pushbutton as default when it has dialogok event', () => {
      const fields = [
        createProcessedField({ label: 'Search', type: 'pushbutton', mxevent: 'dialogok' }),
        createProcessedField({ label: 'Cancel', type: 'pushbutton', mxevent: 'dialogcancel' }),
      ];

      const result = generateTable(fields, 'ALTITEM', 'Alt Items');

      expect(result).toContain('default="true"');
    });

    it('should handle table with only pushbutton fields', () => {
      const fields = [
        createProcessedField({ label: 'Search', type: 'pushbutton', mxevent: 'dialogok' }),
        createProcessedField({ label: 'Cancel', type: 'pushbutton', mxevent: 'dialogcancel' }),
      ];

      const result = generateTable(fields, 'ALTITEM', 'Alt Items');

      // Should have table structure
      expect(result).toContain('<table');
      expect(result).toContain('</table>');

      // Should have tablebody even if empty of tablecols
      expect(result).toContain('<tablebody');
      expect(result).toContain('</tablebody>');

      // Should have buttongroup
      expect(result).toContain('<buttongroup');
      expect(result).toContain('</buttongroup>');
    });
  });
});
