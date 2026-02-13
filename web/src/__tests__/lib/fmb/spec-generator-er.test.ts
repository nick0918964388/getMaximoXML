import { describe, it, expect } from 'vitest';
import { generateMarkdownSpec, type FormSpec } from '@/lib/fmb/spec-generator';
import type { TriggerSectionSpec } from '@/lib/fmb/trigger-types';

const emptyTriggers: TriggerSectionSpec = {
  statistics: { totalCount: 0, formLevelCount: 0, blockLevelCount: 0 },
  formTriggers: [],
  blockTriggers: [],
};

function makeSpec(overrides: Partial<FormSpec> = {}): FormSpec {
  return {
    formName: 'TEST_FORM',
    formTitle: 'Test Form',
    functionDescription: '',
    blocks: [],
    buttons: [],
    lovs: [],
    recordGroups: [],
    triggers: emptyTriggers,
    tabPages: [],
    ...overrides,
  };
}

describe('generateMarkdownSpec - ER Diagram section', () => {
  it('includes Mermaid erDiagram code block when blocks have relationships', () => {
    const spec = makeSpec({
      blocks: [
        {
          name: 'B1HDR', baseTable: 'PARENT', whereCondition: '', orderByClause: '',
          insertAllowed: true, updateAllowed: true, deleteAllowed: true,
          fields: [
            {
              no: 1, prompt: 'No', dbColumn: 'SLIP_NO', displayed: true,
              dataType: 'Char', required: true, caseRestriction: 'Mixed',
              lovName: '', formatMask: '', updateAllowed: true,
              initialValue: '', remark: '', tabPage: '',
            },
          ],
        },
        {
          name: 'B1DTL', baseTable: 'CHILD', whereCondition: '', orderByClause: '',
          insertAllowed: true, updateAllowed: true, deleteAllowed: true,
          fields: [
            {
              no: 1, prompt: 'Line', dbColumn: 'LINE_NO', displayed: true,
              dataType: 'Integer', required: true, caseRestriction: 'Mixed',
              lovName: '', formatMask: '', updateAllowed: true,
              initialValue: '', remark: '', tabPage: 'TAB1',
            },
          ],
        },
      ],
    });

    const markdown = generateMarkdownSpec(spec);

    expect(markdown).toContain('## ER Diagram 實體關聯圖');
    expect(markdown).toContain('```mermaid');
    expect(markdown).toContain('erDiagram');
    expect(markdown).toContain('PARENT');
    expect(markdown).toContain('CHILD');
    expect(markdown).toContain('||--o{');
  });

  it('includes empty state note when no blocks exist', () => {
    const spec = makeSpec({ blocks: [] });

    const markdown = generateMarkdownSpec(spec);

    expect(markdown).toContain('## ER Diagram 實體關聯圖');
    expect(markdown).toContain('無可繪製的實體資料');
  });

  it('includes entity fields with PK annotations in Mermaid syntax', () => {
    const spec = makeSpec({
      blocks: [
        {
          name: 'B1HDR', baseTable: 'MY_TABLE', whereCondition: '', orderByClause: '',
          insertAllowed: true, updateAllowed: true, deleteAllowed: true,
          fields: [
            {
              no: 1, prompt: 'ID', dbColumn: 'RECORD_ID', displayed: true,
              dataType: 'Integer', required: true, caseRestriction: 'Mixed',
              lovName: '', formatMask: '', updateAllowed: true,
              initialValue: '', remark: '', tabPage: '',
            },
          ],
        },
      ],
    });

    const markdown = generateMarkdownSpec(spec);

    expect(markdown).toContain('MY_TABLE {');
    expect(markdown).toMatch(/Integer\s+RECORD_ID\s+PK/);
  });
});
