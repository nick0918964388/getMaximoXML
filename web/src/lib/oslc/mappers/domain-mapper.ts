import type {
  SpecifySynonymDomainOp,
  SpecifyAlnDomainOp,
  SpecifyNumericDomainOp,
  SpecifyTableDomainOp,
  SpecifyCrossoverDomainOp,
  DomainMaxType,
  NumericMaxType,
} from '@/lib/dbc/types';
import type { OslcDomainWithValues } from '../types';

type DomainDbcOp =
  | SpecifySynonymDomainOp
  | SpecifyAlnDomainOp
  | SpecifyNumericDomainOp
  | SpecifyTableDomainOp
  | SpecifyCrossoverDomainOp;

/**
 * Map an OSLC domain (with values) to the appropriate DBC operation
 */
export function mapDomainToDbcOp(domain: OslcDomainWithValues): DomainDbcOp {
  switch (domain.domaintype) {
    case 'SYNONYM':
      return mapSynonymDomain(domain);
    case 'ALN':
      return mapAlnDomain(domain);
    case 'NUMERIC':
      return mapNumericDomain(domain);
    case 'TABLE':
      return mapTableDomain(domain);
    case 'CROSSOVER':
      return mapCrossoverDomain(domain);
  }
}

function mapSynonymDomain(domain: OslcDomainWithValues): SpecifySynonymDomainOp {
  return {
    type: 'specify_synonym_domain',
    domainid: domain.domainid,
    description: domain.description,
    maxtype: domain.maxtype as DomainMaxType | undefined,
    length: domain.length,
    internal: domain.internal,
    values: (domain.synonymValues ?? []).map((v) => ({
      value: v.value,
      maxvalue: v.maxvalue,
      defaults: v.defaults ?? false,
      description: v.description,
    })),
  };
}

function mapAlnDomain(domain: OslcDomainWithValues): SpecifyAlnDomainOp {
  return {
    type: 'specify_aln_domain',
    domainid: domain.domainid,
    description: domain.description,
    maxtype: domain.maxtype as DomainMaxType | undefined,
    length: domain.length,
    internal: domain.internal,
    values: (domain.alnValues ?? []).map((v) => ({
      value: v.value,
      description: v.description,
    })),
  };
}

function mapNumericDomain(domain: OslcDomainWithValues): SpecifyNumericDomainOp {
  return {
    type: 'specify_numeric_domain',
    domainid: domain.domainid,
    description: domain.description,
    maxtype: domain.maxtype as NumericMaxType | undefined,
    length: domain.length,
    scale: domain.scale,
    internal: domain.internal,
    values: (domain.numericValues ?? []).map((v) => ({
      value: v.value,
      description: v.description,
    })),
  };
}

function mapTableDomain(domain: OslcDomainWithValues): SpecifyTableDomainOp {
  const info = domain.tableDomainInfo;
  return {
    type: 'specify_table_domain',
    domainid: domain.domainid,
    description: domain.description,
    internal: domain.internal,
    validationwhereclause: info?.validationwhereclause ?? '',
    listwhereclause: info?.listwhereclause,
    errorbundle: info?.errorbundle,
    errorkey: info?.errorkey,
    objectname: info?.objectname ?? '',
  };
}

function mapCrossoverDomain(domain: OslcDomainWithValues): SpecifyCrossoverDomainOp {
  const info = domain.crossoverDomainInfo;
  return {
    type: 'specify_crossover_domain',
    domainid: domain.domainid,
    description: domain.description,
    internal: domain.internal,
    validationwhereclause: info?.validationwhereclause ?? '',
    listwhereclause: info?.listwhereclause,
    errorbundle: info?.errorbundle,
    errorkey: info?.errorkey,
    objectname: info?.objectname ?? '',
    values: (domain.crossoverValues ?? []).map((v) => ({
      sourcefield: v.sourcefield,
      destfield: v.destfield,
      copyifnull: v.copyifnull,
      copyevenifsrcnull: v.copyevenifsrcnull,
      copyonlyifdestnull: v.copyonlyifdestnull,
    })),
  };
}
