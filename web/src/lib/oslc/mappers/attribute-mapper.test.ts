import { describe, it, expect } from 'vitest';
import { mapAttributeToAttrDef, mapAttributesToAddAttributesOp } from './attribute-mapper';
import type { OslcMaxAttribute } from '../types';

describe('mapAttributeToAttrDef', () => {
  it('should map basic attribute fields', () => {
    const attr: OslcMaxAttribute = {
      attributename: 'WONUM',
      objectname: 'WORKORDER',
      maxtype: 'ALN',
      length: 20,
      title: 'Work Order Number',
      remarks: 'The work order number',
      required: true,
      searchtype: 'WILDCARD',
    };

    const result = mapAttributeToAttrDef(attr);
    expect(result.attribute).toBe('WONUM');
    expect(result.maxtype).toBe('ALN');
    expect(result.length).toBe(20);
    expect(result.title).toBe('Work Order Number');
    expect(result.remarks).toBe('The work order number');
    expect(result.required).toBe(true);
    expect(result.searchtype).toBe('WILDCARD');
  });

  it('should map domain reference', () => {
    const attr: OslcMaxAttribute = {
      attributename: 'STATUS',
      objectname: 'WORKORDER',
      maxtype: 'ALN',
      length: 16,
      domainid: 'WOSTATUS',
      title: 'Status',
      remarks: 'Work order status',
    };

    const result = mapAttributeToAttrDef(attr);
    expect(result.domain).toBe('WOSTATUS');
  });

  it('should map scale for numeric types', () => {
    const attr: OslcMaxAttribute = {
      attributename: 'TOTALCOST',
      objectname: 'WORKORDER',
      maxtype: 'AMOUNT',
      length: 10,
      scale: 2,
      title: 'Total Cost',
      remarks: 'Total cost',
    };

    const result = mapAttributeToAttrDef(attr);
    expect(result.maxtype).toBe('AMOUNT');
    expect(result.scale).toBe(2);
  });

  it('should map sameas fields', () => {
    const attr: OslcMaxAttribute = {
      attributename: 'SITEID',
      objectname: 'WORKORDER',
      sameasobject: 'SITE',
      sameasattribute: 'SITEID',
      title: 'Site',
      remarks: 'Site ID',
    };

    const result = mapAttributeToAttrDef(attr);
    expect(result.sameasobject).toBe('SITE');
    expect(result.sameasattribute).toBe('SITEID');
  });

  it('should use empty string for missing title/remarks', () => {
    const attr: OslcMaxAttribute = {
      attributename: 'FIELD1',
      objectname: 'WORKORDER',
    };

    const result = mapAttributeToAttrDef(attr);
    expect(result.title).toBe('');
    expect(result.remarks).toBe('');
  });

  it('should map persistent and userdefined flags', () => {
    const attr: OslcMaxAttribute = {
      attributename: 'CUSTOM1',
      objectname: 'WORKORDER',
      persistent: true,
      userdefined: true,
      title: 'Custom',
      remarks: 'Custom field',
    };

    const result = mapAttributeToAttrDef(attr);
    expect(result.persistent).toBe(true);
    expect(result.userdefined).toBe(true);
  });
});

describe('mapAttributesToAddAttributesOp', () => {
  it('should create AddAttributesOp with mapped attributes', () => {
    const attrs: OslcMaxAttribute[] = [
      {
        attributename: 'FIELD1',
        objectname: 'WORKORDER',
        maxtype: 'ALN',
        length: 50,
        title: 'Field 1',
        remarks: 'First field',
      },
      {
        attributename: 'FIELD2',
        objectname: 'WORKORDER',
        maxtype: 'INTEGER',
        title: 'Field 2',
        remarks: 'Second field',
      },
    ];

    const result = mapAttributesToAddAttributesOp('WORKORDER', attrs);
    expect(result.type).toBe('add_attributes');
    expect(result.object).toBe('WORKORDER');
    expect(result.attributes).toHaveLength(2);
    expect(result.attributes[0].attribute).toBe('FIELD1');
    expect(result.attributes[1].attribute).toBe('FIELD2');
  });

  it('should handle empty attributes array', () => {
    const result = mapAttributesToAddAttributesOp('WORKORDER', []);
    expect(result.attributes).toHaveLength(0);
  });
});
