import { describe, it, expect } from 'vitest';
import { generateSpecifyIndex, generateDropIndex } from './index-op';

describe('generateSpecifyIndex', () => {
  it('should generate specify_index with keys', () => {
    const xml = generateSpecifyIndex({
      type: 'specify_index',
      name: 'MYOBJ_NDX1',
      object: 'MYOBJ',
      unique: true,
      keys: [
        { column: 'SITEID', ascending: true },
        { column: 'MYOBJID', ascending: true },
      ],
    });
    expect(xml).toContain('<specify_index');
    expect(xml).toContain('name="MYOBJ_NDX1"');
    expect(xml).toContain('object="MYOBJ"');
    expect(xml).toContain('unique="true"');
    expect(xml).toContain('<indexkey column="SITEID"');
    expect(xml).toContain('<indexkey column="MYOBJID"');
    expect(xml).toContain('</specify_index>');
  });
});

describe('generateDropIndex', () => {
  it('should generate drop_index by name', () => {
    const xml = generateDropIndex({
      type: 'drop_index',
      name: 'MYOBJ_NDX1',
      object: 'MYOBJ',
    });
    expect(xml).toContain('<drop_index');
    expect(xml).toContain('name="MYOBJ_NDX1"');
    expect(xml).toContain('object="MYOBJ"');
  });

  it('should generate drop_index with keys', () => {
    const xml = generateDropIndex({
      type: 'drop_index',
      object: 'MYOBJ',
      keys: [{ column: 'SITEID' }],
    });
    expect(xml).toContain('<drop_index');
    expect(xml).toContain('<indexkey column="SITEID"');
    expect(xml).toContain('</drop_index>');
  });
});
