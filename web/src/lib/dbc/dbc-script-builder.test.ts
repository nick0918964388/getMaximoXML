import { describe, it, expect } from 'vitest';
import { buildDbcScript } from './dbc-script-builder';
import type { DbcBuilderState } from './types';

describe('buildDbcScript', () => {
  it('should build a minimal script with no operations', () => {
    const state: DbcBuilderState = {
      script: { author: 'ADMIN', scriptname: 'V1000_01' },
      checks: [],
      operations: [],
      selectedId: null,
    };
    const xml = buildDbcScript(state);
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<script author="ADMIN" scriptname="V1000_01">');
    expect(xml).toContain('<statements>');
    expect(xml).toContain('</statements>');
    expect(xml).toContain('</script>');
  });

  it('should include description when provided', () => {
    const state: DbcBuilderState = {
      script: { author: 'ADMIN', scriptname: 'V1000_01', description: 'My script' },
      checks: [],
      operations: [],
      selectedId: null,
    };
    const xml = buildDbcScript(state);
    expect(xml).toContain('<description>My script</description>');
  });

  it('should include optional script attributes', () => {
    const state: DbcBuilderState = {
      script: {
        author: 'ADMIN',
        scriptname: 'V1000_01',
        for_demo_only: true,
        context: 'all',
        tenantcode: 'T1',
      },
      checks: [],
      operations: [],
      selectedId: null,
    };
    const xml = buildDbcScript(state);
    expect(xml).toContain('for_demo_only="true"');
    expect(xml).toContain('context="all"');
    expect(xml).toContain('tenantcode="T1"');
  });

  it('should include checks before statements', () => {
    const state: DbcBuilderState = {
      script: { author: 'ADMIN', scriptname: 'V1000_01' },
      checks: [
        { queries: [{ query: "select 1 from maxobject where objectname='MYOBJ'" }] },
      ],
      operations: [],
      selectedId: null,
    };
    const xml = buildDbcScript(state);
    const checkPos = xml.indexOf('<check>');
    const statementsPos = xml.indexOf('<statements>');
    expect(checkPos).toBeLessThan(statementsPos);
    expect(xml).toContain('<check_query');
  });

  it('should include operations in order', () => {
    const state: DbcBuilderState = {
      script: { author: 'ADMIN', scriptname: 'V1000_01' },
      checks: [],
      operations: [
        {
          id: '1',
          operation: {
            type: 'define_table',
            object: 'MYOBJ',
            description: 'My object',
            service: 'ASSET',
            classname: 'psdi.mbo.MboSet',
            tableType: 'system',
            attributes: [{ attribute: 'MYOBJID', title: 'ID', remarks: 'ID' }],
          },
        },
        {
          id: '2',
          operation: {
            type: 'create_relationship',
            parent: 'MYOBJ',
            name: 'PARENT',
            child: 'PARENTOBJ',
            whereclause: 'parentid=:myobjid',
            remarks: 'Parent rel',
          },
        },
      ],
      selectedId: null,
    };
    const xml = buildDbcScript(state);
    const definePos = xml.indexOf('<define_table');
    const relPos = xml.indexOf('<create_relationship');
    expect(definePos).toBeLessThan(relPos);
    expect(xml).toContain('object="MYOBJ"');
    expect(xml).toContain('parent="MYOBJ"');
  });

  it('should produce well-formed XML', () => {
    const state: DbcBuilderState = {
      script: { author: 'ADMIN', scriptname: 'V1000_01', description: 'Test & Demo' },
      checks: [],
      operations: [
        { id: '1', operation: { type: 'drop_table', object: 'OLD' } },
        { id: '2', operation: { type: 'freeform', description: 'SQL', statements: [{ sql: 'SELECT 1' }] } },
      ],
      selectedId: null,
    };
    const xml = buildDbcScript(state);
    expect(xml).toContain('Test &amp; Demo');
    expect(xml).toContain('<drop_table object="OLD" />');
    expect(xml).toContain('<freeform');
  });
});
