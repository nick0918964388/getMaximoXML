import { describe, it, expect } from 'vitest';
import { generateCreateRelationship, generateModifyRelationship, generateDropRelationship } from './relationship';

describe('generateCreateRelationship', () => {
  it('should generate create_relationship', () => {
    const xml = generateCreateRelationship({
      type: 'create_relationship',
      parent: 'WORKORDER',
      name: 'WOACTIVITY',
      child: 'WOACTIVITY',
      whereclause: 'wonum=:wonum and siteid=:siteid',
      remarks: 'WO to Activity',
    });
    expect(xml).toContain('<create_relationship');
    expect(xml).toContain('parent="WORKORDER"');
    expect(xml).toContain('name="WOACTIVITY"');
    expect(xml).toContain('child="WOACTIVITY"');
    expect(xml).toContain('whereclause="wonum=:wonum and siteid=:siteid"');
    expect(xml).toContain('remarks="WO to Activity"');
    expect(xml).toContain('/>');
  });
});

describe('generateModifyRelationship', () => {
  it('should generate modify_relationship with optional fields', () => {
    const xml = generateModifyRelationship({
      type: 'modify_relationship',
      parent: 'WORKORDER',
      name: 'WOACTIVITY',
      remarks: 'Updated remarks',
    });
    expect(xml).toContain('parent="WORKORDER"');
    expect(xml).toContain('name="WOACTIVITY"');
    expect(xml).toContain('remarks="Updated remarks"');
    expect(xml).not.toContain('child=');
  });
});

describe('generateDropRelationship', () => {
  it('should generate drop_relationship', () => {
    const xml = generateDropRelationship({
      type: 'drop_relationship',
      parent: 'WORKORDER',
      name: 'WOACTIVITY',
    });
    expect(xml).toContain('<drop_relationship parent="WORKORDER" name="WOACTIVITY" />');
  });
});
