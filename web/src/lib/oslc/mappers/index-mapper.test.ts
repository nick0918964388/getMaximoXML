import { describe, it, expect } from 'vitest';
import { mapIndexToDbcOp } from './index-mapper';
import type { OslcMaxIndex } from '../types';

describe('mapIndexToDbcOp', () => {
  it('should map index to SpecifyIndexOp', () => {
    const idx: OslcMaxIndex = {
      name: 'WO_IDX1',
      tbname: 'WORKORDER',
      uniquerule: true,
      keys: [
        { colname: 'WONUM', ascending: true, colseq: 1 },
        { colname: 'SITEID', ascending: true, colseq: 2 },
      ],
    };

    const result = mapIndexToDbcOp(idx);
    expect(result.type).toBe('specify_index');
    expect(result.name).toBe('WO_IDX1');
    expect(result.object).toBe('WORKORDER');
    expect(result.unique).toBe(true);
    expect(result.keys).toHaveLength(2);
    expect(result.keys[0].column).toBe('WONUM');
    expect(result.keys[1].column).toBe('SITEID');
  });

  it('should sort keys by colseq', () => {
    const idx: OslcMaxIndex = {
      name: 'TEST_IDX',
      tbname: 'TEST',
      keys: [
        { colname: 'COL_B', ascending: true, colseq: 3 },
        { colname: 'COL_A', ascending: true, colseq: 1 },
        { colname: 'COL_C', ascending: false, colseq: 2 },
      ],
    };

    const result = mapIndexToDbcOp(idx);
    expect(result.keys[0].column).toBe('COL_A');
    expect(result.keys[1].column).toBe('COL_C');
    expect(result.keys[1].ascending).toBe(false);
    expect(result.keys[2].column).toBe('COL_B');
  });

  it('should map clustered index', () => {
    const idx: OslcMaxIndex = {
      name: 'CLUST_IDX',
      tbname: 'TABLE1',
      clusterrule: true,
      keys: [{ colname: 'ID', ascending: true, colseq: 1 }],
    };

    const result = mapIndexToDbcOp(idx);
    expect(result.clustered).toBe(true);
  });

  it('should handle empty keys array', () => {
    const idx: OslcMaxIndex = {
      name: 'EMPTY_IDX',
      tbname: 'TABLE1',
      keys: [],
    };

    const result = mapIndexToDbcOp(idx);
    expect(result.keys).toHaveLength(0);
  });
});
