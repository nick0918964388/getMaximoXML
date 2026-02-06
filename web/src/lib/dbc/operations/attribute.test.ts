import { describe, it, expect } from 'vitest';
import { generateAddAttributes, generateModifyAttribute, generateDropAttributes } from './attribute';
import type { AddAttributesOp, ModifyAttributeOp, DropAttributesOp } from '../types';

describe('generateAddAttributes', () => {
  it('should generate add_attributes with attrdefs', () => {
    const op: AddAttributesOp = {
      type: 'add_attributes',
      object: 'WORKORDER',
      attributes: [
        { attribute: 'CUSTOM1', maxtype: 'ALN', length: 50, title: 'Custom 1', remarks: 'Custom field' },
        { attribute: 'CUSTOM2', maxtype: 'YORN', title: 'Flag', remarks: 'Boolean flag' },
      ],
    };
    const xml = generateAddAttributes(op);
    expect(xml).toContain('<add_attributes object="WORKORDER">');
    expect(xml).toContain('attribute="CUSTOM1"');
    expect(xml).toContain('attribute="CUSTOM2"');
    expect(xml).toContain('</add_attributes>');
  });
});

describe('generateModifyAttribute', () => {
  it('should generate modify_attribute', () => {
    const op: ModifyAttributeOp = {
      type: 'modify_attribute',
      object: 'WORKORDER',
      attribute: 'DESCRIPTION',
      length: 200,
      required: true,
    };
    const xml = generateModifyAttribute(op);
    expect(xml).toContain('<modify_attribute');
    expect(xml).toContain('object="WORKORDER"');
    expect(xml).toContain('attribute="DESCRIPTION"');
    expect(xml).toContain('length="200"');
    expect(xml).toContain('required="true"');
    expect(xml).toContain('/>');
  });
});

describe('generateDropAttributes', () => {
  it('should generate drop_attributes with attrnames', () => {
    const op: DropAttributesOp = {
      type: 'drop_attributes',
      object: 'WORKORDER',
      attributes: [{ name: 'CUSTOM1' }, { name: 'CUSTOM2' }],
    };
    const xml = generateDropAttributes(op);
    expect(xml).toContain('<drop_attributes object="WORKORDER">');
    expect(xml).toContain('<attrname name="CUSTOM1" />');
    expect(xml).toContain('<attrname name="CUSTOM2" />');
    expect(xml).toContain('</drop_attributes>');
  });
});
