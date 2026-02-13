import { describe, it, expect } from 'vitest';
import { toMermaidErDiagram } from '@/lib/fmb/er-diagram-mermaid';
import type { ErDiagramData, ErEntity, ErRelationship } from '@/lib/fmb/er-diagram-types';

function makeData(overrides: Partial<ErDiagramData> = {}): ErDiagramData {
  return {
    entities: [],
    relationships: [],
    formName: 'TEST',
    showExternalRefs: false,
    ...overrides,
  };
}

function makeEntity(overrides: Partial<ErEntity> = {}): ErEntity {
  return {
    id: 'B1TEST',
    blockName: 'B1TEST',
    tableName: 'TEST_TABLE',
    entityType: 'header',
    fields: [],
    ...overrides,
  };
}

describe('toMermaidErDiagram', () => {
  it('generates valid erDiagram header', () => {
    const result = toMermaidErDiagram(makeData());
    expect(result).toMatch(/^erDiagram/);
  });

  it('includes entity with fields and PK/FK annotations', () => {
    const data = makeData({
      entities: [
        makeEntity({
          tableName: 'HDR_TABLE',
          fields: [
            { name: 'SLIP_NO', dataType: 'Char', fieldRole: 'pk' },
            { name: 'DEPT_CODE', dataType: 'Char', fieldRole: 'fk', lovName: 'LOV_DEPT' },
            { name: 'AMOUNT', dataType: 'Integer', fieldRole: 'required' },
          ],
        }),
      ],
    });

    const result = toMermaidErDiagram(data);

    expect(result).toContain('HDR_TABLE {');
    expect(result).toMatch(/Char\s+SLIP_NO\s+PK/);
    expect(result).toMatch(/Char\s+DEPT_CODE\s+FK/);
    expect(result).toMatch(/Integer\s+AMOUNT/);
  });

  it('renders 1:N relationship with cardinality notation', () => {
    const data = makeData({
      entities: [
        makeEntity({ id: 'B1HDR', tableName: 'PARENT' }),
        makeEntity({ id: 'B1DTL', tableName: 'CHILD', entityType: 'detail' }),
      ],
      relationships: [
        {
          id: 'rel-1',
          sourceEntityId: 'B1HDR',
          targetEntityId: 'B1DTL',
          cardinality: '1:N',
          lineStyle: 'solid',
        },
      ],
    });

    const result = toMermaidErDiagram(data);

    expect(result).toContain('PARENT ||--o{ CHILD');
  });

  it('excludes external entities when showExternalRefs is false', () => {
    const data = makeData({
      entities: [
        makeEntity({ id: 'B1HDR', tableName: 'HDR' }),
        makeEntity({ id: 'ext-DEPT', tableName: 'DEPT', entityType: 'external' }),
      ],
      relationships: [
        {
          id: 'lov-1',
          sourceEntityId: 'B1HDR',
          targetEntityId: 'ext-DEPT',
          cardinality: '1:N',
          lineStyle: 'dashed',
          label: 'LOV_DEPT',
        },
      ],
      showExternalRefs: false,
    });

    const result = toMermaidErDiagram(data);

    expect(result).not.toContain('DEPT');
    expect(result).not.toContain('LOV_DEPT');
  });

  it('includes external entities when showExternalRefs is true', () => {
    const data = makeData({
      entities: [
        makeEntity({ id: 'B1HDR', tableName: 'HDR' }),
        makeEntity({ id: 'ext-DEPT', tableName: 'DEPT', entityType: 'external' }),
      ],
      relationships: [
        {
          id: 'lov-1',
          sourceEntityId: 'B1HDR',
          targetEntityId: 'ext-DEPT',
          cardinality: '1:N',
          lineStyle: 'dashed',
          label: 'LOV_DEPT',
        },
      ],
      showExternalRefs: true,
    });

    const result = toMermaidErDiagram(data);

    expect(result).toContain('DEPT');
    expect(result).toContain('HDR ||..o{ DEPT');
  });

  it('uses dotted line notation for dashed relationships', () => {
    const data = makeData({
      entities: [
        makeEntity({ id: 'B1HDR', tableName: 'HDR' }),
        makeEntity({ id: 'ext-EXT', tableName: 'EXT', entityType: 'external' }),
      ],
      relationships: [
        {
          id: 'lov-1',
          sourceEntityId: 'B1HDR',
          targetEntityId: 'ext-EXT',
          cardinality: '1:N',
          lineStyle: 'dashed',
        },
      ],
      showExternalRefs: true,
    });

    const result = toMermaidErDiagram(data);

    // Mermaid uses ||..o{ for dotted lines
    expect(result).toContain('||..o{');
  });

  it('skips entity block if tableName is empty', () => {
    const data = makeData({
      entities: [
        makeEntity({ id: 'B1NODS', tableName: '' }),
      ],
    });

    const result = toMermaidErDiagram(data);

    // Should not have any entity definition blocks
    expect(result).not.toContain('{');
  });

  it('handles empty data gracefully', () => {
    const result = toMermaidErDiagram(makeData());

    expect(result.trim()).toBe('erDiagram');
  });
});
