// OSLC Types — Maximo REST API response types and configuration

import type { DbcOperation } from '@/lib/dbc/types';

// ─── Connection Config ──────────────────────────────────────────

export type OslcAuthMethod = 'apikey' | 'basic';

export interface OslcConfig {
  baseUrl: string;
  authMethod: OslcAuthMethod;
  /** Encrypted API key (when authMethod = 'apikey') */
  encryptedApiKey?: string;
  /** Encrypted username (when authMethod = 'basic') */
  encryptedUsername?: string;
  /** Encrypted password (when authMethod = 'basic') */
  encryptedPassword?: string;
}

// ─── OSLC Response Wrapper ──────────────────────────────────────

export interface OslcCollection<T> {
  member: T[];
  totalCount: number;
  pagenum: number;
  responseInfo?: {
    nextPage?: string;
  };
}

// ─── OSLC Resource Types ────────────────────────────────────────

export interface OslcMaxObject {
  objectname: string;
  description?: string;
  classname?: string;
  servicename?: string;
  /** e.g. 'system', 'site', etc. */
  type?: string;
  persistent?: boolean;
  isview?: boolean;
  maintbname?: string;
  primarykey?: string;
  internal?: boolean;
  storagetype?: string;
}

export interface OslcMaxAttribute {
  attributename: string;
  objectname: string;
  maxtype?: string;
  length?: number;
  scale?: number;
  domainid?: string;
  required?: boolean;
  persistent?: boolean;
  haslongdesc?: boolean;
  userdefined?: boolean;
  classname?: string;
  defaultvalue?: string;
  title?: string;
  remarks?: string;
  sameasobject?: string;
  sameasattribute?: string;
  mustbe?: boolean;
  ispositive?: boolean;
  autokey?: string;
  canautonum?: boolean;
  searchtype?: string;
  localizable?: boolean;
  domainlink?: string;
  restricted?: boolean;
}

export interface OslcMaxDomain {
  domainid: string;
  description?: string;
  domaintype: 'SYNONYM' | 'ALN' | 'NUMERIC' | 'TABLE' | 'CROSSOVER';
  maxtype?: string;
  length?: number;
  scale?: number;
  internal?: boolean;
}

export interface OslcSynonymValue {
  value: string;
  maxvalue: string;
  defaults?: boolean;
  description?: string;
}

export interface OslcAlnValue {
  value: string;
  description?: string;
}

export interface OslcNumericValue {
  value: string;
  description?: string;
}

export interface OslcTableDomainInfo {
  validationwhereclause?: string;
  listwhereclause?: string;
  errorbundle?: string;
  errorkey?: string;
  objectname?: string;
}

export interface OslcCrossoverDomainInfo {
  validationwhereclause?: string;
  listwhereclause?: string;
  errorbundle?: string;
  errorkey?: string;
  objectname?: string;
}

export interface OslcCrossoverValue {
  sourcefield: string;
  destfield?: string;
  copyifnull?: boolean;
  copyevenifsrcnull?: boolean;
  copyonlyifdestnull?: boolean;
}

export interface OslcMaxRelationship {
  name: string;
  parent: string;
  child: string;
  whereclause?: string;
  remarks?: string;
}

export interface OslcMaxIndex {
  name: string;
  tbname: string;
  uniquerule?: boolean;
  clusterrule?: boolean;
  keys: OslcIndexKey[];
}

export interface OslcIndexKey {
  colname: string;
  ascending?: boolean;
  colseq: number;
}

export interface OslcMaxApp {
  app: string;
  description?: string;
  maintbname?: string;
  restrictions?: string;
  orderby?: string;
}

export interface OslcMaxModule {
  module: string;
  description?: string;
}

// ─── Domain with Values (combined) ──────────────────────────────

export interface OslcDomainWithValues extends OslcMaxDomain {
  synonymValues?: OslcSynonymValue[];
  alnValues?: OslcAlnValue[];
  numericValues?: OslcNumericValue[];
  tableDomainInfo?: OslcTableDomainInfo;
  crossoverDomainInfo?: OslcCrossoverDomainInfo;
  crossoverValues?: OslcCrossoverValue[];
}

// ─── Metadata Selection ─────────────────────────────────────────

export interface SelectedObject {
  object: OslcMaxObject;
  attributes: OslcMaxAttribute[];
  relationships: OslcMaxRelationship[];
  indexes: OslcMaxIndex[];
}

export interface MetadataSelection {
  objects: Map<string, SelectedObject>;
  domains: Map<string, OslcDomainWithValues>;
  apps: Map<string, OslcMaxApp>;
  modules: Map<string, OslcMaxModule>;
}

// ─── Extraction Result ──────────────────────────────────────────

export interface ExtractionResult {
  operations: DbcOperation[];
  warnings: string[];
}

// ─── Serializable Selection (for API transport) ─────────────────

export interface SerializableSelection {
  objects: Array<{ key: string; value: SelectedObject }>;
  domains: Array<{ key: string; value: OslcDomainWithValues }>;
  apps: Array<{ key: string; value: OslcMaxApp }>;
  modules: Array<{ key: string; value: OslcMaxModule }>;
}
