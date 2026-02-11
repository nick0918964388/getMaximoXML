import type { SpecifyIndexOp } from '@/lib/dbc/types';
import type { OslcMaxIndex } from '../types';

/**
 * Map an OSLC index to a SpecifyIndexOp
 */
export function mapIndexToDbcOp(idx: OslcMaxIndex): SpecifyIndexOp {
  const sortedKeys = [...idx.keys].sort((a, b) => a.colseq - b.colseq);

  return {
    type: 'specify_index',
    name: idx.name,
    object: idx.tbname,
    unique: idx.uniquerule,
    clustered: idx.clusterrule,
    keys: sortedKeys.map((k) => ({
      column: k.colname,
      ascending: k.ascending,
    })),
  };
}
