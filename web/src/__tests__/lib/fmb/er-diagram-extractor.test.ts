import { describe, it, expect } from 'vitest';
import { extractErDiagram } from '@/lib/fmb/er-diagram-extractor';
import type { FormSpec, BlockSpec, FieldSpec, LovSpec, RecordGroupSpec } from '@/lib/fmb/spec-generator';
import type { TriggerSectionSpec } from '@/lib/fmb/trigger-types';

// Helper to create a minimal FormSpec
function makeSpec(overrides: Partial<FormSpec> = {}): FormSpec {
  const emptyTriggers: TriggerSectionSpec = {
    statistics: { totalCount: 0, formLevelCount: 0, blockLevelCount: 0 },
    formTriggers: [],
    blockTriggers: [],
  };
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

function makeBlock(overrides: Partial<BlockSpec> = {}): BlockSpec {
  return {
    name: 'B1TEST',
    baseTable: 'TEST_TABLE',
    whereCondition: '',
    orderByClause: '',
    insertAllowed: true,
    updateAllowed: true,
    deleteAllowed: true,
    fields: [],
    ...overrides,
  };
}

function makeField(overrides: Partial<FieldSpec> = {}): FieldSpec {
  return {
    no: 1,
    prompt: 'Field',
    dbColumn: 'FIELD1',
    displayed: true,
    dataType: 'Char',
    required: false,
    caseRestriction: 'Mixed',
    lovName: '',
    formatMask: '',
    updateAllowed: true,
    initialValue: '',
    remark: '',
    tabPage: '',
    ...overrides,
  };
}

// ============================================================
// T003: Entity extraction tests
// ============================================================
describe('extractErDiagram - entity extraction', () => {
  it('extracts header entity from block on CANVAS_BODY (no tabPage)', () => {
    const spec = makeSpec({
      blocks: [
        makeBlock({
          name: 'B1HEADER',
          baseTable: 'HEADER_TABLE',
          fields: [
            makeField({ dbColumn: 'SLIP_NO', required: true }),
          ],
        }),
      ],
    });

    const result = extractErDiagram(spec);

    expect(result.entities).toHaveLength(1);
    expect(result.entities[0]).toMatchObject({
      id: 'B1HEADER',
      blockName: 'B1HEADER',
      tableName: 'HEADER_TABLE',
      entityType: 'header',
    });
  });

  it('classifies blocks with tabPage fields as detail entities', () => {
    const spec = makeSpec({
      blocks: [
        makeBlock({ name: 'B1HEADER', baseTable: 'HDR' }),
        makeBlock({
          name: 'B1DETAIL',
          baseTable: 'DTL',
          fields: [
            makeField({ dbColumn: 'LINE_NO', tabPage: 'TAB1', required: true }),
          ],
        }),
      ],
    });

    const result = extractErDiagram(spec);

    const detail = result.entities.find(e => e.id === 'B1DETAIL');
    expect(detail).toBeDefined();
    expect(detail!.entityType).toBe('detail');
  });

  it('first block without tabPage fields is classified as header', () => {
    const spec = makeSpec({
      blocks: [
        makeBlock({
          name: 'B1FIRST',
          baseTable: 'FIRST_TBL',
          fields: [makeField({ dbColumn: 'ID_NO', required: true })],
        }),
        makeBlock({
          name: 'B1SECOND',
          baseTable: 'SECOND_TBL',
          fields: [makeField({ dbColumn: 'LINE_NO', tabPage: 'TAB1', required: true })],
        }),
      ],
    });

    const result = extractErDiagram(spec);

    expect(result.entities.find(e => e.id === 'B1FIRST')!.entityType).toBe('header');
    expect(result.entities.find(e => e.id === 'B1SECOND')!.entityType).toBe('detail');
  });

  it('selects only key fields: required, FK (lovName), PK pattern (*_ID, *_NO, *_CODE)', () => {
    const spec = makeSpec({
      blocks: [
        makeBlock({
          name: 'B1BLOCK',
          baseTable: 'TBL',
          fields: [
            makeField({ no: 1, dbColumn: 'SLIP_NO', required: true }),
            makeField({ no: 2, dbColumn: 'DESCRIPTION', required: false }),
            makeField({ no: 3, dbColumn: 'SUPPLY_CODE', lovName: 'LOV_SUPPLY' }),
            makeField({ no: 4, dbColumn: 'HEADER_ID', required: false }),
            makeField({ no: 5, dbColumn: 'AMOUNT', required: false }),
            makeField({ no: 6, dbColumn: 'STATUS_CODE', required: false }),
          ],
        }),
      ],
    });

    const result = extractErDiagram(spec);
    const entity = result.entities[0];
    const fieldNames = entity.fields.map(f => f.name);

    // SLIP_NO: required → pk/required
    expect(fieldNames).toContain('SLIP_NO');
    // SUPPLY_CODE: has lovName → fk
    expect(fieldNames).toContain('SUPPLY_CODE');
    // HEADER_ID: matches *_ID pattern → pk
    expect(fieldNames).toContain('HEADER_ID');
    // STATUS_CODE: matches *_CODE pattern → pk
    expect(fieldNames).toContain('STATUS_CODE');
    // DESCRIPTION: not required, no lov, no PK pattern → excluded
    expect(fieldNames).not.toContain('DESCRIPTION');
    // AMOUNT: not required, no lov, no PK pattern → excluded
    expect(fieldNames).not.toContain('AMOUNT');
  });

  it('assigns correct fieldRole to selected fields', () => {
    const spec = makeSpec({
      blocks: [
        makeBlock({
          name: 'B1BLOCK',
          baseTable: 'TBL',
          fields: [
            makeField({ dbColumn: 'SLIP_NO', required: true }),
            makeField({ dbColumn: 'SUPPLY_CODE', lovName: 'LOV_SUPPLY' }),
            makeField({ dbColumn: 'HEADER_ID', required: false }),
          ],
        }),
      ],
    });

    const result = extractErDiagram(spec);
    const entity = result.entities[0];

    const slipNo = entity.fields.find(f => f.name === 'SLIP_NO');
    expect(slipNo!.fieldRole).toBe('pk');

    const supplyCode = entity.fields.find(f => f.name === 'SUPPLY_CODE');
    expect(supplyCode!.fieldRole).toBe('fk');
    expect(supplyCode!.lovName).toBe('LOV_SUPPLY');

    const headerId = entity.fields.find(f => f.name === 'HEADER_ID');
    expect(headerId!.fieldRole).toBe('pk');
  });

  it('skips blocks with empty baseTable but still includes them', () => {
    const spec = makeSpec({
      blocks: [
        makeBlock({ name: 'B1NODS', baseTable: '', fields: [makeField({ dbColumn: 'X', required: true })] }),
      ],
    });

    const result = extractErDiagram(spec);

    expect(result.entities).toHaveLength(1);
    expect(result.entities[0].tableName).toBe('');
  });

  it('returns empty entities for spec with no blocks', () => {
    const spec = makeSpec({ blocks: [] });

    const result = extractErDiagram(spec);

    expect(result.entities).toHaveLength(0);
    expect(result.relationships).toHaveLength(0);
  });

  it('sets formName from spec', () => {
    const spec = makeSpec({ formName: 'ODPCS126' });

    const result = extractErDiagram(spec);

    expect(result.formName).toBe('ODPCS126');
  });

  it('defaults showExternalRefs to false', () => {
    const spec = makeSpec();

    const result = extractErDiagram(spec);

    expect(result.showExternalRefs).toBe(false);
  });
});

// ============================================================
// T004: Relationship extraction tests
// ============================================================
describe('extractErDiagram - relationship extraction', () => {
  it('creates 1:N solid relationship from header to each detail block', () => {
    const spec = makeSpec({
      blocks: [
        makeBlock({ name: 'B1HDR', baseTable: 'HDR_TBL' }),
        makeBlock({
          name: 'B1DTL1',
          baseTable: 'DTL1_TBL',
          fields: [makeField({ dbColumn: 'LINE_NO', tabPage: 'TAB1', required: true })],
        }),
        makeBlock({
          name: 'B1DTL2',
          baseTable: 'DTL2_TBL',
          fields: [makeField({ dbColumn: 'LINE_NO', tabPage: 'TAB2', required: true })],
        }),
      ],
    });

    const result = extractErDiagram(spec);

    expect(result.relationships).toHaveLength(2);

    const rel1 = result.relationships.find(r => r.targetEntityId === 'B1DTL1');
    expect(rel1).toMatchObject({
      sourceEntityId: 'B1HDR',
      targetEntityId: 'B1DTL1',
      cardinality: '1:N',
      lineStyle: 'solid',
    });

    const rel2 = result.relationships.find(r => r.targetEntityId === 'B1DTL2');
    expect(rel2).toMatchObject({
      sourceEntityId: 'B1HDR',
      cardinality: '1:N',
      lineStyle: 'solid',
    });
  });

  it('creates no relationships when only one block exists', () => {
    const spec = makeSpec({
      blocks: [makeBlock({ name: 'B1ONLY', baseTable: 'TBL' })],
    });

    const result = extractErDiagram(spec);

    expect(result.relationships).toHaveLength(0);
  });

  it('extracts LOV external reference entities with dashed relationships', () => {
    const spec = makeSpec({
      blocks: [
        makeBlock({
          name: 'B1HDR',
          baseTable: 'HDR_TBL',
          fields: [
            makeField({ dbColumn: 'DEPT_CODE', lovName: 'LOV_DEPT' }),
          ],
        }),
      ],
      lovs: [
        {
          no: 1,
          name: 'LOV_DEPT',
          recordGroupName: 'RG_DEPT',
          recordGroupQuery: 'SELECT dept_code, dept_name FROM DEPARTMENT WHERE active = 1',
          columns: [{ columnName: 'DEPT_CODE', returnItem: 'B1HDR.DEPT_CODE' }],
        },
      ],
      recordGroups: [
        {
          no: 1,
          name: 'RG_DEPT',
          recordGroupType: 'Query',
          query: 'SELECT dept_code, dept_name FROM DEPARTMENT WHERE active = 1',
          columns: [],
        },
      ],
    });

    const result = extractErDiagram(spec);

    // External entity should be created
    const ext = result.entities.find(e => e.entityType === 'external');
    expect(ext).toBeDefined();
    expect(ext!.tableName).toBe('DEPARTMENT');

    // Dashed relationship should connect header to external
    const dashedRel = result.relationships.find(r => r.lineStyle === 'dashed');
    expect(dashedRel).toBeDefined();
    expect(dashedRel!.sourceEntityId).toBe('B1HDR');
    expect(dashedRel!.targetEntityId).toBe(ext!.id);
  });

  it('does not create external entity when SQL cannot be parsed', () => {
    const spec = makeSpec({
      blocks: [
        makeBlock({
          name: 'B1HDR',
          baseTable: 'HDR_TBL',
          fields: [
            makeField({ dbColumn: 'X', lovName: 'LOV_BAD' }),
          ],
        }),
      ],
      lovs: [
        {
          no: 1,
          name: 'LOV_BAD',
          recordGroupName: 'RG_BAD',
          recordGroupQuery: '',
          columns: [],
        },
      ],
    });

    const result = extractErDiagram(spec);

    const ext = result.entities.find(e => e.entityType === 'external');
    expect(ext).toBeUndefined();
  });

  it('does not duplicate external entities for same LOV table', () => {
    const spec = makeSpec({
      blocks: [
        makeBlock({
          name: 'B1HDR',
          baseTable: 'HDR_TBL',
          fields: [
            makeField({ dbColumn: 'A', lovName: 'LOV1' }),
            makeField({ dbColumn: 'B', lovName: 'LOV2' }),
          ],
        }),
      ],
      lovs: [
        {
          no: 1, name: 'LOV1', recordGroupName: 'RG1',
          recordGroupQuery: 'SELECT x FROM SHARED_TABLE',
          columns: [],
        },
        {
          no: 2, name: 'LOV2', recordGroupName: 'RG2',
          recordGroupQuery: 'SELECT y FROM SHARED_TABLE',
          columns: [],
        },
      ],
    });

    const result = extractErDiagram(spec);

    const exts = result.entities.filter(e => e.entityType === 'external');
    expect(exts).toHaveLength(1);
    expect(exts[0].tableName).toBe('SHARED_TABLE');
  });

  it('handles multiple detail blocks referencing same parent', () => {
    const spec = makeSpec({
      blocks: [
        makeBlock({ name: 'B1HDR', baseTable: 'PARENT' }),
        makeBlock({
          name: 'B1D1', baseTable: 'CHILD1',
          fields: [makeField({ dbColumn: 'LINE_NO', tabPage: 'T1', required: true })],
        }),
        makeBlock({
          name: 'B1D2', baseTable: 'CHILD2',
          fields: [makeField({ dbColumn: 'LINE_NO', tabPage: 'T2', required: true })],
        }),
        makeBlock({
          name: 'B1D3', baseTable: 'CHILD3',
          fields: [makeField({ dbColumn: 'LINE_NO', tabPage: 'T3', required: true })],
        }),
      ],
    });

    const result = extractErDiagram(spec);

    const solidRels = result.relationships.filter(r => r.lineStyle === 'solid');
    expect(solidRels).toHaveLength(3);
    // All should reference B1HDR as source
    solidRels.forEach(r => expect(r.sourceEntityId).toBe('B1HDR'));
  });
});
