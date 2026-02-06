import { describe, it, expect } from 'vitest';
import { parseDbcXml } from './dbc-parser';
import { buildDbcScript } from './dbc-script-builder';
import type { DbcBuilderState } from './types';

describe('parseDbcXml', () => {
  it('should parse script metadata', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<script author="ADMIN" scriptname="V1000_01">
  <description>Test script</description>
  <statements></statements>
</script>`;
    const state = parseDbcXml(xml);
    expect(state.script.author).toBe('ADMIN');
    expect(state.script.scriptname).toBe('V1000_01');
    expect(state.script.description).toBe('Test script');
  });

  it('should parse optional script attributes', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<script author="A" scriptname="S" for_demo_only="true" context="all" tenantcode="T1">
  <statements></statements>
</script>`;
    const state = parseDbcXml(xml);
    expect(state.script.for_demo_only).toBe(true);
    expect(state.script.context).toBe('all');
    expect(state.script.tenantcode).toBe('T1');
  });

  it('should parse checks', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<script author="A" scriptname="S">
  <check tag="INFO" skip_script="true">
    <check_query query="select 1 from dual" />
  </check>
  <statements></statements>
</script>`;
    const state = parseDbcXml(xml);
    expect(state.checks).toHaveLength(1);
    expect(state.checks[0].tag).toBe('INFO');
    expect(state.checks[0].skip_script).toBe(true);
    expect(state.checks[0].queries).toHaveLength(1);
    expect(state.checks[0].queries[0].query).toBe('select 1 from dual');
  });

  it('should parse drop_table operation', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<script author="A" scriptname="S">
  <statements>
    <drop_table object="OLDTABLE" />
  </statements>
</script>`;
    const state = parseDbcXml(xml);
    expect(state.operations).toHaveLength(1);
    expect(state.operations[0].operation.type).toBe('drop_table');
    if (state.operations[0].operation.type === 'drop_table') {
      expect(state.operations[0].operation.object).toBe('OLDTABLE');
    }
  });

  it('should parse define_table with attributes', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<script author="A" scriptname="S">
  <statements>
    <define_table object="MYOBJ" description="My Object" service="ASSET" classname="cls" type="system">
      <attrdef attribute="MYOBJID" maxtype="BIGINT" title="ID" remarks="Unique ID" required="true" />
    </define_table>
  </statements>
</script>`;
    const state = parseDbcXml(xml);
    expect(state.operations).toHaveLength(1);
    const op = state.operations[0].operation;
    expect(op.type).toBe('define_table');
    if (op.type === 'define_table') {
      expect(op.object).toBe('MYOBJ');
      expect(op.attributes).toHaveLength(1);
      expect(op.attributes[0].attribute).toBe('MYOBJID');
      expect(op.attributes[0].required).toBe(true);
    }
  });

  it('should parse create_relationship', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<script author="A" scriptname="S">
  <statements>
    <create_relationship parent="WO" name="REL" child="CHILD" whereclause="id=:id" remarks="test" />
  </statements>
</script>`;
    const state = parseDbcXml(xml);
    const op = state.operations[0].operation;
    expect(op.type).toBe('create_relationship');
    if (op.type === 'create_relationship') {
      expect(op.parent).toBe('WO');
      expect(op.child).toBe('CHILD');
    }
  });

  it('should parse freeform with sql', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<script author="A" scriptname="S">
  <statements>
    <freeform description="Update">
      <sql target="all">UPDATE T SET X=1</sql>
    </freeform>
  </statements>
</script>`;
    const state = parseDbcXml(xml);
    const op = state.operations[0].operation;
    expect(op.type).toBe('freeform');
    if (op.type === 'freeform') {
      expect(op.description).toBe('Update');
      expect(op.statements).toHaveLength(1);
      expect(op.statements[0].sql).toBe('UPDATE T SET X=1');
      expect(op.statements[0].target).toBe('all');
    }
  });

  it('should parse insert with rows', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<script author="A" scriptname="S">
  <statements>
    <insert table="MYTABLE" ignore_duplicates="true">
      <insertrow>
        <columnvalue column="COL1" string="val1" />
        <columnvalue column="COL2" boolean="true" />
        <columnvalue column="COL3" number="42" />
      </insertrow>
    </insert>
  </statements>
</script>`;
    const state = parseDbcXml(xml);
    const op = state.operations[0].operation;
    expect(op.type).toBe('insert');
    if (op.type === 'insert') {
      expect(op.table).toBe('MYTABLE');
      expect(op.ignore_duplicates).toBe(true);
      expect(op.rows).toHaveLength(1);
      expect(op.rows[0].columns).toHaveLength(3);
      expect(op.rows[0].columns[0].string).toBe('val1');
      expect(op.rows[0].columns[1].boolean).toBe(true);
      expect(op.rows[0].columns[2].number).toBe('42');
    }
  });

  it('should round-trip: build → parse → build produces same XML', () => {
    const original: DbcBuilderState = {
      script: { author: 'ADMIN', scriptname: 'V1000_01', description: 'Round trip test' },
      checks: [{ queries: [{ query: 'select 1 from dual' }] }],
      operations: [
        { id: '1', operation: { type: 'drop_table', object: 'OLDOBJ' } },
        {
          id: '2',
          operation: {
            type: 'create_relationship',
            parent: 'A',
            name: 'REL',
            child: 'B',
            whereclause: 'id=:id',
            remarks: 'rel',
          },
        },
      ],
      selectedId: null,
    };
    const xml1 = buildDbcScript(original);
    const parsed = parseDbcXml(xml1);
    const xml2 = buildDbcScript(parsed);
    expect(xml2).toBe(xml1);
  });
});
