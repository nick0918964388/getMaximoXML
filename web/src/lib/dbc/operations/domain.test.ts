import { describe, it, expect } from 'vitest';
import {
  generateSpecifySynonymDomain, generateAddSynonyms, generateSpecifyAlnDomain,
  generateSpecifyNumericDomain, generateSpecifyCrossoverDomain, generateSpecifyTableDomain,
  generateModifyDomainType, generateDropDomain,
} from './domain';

describe('generateSpecifySynonymDomain', () => {
  it('should generate synonym domain with values', () => {
    const xml = generateSpecifySynonymDomain({
      type: 'specify_synonym_domain',
      domainid: 'WOSTATUS',
      description: 'WO Status',
      maxtype: 'UPPER',
      length: 10,
      values: [
        { value: 'APPR', maxvalue: 'APPR', defaults: true, description: 'Approved' },
        { value: 'CLOSE', maxvalue: 'CLOSE', defaults: false },
      ],
    });
    expect(xml).toContain('<specify_synonym_domain');
    expect(xml).toContain('domainid="WOSTATUS"');
    expect(xml).toContain('<synonymvalueinfo');
    expect(xml).toContain('value="APPR"');
    expect(xml).toContain('defaults="true"');
    expect(xml).toContain('</specify_synonym_domain>');
  });
});

describe('generateAddSynonyms', () => {
  it('should generate add_synonyms', () => {
    const xml = generateAddSynonyms({
      type: 'add_synonyms',
      domainid: 'WOSTATUS',
      values: [{ value: 'INPRG', maxvalue: 'INPRG', defaults: false }],
    });
    expect(xml).toContain('<add_synonyms domainid="WOSTATUS">');
    expect(xml).toContain('value="INPRG"');
    expect(xml).toContain('</add_synonyms>');
  });
});

describe('generateSpecifyAlnDomain', () => {
  it('should generate ALN domain', () => {
    const xml = generateSpecifyAlnDomain({
      type: 'specify_aln_domain',
      domainid: 'MYALN',
      values: [{ value: 'A', description: 'First' }],
    });
    expect(xml).toContain('<specify_aln_domain');
    expect(xml).toContain('<alnvalueinfo');
    expect(xml).toContain('value="A"');
    expect(xml).toContain('</specify_aln_domain>');
  });
});

describe('generateSpecifyNumericDomain', () => {
  it('should generate numeric domain', () => {
    const xml = generateSpecifyNumericDomain({
      type: 'specify_numeric_domain',
      domainid: 'MYNUM',
      maxtype: 'INTEGER',
      values: [{ value: '1', description: 'One' }],
    });
    expect(xml).toContain('<specify_numeric_domain');
    expect(xml).toContain('maxtype="INTEGER"');
    expect(xml).toContain('<numericvalueinfo');
    expect(xml).toContain('</specify_numeric_domain>');
  });
});

describe('generateSpecifyCrossoverDomain', () => {
  it('should generate crossover domain', () => {
    const xml = generateSpecifyCrossoverDomain({
      type: 'specify_crossover_domain',
      domainid: 'MYCROSS',
      validationwhereclause: 'status in (select value from synonymdomain)',
      objectname: 'WORKORDER',
      values: [{ sourcefield: 'DESCRIPTION', destfield: 'MEMO' }],
    });
    expect(xml).toContain('<specify_crossover_domain');
    expect(xml).toContain('objectname="WORKORDER"');
    expect(xml).toContain('<crossovervalueinfo');
    expect(xml).toContain('sourcefield="DESCRIPTION"');
    expect(xml).toContain('</specify_crossover_domain>');
  });
});

describe('generateSpecifyTableDomain', () => {
  it('should generate table domain (self-closing, no children)', () => {
    const xml = generateSpecifyTableDomain({
      type: 'specify_table_domain',
      domainid: 'MYTBLDOM',
      validationwhereclause: '1=1',
      objectname: 'ASSET',
    });
    expect(xml).toContain('<specify_table_domain');
    expect(xml).toContain('domainid="MYTBLDOM"');
    expect(xml).toContain('objectname="ASSET"');
    expect(xml).toContain('/>');
  });
});

describe('generateModifyDomainType', () => {
  it('should generate modify_domain_type', () => {
    const xml = generateModifyDomainType({
      type: 'modify_domain_type',
      domain: 'WOSTATUS',
      maxtype: 'ALN',
      length: 20,
    });
    expect(xml).toContain('<modify_domain_type');
    expect(xml).toContain('domain="WOSTATUS"');
    expect(xml).toContain('maxtype="ALN"');
    expect(xml).toContain('length="20"');
  });
});

describe('generateDropDomain', () => {
  it('should generate drop_domain', () => {
    const xml = generateDropDomain({
      type: 'drop_domain',
      domainid: 'OLDDOMAIN',
    });
    expect(xml).toContain('<drop_domain domainid="OLDDOMAIN" />');
  });
});
