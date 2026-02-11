import { describe, it, expect } from 'vitest';
import { mapDomainToDbcOp } from './domain-mapper';
import type { OslcDomainWithValues } from '../types';

describe('mapDomainToDbcOp', () => {
  it('should map SYNONYM domain', () => {
    const domain: OslcDomainWithValues = {
      domainid: 'WOSTATUS',
      description: 'Work Order Status',
      domaintype: 'SYNONYM',
      maxtype: 'ALN',
      length: 16,
      synonymValues: [
        { value: 'APPR', maxvalue: 'APPR', defaults: true, description: 'Approved' },
        { value: 'WAPPR', maxvalue: 'WAPPR', defaults: false, description: 'Waiting Approval' },
      ],
    };

    const result = mapDomainToDbcOp(domain);
    expect(result.type).toBe('specify_synonym_domain');
    if (result.type === 'specify_synonym_domain') {
      expect(result.domainid).toBe('WOSTATUS');
      expect(result.description).toBe('Work Order Status');
      expect(result.maxtype).toBe('ALN');
      expect(result.length).toBe(16);
      expect(result.values).toHaveLength(2);
      expect(result.values[0].value).toBe('APPR');
      expect(result.values[0].maxvalue).toBe('APPR');
      expect(result.values[0].defaults).toBe(true);
    }
  });

  it('should map ALN domain', () => {
    const domain: OslcDomainWithValues = {
      domainid: 'ITEMTYPE',
      description: 'Item Type',
      domaintype: 'ALN',
      maxtype: 'ALN',
      length: 20,
      alnValues: [
        { value: 'ITEM', description: 'Standard Item' },
        { value: 'TOOL', description: 'Tool Item' },
      ],
    };

    const result = mapDomainToDbcOp(domain);
    expect(result.type).toBe('specify_aln_domain');
    if (result.type === 'specify_aln_domain') {
      expect(result.domainid).toBe('ITEMTYPE');
      expect(result.values).toHaveLength(2);
      expect(result.values[0].value).toBe('ITEM');
    }
  });

  it('should map NUMERIC domain', () => {
    const domain: OslcDomainWithValues = {
      domainid: 'PRIORITY',
      description: 'Priority',
      domaintype: 'NUMERIC',
      maxtype: 'INTEGER',
      numericValues: [
        { value: '1', description: 'High' },
        { value: '2', description: 'Medium' },
      ],
    };

    const result = mapDomainToDbcOp(domain);
    expect(result.type).toBe('specify_numeric_domain');
    if (result.type === 'specify_numeric_domain') {
      expect(result.domainid).toBe('PRIORITY');
      expect(result.maxtype).toBe('INTEGER');
      expect(result.values).toHaveLength(2);
    }
  });

  it('should map TABLE domain', () => {
    const domain: OslcDomainWithValues = {
      domainid: 'TBLDOM1',
      description: 'Table Domain',
      domaintype: 'TABLE',
      tableDomainInfo: {
        validationwhereclause: 'status = :STATUS',
        objectname: 'WORKORDER',
      },
    };

    const result = mapDomainToDbcOp(domain);
    expect(result.type).toBe('specify_table_domain');
    if (result.type === 'specify_table_domain') {
      expect(result.domainid).toBe('TBLDOM1');
      expect(result.validationwhereclause).toBe('status = :STATUS');
      expect(result.objectname).toBe('WORKORDER');
    }
  });

  it('should map CROSSOVER domain', () => {
    const domain: OslcDomainWithValues = {
      domainid: 'CROSSDOM1',
      description: 'Crossover Domain',
      domaintype: 'CROSSOVER',
      crossoverDomainInfo: {
        validationwhereclause: 'assetnum = :ASSETNUM',
        objectname: 'ASSET',
      },
      crossoverValues: [
        { sourcefield: 'DESCRIPTION', destfield: 'ASSETDESC' },
      ],
    };

    const result = mapDomainToDbcOp(domain);
    expect(result.type).toBe('specify_crossover_domain');
    if (result.type === 'specify_crossover_domain') {
      expect(result.domainid).toBe('CROSSDOM1');
      expect(result.validationwhereclause).toBe('assetnum = :ASSETNUM');
      expect(result.objectname).toBe('ASSET');
      expect(result.values).toHaveLength(1);
      expect(result.values[0].sourcefield).toBe('DESCRIPTION');
    }
  });

  it('should default to empty values for SYNONYM domain without values', () => {
    const domain: OslcDomainWithValues = {
      domainid: 'EMPTY',
      domaintype: 'SYNONYM',
    };

    const result = mapDomainToDbcOp(domain);
    expect(result.type).toBe('specify_synonym_domain');
    if (result.type === 'specify_synonym_domain') {
      expect(result.values).toHaveLength(0);
    }
  });

  it('should map internal flag', () => {
    const domain: OslcDomainWithValues = {
      domainid: 'INTDOM',
      domaintype: 'ALN',
      internal: true,
      alnValues: [],
    };

    const result = mapDomainToDbcOp(domain);
    if (result.type === 'specify_aln_domain') {
      expect(result.internal).toBe(true);
    }
  });
});
