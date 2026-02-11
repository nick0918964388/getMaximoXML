import { describe, it, expect } from 'vitest';
import { mapRelationshipToDbcOp } from './relationship-mapper';
import type { OslcMaxRelationship } from '../types';

describe('mapRelationshipToDbcOp', () => {
  it('should map relationship to CreateRelationshipOp', () => {
    const rel: OslcMaxRelationship = {
      name: 'ASSET',
      parent: 'WORKORDER',
      child: 'ASSET',
      whereclause: 'assetnum = :assetnum and siteid = :siteid',
      remarks: 'Asset relationship',
    };

    const result = mapRelationshipToDbcOp(rel);
    expect(result.type).toBe('create_relationship');
    expect(result.name).toBe('ASSET');
    expect(result.parent).toBe('WORKORDER');
    expect(result.child).toBe('ASSET');
    expect(result.whereclause).toBe('assetnum = :assetnum and siteid = :siteid');
    expect(result.remarks).toBe('Asset relationship');
  });

  it('should use empty string for missing whereclause and remarks', () => {
    const rel: OslcMaxRelationship = {
      name: 'TESTREL',
      parent: 'PARENT',
      child: 'CHILD',
    };

    const result = mapRelationshipToDbcOp(rel);
    expect(result.whereclause).toBe('');
    expect(result.remarks).toBe('');
  });
});
