import { describe, it, expect, vi } from 'vitest';
import { extractErDiagram } from '@/lib/fmb/er-diagram-extractor';
import type { FormSpec } from '@/lib/fmb/spec-generator';
import type { TriggerSectionSpec } from '@/lib/fmb/trigger-types';

// Test the extraction + data transformation logic used by the component
// (ReactFlow rendering is not testable in jsdom, so we test the data layer)

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

describe('ER Diagram Section - data layer', () => {
  it('returns empty entities for spec with no blocks (empty state)', () => {
    const spec = makeSpec({ blocks: [] });
    const data = extractErDiagram(spec);

    expect(data.entities).toHaveLength(0);
    expect(data.relationships).toHaveLength(0);
  });

  it('handles block without queryDataSource (no data source badge)', () => {
    const spec = makeSpec({
      blocks: [
        {
          name: 'B1NODS',
          baseTable: '',
          whereCondition: '',
          orderByClause: '',
          insertAllowed: true,
          updateAllowed: true,
          deleteAllowed: true,
          fields: [
            {
              no: 1, prompt: 'X', dbColumn: 'FIELD_ID', displayed: true,
              dataType: 'Char', required: false, caseRestriction: 'Mixed',
              lovName: '', formatMask: '', updateAllowed: true,
              initialValue: '', remark: '', tabPage: '',
            },
          ],
        },
      ],
    });

    const data = extractErDiagram(spec);

    expect(data.entities).toHaveLength(1);
    expect(data.entities[0].tableName).toBe('');
    // Component should display "無資料來源" badge for this entity
  });

  it('showExternalRefs defaults to false', () => {
    const spec = makeSpec();
    const data = extractErDiagram(spec);

    expect(data.showExternalRefs).toBe(false);
  });

  it('provides toggle-ready data: external entities present but filtered', () => {
    const spec = makeSpec({
      blocks: [
        {
          name: 'B1HDR', baseTable: 'HDR_TBL', whereCondition: '', orderByClause: '',
          insertAllowed: true, updateAllowed: true, deleteAllowed: true,
          fields: [
            {
              no: 1, prompt: '', dbColumn: 'DEPT_CODE', displayed: true,
              dataType: 'Char', required: false, caseRestriction: 'Mixed',
              lovName: 'LOV_DEPT', formatMask: '', updateAllowed: true,
              initialValue: '', remark: '', tabPage: '',
            },
          ],
        },
      ],
      lovs: [
        {
          no: 1, name: 'LOV_DEPT', recordGroupName: 'RG_DEPT',
          recordGroupQuery: 'SELECT dept_code FROM DEPARTMENT',
          columns: [],
        },
      ],
    });

    const data = extractErDiagram(spec);

    // External entities are extracted but showExternalRefs is false
    const externals = data.entities.filter(e => e.entityType === 'external');
    expect(externals).toHaveLength(1);
    expect(data.showExternalRefs).toBe(false);
    // Component will filter externals based on showExternalRefs toggle
  });
});
