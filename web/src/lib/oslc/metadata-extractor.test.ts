import { describe, it, expect } from 'vitest';
import { extractMetadataToDbc } from './metadata-extractor';
import type { MetadataSelection, SelectedObject, OslcDomainWithValues, OslcMaxApp, OslcMaxModule } from './types';

function emptySelection(): MetadataSelection {
  return {
    objects: new Map(),
    domains: new Map(),
    apps: new Map(),
    modules: new Map(),
  };
}

describe('extractMetadataToDbc', () => {
  it('should return empty operations for empty selection', () => {
    const result = extractMetadataToDbc(emptySelection());
    expect(result.operations).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('should produce domains before objects', () => {
    const sel = emptySelection();
    sel.domains.set('WOSTATUS', {
      domainid: 'WOSTATUS',
      domaintype: 'SYNONYM',
      maxtype: 'ALN',
      length: 16,
      synonymValues: [{ value: 'APPR', maxvalue: 'APPR', defaults: true }],
    } as OslcDomainWithValues);

    sel.objects.set('WORKORDER', {
      object: { objectname: 'WORKORDER', description: 'WO', classname: 'test', servicename: 'SVC' },
      attributes: [{ attributename: 'STATUS', objectname: 'WORKORDER', maxtype: 'ALN', length: 16, domainid: 'WOSTATUS' }],
      relationships: [],
      indexes: [],
    } as SelectedObject);

    const result = extractMetadataToDbc(sel);
    const types = result.operations.map((op) => op.type);
    const domIdx = types.indexOf('specify_synonym_domain');
    const objIdx = types.indexOf('define_table');
    expect(domIdx).toBeLessThan(objIdx);
  });

  it('should produce objects with attributes as define_table', () => {
    const sel = emptySelection();
    sel.objects.set('ASSET', {
      object: { objectname: 'ASSET', description: 'Asset', classname: 'psdi.mbo.asset.AssetSet', servicename: 'ASSET', type: 'system' },
      attributes: [
        { attributename: 'ASSETNUM', objectname: 'ASSET', maxtype: 'ALN', length: 20, title: 'Asset', remarks: 'Asset number' },
      ],
      relationships: [],
      indexes: [],
    } as SelectedObject);

    const result = extractMetadataToDbc(sel);
    expect(result.operations).toHaveLength(1);
    expect(result.operations[0].type).toBe('define_table');
    if (result.operations[0].type === 'define_table') {
      expect(result.operations[0].object).toBe('ASSET');
      expect(result.operations[0].attributes).toHaveLength(1);
    }
  });

  it('should produce relationships after objects', () => {
    const sel = emptySelection();
    sel.objects.set('WORKORDER', {
      object: { objectname: 'WORKORDER', description: 'WO', classname: 'test', servicename: 'SVC' },
      attributes: [],
      relationships: [{ name: 'ASSET', parent: 'WORKORDER', child: 'ASSET', whereclause: 'assetnum=:assetnum' }],
      indexes: [],
    } as SelectedObject);

    const result = extractMetadataToDbc(sel);
    const types = result.operations.map((op) => op.type);
    const objIdx = types.indexOf('define_table');
    const relIdx = types.indexOf('create_relationship');
    expect(objIdx).toBeLessThan(relIdx);
  });

  it('should produce indexes after objects', () => {
    const sel = emptySelection();
    sel.objects.set('WORKORDER', {
      object: { objectname: 'WORKORDER', description: 'WO', classname: 'test', servicename: 'SVC' },
      attributes: [],
      relationships: [],
      indexes: [{ name: 'WO_IDX1', tbname: 'WORKORDER', keys: [{ colname: 'WONUM', ascending: true, colseq: 1 }] }],
    } as SelectedObject);

    const result = extractMetadataToDbc(sel);
    const types = result.operations.map((op) => op.type);
    const objIdx = types.indexOf('define_table');
    const idxIdx = types.indexOf('specify_index');
    expect(objIdx).toBeLessThan(idxIdx);
  });

  it('should produce apps after indexes', () => {
    const sel = emptySelection();
    sel.apps.set('WOTRACK', {
      app: 'WOTRACK',
      description: 'Work Order Tracking',
      maintbname: 'WORKORDER',
    } as OslcMaxApp);
    sel.objects.set('WORKORDER', {
      object: { objectname: 'WORKORDER', description: 'WO', classname: 'test', servicename: 'SVC' },
      attributes: [],
      relationships: [],
      indexes: [{ name: 'IDX1', tbname: 'WORKORDER', keys: [{ colname: 'WONUM', ascending: true, colseq: 1 }] }],
    } as SelectedObject);

    const result = extractMetadataToDbc(sel);
    const types = result.operations.map((op) => op.type);
    const idxIdx = types.indexOf('specify_index');
    const appIdx = types.indexOf('create_app');
    expect(idxIdx).toBeLessThan(appIdx);
  });

  it('should produce modules last', () => {
    const sel = emptySelection();
    sel.apps.set('WOTRACK', { app: 'WOTRACK', description: 'WO Track' } as OslcMaxApp);
    sel.modules.set('WORK_MGMT', { module: 'WORK_MGMT', description: 'Work Mgmt' } as OslcMaxModule);

    const result = extractMetadataToDbc(sel);
    const types = result.operations.map((op) => op.type);
    const appIdx = types.indexOf('create_app');
    const modIdx = types.indexOf('create_module');
    expect(appIdx).toBeLessThan(modIdx);
  });

  it('should handle partial selection (only domains)', () => {
    const sel = emptySelection();
    sel.domains.set('STATUS', {
      domainid: 'STATUS',
      domaintype: 'ALN',
      alnValues: [{ value: 'ACTIVE' }],
    } as OslcDomainWithValues);

    const result = extractMetadataToDbc(sel);
    expect(result.operations).toHaveLength(1);
    expect(result.operations[0].type).toBe('specify_aln_domain');
  });

  it('should handle partial selection (only apps and modules)', () => {
    const sel = emptySelection();
    sel.apps.set('APP1', { app: 'APP1', description: 'App 1' } as OslcMaxApp);
    sel.modules.set('MOD1', { module: 'MOD1', description: 'Mod 1' } as OslcMaxModule);

    const result = extractMetadataToDbc(sel);
    expect(result.operations).toHaveLength(2);
    expect(result.operations[0].type).toBe('create_app');
    expect(result.operations[1].type).toBe('create_module');
  });

  it('should collect all operations in correct order for full selection', () => {
    const sel = emptySelection();
    sel.domains.set('DOM1', {
      domainid: 'DOM1',
      domaintype: 'ALN',
      alnValues: [{ value: 'V1' }],
    } as OslcDomainWithValues);
    sel.objects.set('OBJ1', {
      object: { objectname: 'OBJ1', description: 'Obj', classname: 'C', servicename: 'S' },
      attributes: [{ attributename: 'A1', objectname: 'OBJ1', title: 'A', remarks: 'R' }],
      relationships: [{ name: 'REL1', parent: 'OBJ1', child: 'OBJ2', whereclause: 'x=y' }],
      indexes: [{ name: 'IDX1', tbname: 'OBJ1', keys: [{ colname: 'A1', colseq: 1, ascending: true }] }],
    } as SelectedObject);
    sel.apps.set('APP1', { app: 'APP1', description: 'App' } as OslcMaxApp);
    sel.modules.set('MOD1', { module: 'MOD1', description: 'Mod' } as OslcMaxModule);

    const result = extractMetadataToDbc(sel);
    const types = result.operations.map((op) => op.type);
    expect(types).toEqual([
      'specify_aln_domain',
      'define_table',
      'create_relationship',
      'specify_index',
      'create_app',
      'create_module',
    ]);
  });
});
