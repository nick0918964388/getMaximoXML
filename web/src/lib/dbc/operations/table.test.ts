import { describe, it, expect } from 'vitest';
import { generateDefineTable, generateModifyTable, generateDropTable } from './table';
import type { DefineTableOp, ModifyTableOp, DropTableOp } from '../types';

describe('generateDefineTable', () => {
  it('should generate define_table with attributes', () => {
    const op: DefineTableOp = {
      type: 'define_table',
      object: 'MYOBJ',
      description: 'My custom object',
      service: 'ASSET',
      classname: 'psdi.mbo.custapp.CustomSet',
      tableType: 'system',
      attributes: [
        {
          attribute: 'MYOBJID',
          maxtype: 'BIGINT',
          title: 'ID',
          remarks: 'Unique ID',
          required: true,
        },
        {
          attribute: 'DESCRIPTION',
          maxtype: 'ALN',
          length: 100,
          title: 'Description',
          remarks: 'Description field',
        },
      ],
    };
    const xml = generateDefineTable(op);
    expect(xml).toContain('<define_table');
    expect(xml).toContain('object="MYOBJ"');
    expect(xml).toContain('description="My custom object"');
    expect(xml).toContain('service="ASSET"');
    expect(xml).toContain('type="system"');
    expect(xml).toContain('<attrdef');
    expect(xml).toContain('attribute="MYOBJID"');
    expect(xml).toContain('attribute="DESCRIPTION"');
    expect(xml).toContain('</define_table>');
  });

  it('should include optional attributes when set', () => {
    const op: DefineTableOp = {
      type: 'define_table',
      object: 'TEST',
      description: 'Test',
      service: 'SVC',
      classname: 'cls',
      tableType: 'site',
      persistent: false,
      primarykey: 'TESTID',
      mainobject: true,
      internal: true,
      trigroot: 'TST',
      storagetype: 'master',
      attributes: [
        { attribute: 'TESTID', title: 'ID', remarks: 'ID' },
      ],
    };
    const xml = generateDefineTable(op);
    expect(xml).toContain('persistent="false"');
    expect(xml).toContain('primarykey="TESTID"');
    expect(xml).toContain('mainobject="true"');
    expect(xml).toContain('internal="true"');
    expect(xml).toContain('trigroot="TST"');
    expect(xml).toContain('storagetype="master"');
  });
});

describe('generateModifyTable', () => {
  it('should generate modify_table', () => {
    const op: ModifyTableOp = {
      type: 'modify_table',
      name: 'MYTABLE',
      description: 'Updated desc',
      primarykey: 'NEWKEY',
    };
    const xml = generateModifyTable(op);
    expect(xml).toContain('<modify_table');
    expect(xml).toContain('name="MYTABLE"');
    expect(xml).toContain('description="Updated desc"');
    expect(xml).toContain('primarykey="NEWKEY"');
    expect(xml).toContain('/>');
  });
});

describe('generateDropTable', () => {
  it('should generate drop_table', () => {
    const op: DropTableOp = { type: 'drop_table', object: 'OLDTABLE' };
    const xml = generateDropTable(op);
    expect(xml).toContain('<drop_table object="OLDTABLE" />');
  });
});
