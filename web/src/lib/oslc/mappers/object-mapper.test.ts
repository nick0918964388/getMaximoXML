import { describe, it, expect } from 'vitest';
import { mapObjectToDefineTable } from './object-mapper';
import type { OslcMaxObject, OslcMaxAttribute } from '../types';

describe('mapObjectToDefineTable', () => {
  it('should map basic object to DefineTableOp', () => {
    const obj: OslcMaxObject = {
      objectname: 'CUSTOMOBJ',
      description: 'Custom Object',
      classname: 'psdi.mbo.custapp.CustomObjSet',
      servicename: 'CUSTAPP',
      type: 'system',
      persistent: true,
    };
    const attrs: OslcMaxAttribute[] = [
      {
        attributename: 'FIELD1',
        objectname: 'CUSTOMOBJ',
        maxtype: 'ALN',
        length: 50,
        title: 'Field 1',
        remarks: 'First field',
      },
    ];

    const result = mapObjectToDefineTable(obj, attrs);
    expect(result.type).toBe('define_table');
    expect(result.object).toBe('CUSTOMOBJ');
    expect(result.description).toBe('Custom Object');
    expect(result.classname).toBe('psdi.mbo.custapp.CustomObjSet');
    expect(result.service).toBe('CUSTAPP');
    expect(result.tableType).toBe('system');
    expect(result.persistent).toBe(true);
    expect(result.attributes).toHaveLength(1);
    expect(result.attributes[0].attribute).toBe('FIELD1');
  });

  it('should default tableType to system when type missing', () => {
    const obj: OslcMaxObject = {
      objectname: 'TESTOBJ',
      description: 'Test',
      classname: 'test.Class',
      servicename: 'SVC',
    };

    const result = mapObjectToDefineTable(obj, []);
    expect(result.tableType).toBe('system');
  });

  it('should map storagetype', () => {
    const obj: OslcMaxObject = {
      objectname: 'TESTOBJ',
      description: 'Test',
      classname: 'test.Class',
      servicename: 'SVC',
      storagetype: 'tenant',
    };

    const result = mapObjectToDefineTable(obj, []);
    expect(result.storagetype).toBe('tenant');
  });

  it('should map primarykey and internal flags', () => {
    const obj: OslcMaxObject = {
      objectname: 'TESTOBJ',
      description: 'Test',
      classname: 'test.Class',
      servicename: 'SVC',
      primarykey: 'TESTOBJID',
      internal: true,
    };

    const result = mapObjectToDefineTable(obj, []);
    expect(result.primarykey).toBe('TESTOBJID');
    expect(result.internal).toBe(true);
  });

  it('should use empty strings for missing description/classname/service', () => {
    const obj: OslcMaxObject = {
      objectname: 'TESTOBJ',
    };

    const result = mapObjectToDefineTable(obj, []);
    expect(result.description).toBe('');
    expect(result.classname).toBe('');
    expect(result.service).toBe('');
  });
});
