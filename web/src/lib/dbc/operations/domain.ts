import { XmlBuilder } from '../xml-builder';
import type {
  SpecifySynonymDomainOp, AddSynonymsOp, SpecifyAlnDomainOp,
  SpecifyNumericDomainOp, SpecifyCrossoverDomainOp, SpecifyTableDomainOp,
  ModifyDomainTypeOp, DropDomainOp, SynonymValueInfo,
} from '../types';

function writeSynonymValues(xb: XmlBuilder, values: SynonymValueInfo[]): void {
  for (const v of values) {
    xb.selfClosingTag('synonymvalueinfo', {
      value: v.value,
      maxvalue: v.maxvalue,
      defaults: v.defaults,
      description: v.description,
    });
  }
}

export function generateSpecifySynonymDomain(op: SpecifySynonymDomainOp): string {
  const xb = new XmlBuilder();
  xb.openTag('specify_synonym_domain', {
    domainid: op.domainid,
    description: op.description,
    maxtype: op.maxtype,
    length: op.length,
    overwrite: op.overwrite,
    internal: op.internal,
  });
  writeSynonymValues(xb, op.values);
  xb.closeTag('specify_synonym_domain');
  return xb.toString();
}

export function generateAddSynonyms(op: AddSynonymsOp): string {
  const xb = new XmlBuilder();
  xb.openTag('add_synonyms', { domainid: op.domainid });
  writeSynonymValues(xb, op.values);
  xb.closeTag('add_synonyms');
  return xb.toString();
}

export function generateSpecifyAlnDomain(op: SpecifyAlnDomainOp): string {
  const xb = new XmlBuilder();
  xb.openTag('specify_aln_domain', {
    domainid: op.domainid,
    description: op.description,
    maxtype: op.maxtype,
    length: op.length,
    overwrite: op.overwrite,
    internal: op.internal,
  });
  for (const v of op.values) {
    xb.selfClosingTag('alnvalueinfo', { value: v.value, description: v.description });
  }
  xb.closeTag('specify_aln_domain');
  return xb.toString();
}

export function generateSpecifyNumericDomain(op: SpecifyNumericDomainOp): string {
  const xb = new XmlBuilder();
  xb.openTag('specify_numeric_domain', {
    domainid: op.domainid,
    description: op.description,
    maxtype: op.maxtype,
    length: op.length,
    scale: op.scale,
    overwrite: op.overwrite,
    internal: op.internal,
  });
  for (const v of op.values) {
    xb.selfClosingTag('numericvalueinfo', { value: v.value, description: v.description });
  }
  xb.closeTag('specify_numeric_domain');
  return xb.toString();
}

export function generateSpecifyCrossoverDomain(op: SpecifyCrossoverDomainOp): string {
  const xb = new XmlBuilder();
  xb.openTag('specify_crossover_domain', {
    domainid: op.domainid,
    description: op.description,
    overwrite: op.overwrite,
    validationwhereclause: op.validationwhereclause,
    listwhereclause: op.listwhereclause,
    errorbundle: op.errorbundle,
    errorkey: op.errorkey,
    objectname: op.objectname,
    internal: op.internal,
  });
  for (const v of op.values) {
    xb.selfClosingTag('crossovervalueinfo', {
      sourcefield: v.sourcefield,
      destfield: v.destfield,
      copyifnull: v.copyifnull,
      copyevenifsrcnull: v.copyevenifsrcnull,
      copyonlyifdestnull: v.copyonlyifdestnull,
    });
  }
  xb.closeTag('specify_crossover_domain');
  return xb.toString();
}

export function generateSpecifyTableDomain(op: SpecifyTableDomainOp): string {
  const xb = new XmlBuilder();
  xb.selfClosingTag('specify_table_domain', {
    domainid: op.domainid,
    description: op.description,
    overwrite: op.overwrite,
    validationwhereclause: op.validationwhereclause,
    listwhereclause: op.listwhereclause,
    errorbundle: op.errorbundle,
    errorkey: op.errorkey,
    objectname: op.objectname,
    internal: op.internal,
  });
  return xb.toString();
}

export function generateModifyDomainType(op: ModifyDomainTypeOp): string {
  const xb = new XmlBuilder();
  xb.selfClosingTag('modify_domain_type', {
    domain: op.domain,
    maxtype: op.maxtype,
    length: op.length,
    scale: op.scale,
  });
  return xb.toString();
}

export function generateDropDomain(op: DropDomainOp): string {
  const xb = new XmlBuilder();
  xb.selfClosingTag('drop_domain', { domainid: op.domainid });
  return xb.toString();
}
