/**
 * FMB XML structure types
 * Represents elements parsed from Oracle Forms frmf2xml export
 */

export type FmbItemType =
  | 'TEXT_ITEM'
  | 'CHECK_BOX'
  | 'LIST_ITEM'
  | 'PUSH_BUTTON'
  | 'DISPLAY_ITEM'
  | 'RADIO_GROUP'
  | 'IMAGE'
  | 'BEAN_AREA'
  | 'CHART_ITEM'
  | 'USER_AREA';

export interface FmbItem {
  name: string;
  itemType: FmbItemType;
  prompt?: string;
  /** Label attribute (used primarily by push buttons) */
  label?: string;
  canvas?: string;
  tabPage?: string;
  dataType?: string;
  maximumLength?: number;
  required?: boolean;
  enabled?: boolean;
  visible?: boolean;
  lovName?: string;
  /** Raw attributes from XML for extensibility */
  attributes: Record<string, string>;
}

export interface FmbTrigger {
  name: string;
  triggerType: string;
  triggerText?: string;
}

export interface FmbBlock {
  name: string;
  queryDataSource?: string;
  singleRecord: boolean;
  items: FmbItem[];
  triggers: FmbTrigger[];
  /** Raw attributes */
  attributes: Record<string, string>;
}

export interface FmbCanvas {
  name: string;
  canvasType: string;
  tabPages: FmbTabPage[];
  attributes: Record<string, string>;
}

export interface FmbTabPage {
  name: string;
  label?: string;
  attributes: Record<string, string>;
}

export interface FmbLovColumnMapping {
  name: string;
  title?: string;
  returnItem: string;
  displayWidth?: number;
}

export interface FmbLov {
  name: string;
  title?: string;
  recordGroupName?: string;
  columnMappings: FmbLovColumnMapping[];
  attributes: Record<string, string>;
}

export interface FmbRecordGroupColumn {
  name: string;
  dataType: string;
  maxLength?: number;
}

export interface FmbRecordGroup {
  name: string;
  recordGroupType: string;
  query?: string;
  columns: FmbRecordGroupColumn[];
  attributes: Record<string, string>;
}

export interface FmbModule {
  name: string;
  title?: string;
  blocks: FmbBlock[];
  canvases: FmbCanvas[];
  lovs: FmbLov[];
  recordGroups: FmbRecordGroup[];
  triggers: FmbTrigger[];
  /** Module-level attributes */
  attributes: Record<string, string>;
}

// ===== DBC (Database Configuration) Types =====

/**
 * DBC data types (Maximo attribute types for DBC scripts)
 */
export type DbcDataType =
  | 'ALN'       // Alphanumeric
  | 'UPPER'     // Upper case alphanumeric
  | 'LOWER'     // Lower case alphanumeric
  | 'INTEGER'   // Integer
  | 'SMALLINT'  // Small integer
  | 'BIGINT'    // Big integer
  | 'DECIMAL'   // Decimal
  | 'FLOAT'     // Float
  | 'AMOUNT'    // Amount (currency)
  | 'DATE'      // Date only
  | 'DATETIME'  // Date and time
  | 'TIME'      // Time only
  | 'YORN'      // Yes or No (boolean)
  | 'CLOB'      // Character Large Object
  | 'LONGALN'   // Long alphanumeric
  | 'GL';       // General Ledger

/**
 * DBC script metadata
 */
export interface DbcScriptMetadata {
  /** Script author */
  author: string;
  /** Script name */
  scriptname: string;
  /** Script description */
  description: string;
}

/**
 * DBC attribute definition (corresponds to <attrdef> element)
 */
export interface DbcAttributeDefinition {
  /** Attribute name */
  attribute: string;
  /** Maximo data type */
  maxtype: DbcDataType;
  /** Field length (for string types) */
  length?: number;
  /** Field title */
  title: string;
  /** Remarks/description */
  remarks: string;
  /** Whether required */
  required?: boolean;
}

/**
 * DBC table definition (corresponds to <define_table> element)
 */
export interface DbcTableDefinition {
  /** MBO object name */
  object: string;
  /** Table description */
  description: string;
  /** Object type (usually "system") */
  type: 'system' | 'mbo';
  /** Primary key field (multiple fields separated by comma) */
  primarykey: string;
  /** MBO class name */
  classname: string;
  /** Service name */
  service: string;
  /** Attribute definitions */
  attributes: DbcAttributeDefinition[];
}

/**
 * DBC relationship definition (corresponds to <create_relationship> element)
 */
export interface DbcRelationshipDefinition {
  /** Relationship name */
  name: string;
  /** Parent MBO name */
  parent: string;
  /** Child MBO name */
  child: string;
  /** Where clause (e.g., "je_header_id = :je_header_id") */
  whereclause: string;
  /** Remarks/description */
  remarks: string;
}

/**
 * Complete DBC script definition
 */
export interface DbcScript {
  /** Script metadata */
  metadata: DbcScriptMetadata;
  /** Table definitions */
  tables: DbcTableDefinition[];
  /** Relationship definitions */
  relationships?: DbcRelationshipDefinition[];
}

/**
 * MBO extraction result (internal use)
 */
export interface MboExtractionResult {
  /** Table definitions */
  tables: DbcTableDefinition[];
  /** Relationship definitions */
  relationships: DbcRelationshipDefinition[];
}

/**
 * DBC generator configuration
 */
export interface DbcGeneratorConfig {
  /** Default classname */
  defaultClassname: string;
  /** Default service */
  defaultService: string;
  /** Default type */
  defaultType: 'system' | 'mbo';
}

/**
 * DBC generation result
 */
export interface DbcGenerationResult {
  /** Generated DBC XML content */
  content: string;
  /** Script definition (structured data) */
  script: DbcScript;
  /** Suggested filename */
  suggestedFilename: string;
}

/**
 * DBC generator default configuration
 */
export const DEFAULT_DBC_CONFIG: DbcGeneratorConfig = {
  defaultClassname: 'psdi.mbo.custapp.CustomMboSet',
  defaultService: 'CUSTAPP',
  defaultType: 'system',
};

/**
 * DBC script default metadata
 */
export const DEFAULT_DBC_METADATA: DbcScriptMetadata = {
  author: 'MaximoExpert',
  scriptname: '',
  description: '',
};
