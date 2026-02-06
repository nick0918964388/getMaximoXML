import { describe, it, expect } from 'vitest';
import { generateInsert, generateFreeform } from './data';

describe('generateInsert', () => {
  it('should generate insert with rows and column values', () => {
    const xml = generateInsert({
      type: 'insert',
      table: 'MAXVARS',
      ignore_duplicates: true,
      rows: [
        {
          columns: [
            { column: 'VARNAME', string: 'MYVAR' },
            { column: 'VARVALUE', string: 'MYVAL' },
          ],
        },
        {
          columns: [
            { column: 'VARNAME', string: 'MYVAR2' },
            { column: 'ENABLED', boolean: true },
            { column: 'SEQ', number: '1' },
          ],
        },
      ],
    });
    expect(xml).toContain('<insert table="MAXVARS"');
    expect(xml).toContain('ignore_duplicates="true"');
    expect(xml).toContain('<insertrow>');
    expect(xml).toContain('<columnvalue column="VARNAME" string="MYVAR" />');
    expect(xml).toContain('boolean="true"');
    expect(xml).toContain('number="1"');
    expect(xml).toContain('</insertrow>');
    expect(xml).toContain('</insert>');
  });

  it('should support fromcolumn', () => {
    const xml = generateInsert({
      type: 'insert',
      table: 'TARGET',
      selectfrom: 'SOURCE',
      selectwhere: 'status = 1',
      rows: [{ columns: [{ column: 'COL1', fromcolumn: 'SRCCOL1' }] }],
    });
    expect(xml).toContain('selectfrom="SOURCE"');
    expect(xml).toContain('selectwhere="status = 1"');
    expect(xml).toContain('fromcolumn="SRCCOL1"');
  });
});

describe('generateFreeform', () => {
  it('should generate freeform with sql statements', () => {
    const xml = generateFreeform({
      type: 'freeform',
      description: 'Update data',
      statements: [
        { sql: "UPDATE WORKORDER SET STATUS = 'CLOSE' WHERE WONUM = '1001'" },
      ],
    });
    expect(xml).toContain('<freeform description="Update data">');
    expect(xml).toContain('<sql target="all">');
    expect(xml).toContain('</sql>');
    expect(xml).toContain('</freeform>');
  });

  it('should support target-specific SQL', () => {
    const xml = generateFreeform({
      type: 'freeform',
      description: 'DB specific',
      statements: [
        { target: 'oracle', sql: 'SELECT SYSDATE FROM DUAL' },
        { target: 'sqlserver', sql: 'SELECT GETDATE()' },
      ],
    });
    expect(xml).toContain('target="oracle"');
    expect(xml).toContain('target="sqlserver"');
  });
});
