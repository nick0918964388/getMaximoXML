/**
 * Field type in Maximo presentation XML
 */
export type FieldType =
  | 'textbox'
  | 'checkbox'
  | 'tablecol'
  | 'multiparttextbox'
  | 'multilinetextbox'
  | 'statictext'
  | 'pushbutton'
  | 'attachments'
  | 'combobox';

/**
 * Input mode for fields
 */
export type InputMode = 'required' | 'readonly' | 'query' | 'optional';

/**
 * Area where the field is placed
 */
export type FieldArea = 'header' | 'detail' | 'list';

/**
 * Sub-tab definition within a main tab
 */
export interface SubTabDefinition {
  /** Sub-tab ID */
  id: string;
  /** Sub-tab label */
  label: string;
  /** Order within the parent tab */
  order: number;
}

/**
 * Maximo attribute data types
 */
export type MaximoDataType =
  | 'ALN'       // Alphanumeric
  | 'UPPER'     // Upper case alphanumeric
  | 'LOWER'     // Lower case alphanumeric
  | 'INTEGER'   // Integer
  | 'SMALLINT'  // Small integer
  | 'DECIMAL'   // Decimal
  | 'FLOAT'     // Float
  | 'AMOUNT'    // Currency/amount
  | 'DATE'      // Date only
  | 'DATETIME'  // Date and time
  | 'TIME'      // Time only
  | 'YORN'      // Yes or No (boolean)
  | 'CLOB'      // Character Large Object
  | 'LONGALN'   // Long alphanumeric
  | 'GL';       // General Ledger

/**
 * Raw field definition from SA document (Excel)
 */
export interface SAFieldDefinition {
  /** Field name (dataattribute) - can be empty for auto-generation */
  fieldName: string;
  /** Label */
  label: string;
  /** Type (textbox/checkbox/tablecol etc.) */
  type: FieldType;
  /** Input mode (required/readonly/query) */
  inputMode: InputMode;
  /** Lookup name */
  lookup: string;
  /**
   * Relationship - purpose varies by area:
   * - header: field data source relationship, generates dataattribute="relationship.fieldName"
   * - detail: detail table relationship, used for grouping fields
   * - list: usually not used
   */
  relationship: string;
  /** App link */
  applink: string;
  /** Width */
  width: string;
  /** Filterable */
  filterable: boolean;
  /** Sortable */
  sortable: boolean;
  /** Area (header/detail/list) */
  area: FieldArea;
  /** Tab name */
  tabName: string;
  /** Column (column number for multi-column layout, optional) */
  column: number;
  /** Order (display order within the same group) */
  order: number;

  // ===== Database Configuration Fields =====
  /** Maximo data type (ALN/INTEGER/DECIMAL/DATE/YORN etc.) */
  maxType: MaximoDataType;
  /** Field length */
  length: number;
  /** Scale (for DECIMAL) */
  scale: number;
  /** Database required */
  dbRequired: boolean;
  /** Default value */
  defaultValue: string;
  /** Persistent (stored in database) */
  persistent: boolean;
  /** Field title (MAXATTRIBUTE.TITLE) */
  title: string;
  /** Object name (if different from main MBO) */
  objectName: string;

  // ===== Multipart Textbox Fields =====
  /** Description dataattribute (second part of multiparttextbox) */
  descDataattribute: string;
  /** Description label (second part label of multiparttextbox) */
  descLabel: string;
  /** Description input mode (second part input mode of multiparttextbox) */
  descInputMode: InputMode;
  /** Sub-tab name within the parent tab */
  subTabName: string;
  /** Maximo event for pushbutton */
  mxevent: string;
}

/**
 * Processed field with generated ID if needed
 */
export interface ProcessedField extends SAFieldDefinition {
  /** Generated or provided ID */
  id: string;
  /** Processed dataattribute */
  dataattribute: string;
}

/**
 * Tab definition with its fields
 */
export interface TabDefinition {
  /** Tab ID */
  id: string;
  /** Tab label */
  label: string;
  /** Header fields (area=header) */
  headerFields: ProcessedField[];
  /** Detail tables (area=detail, grouped by relationship) */
  detailTables: Map<string, ProcessedField[]>;
  /** Sub-tabs within this tab (nested tabgroup) */
  subTabs: Map<string, {
    id: string;
    label: string;
    headerFields: ProcessedField[];
    detailTables: Map<string, ProcessedField[]>;
  }>;
  /** Label for the main detail area sub-tab (default: "主區域") */
  mainDetailLabel: string;
}

/**
 * Application definition containing all parsed data
 */
export interface ApplicationDefinition {
  /** List fields (area=list) */
  listFields: ProcessedField[];
  /** Tabs with their fields */
  tabs: Map<string, TabDefinition>;
}

/**
 * Application metadata for XML generation
 */
export interface ApplicationMetadata {
  /** Application ID */
  id: string;
  /** Key attribute */
  keyAttribute: string;
  /** MBO name */
  mboName: string;
  /** Version */
  version: string;
  /** Order by clause */
  orderBy: string;
  /** Where clause */
  whereClause: string;
  /** Whether the MBO is a standard Maximo object (e.g., SR, WORKORDER, ASSET) */
  isStandardObject: boolean;
  /** Bean class for presentation tag */
  beanclass: string;
}

/**
 * Detail table configuration (with beanclass)
 */
export interface DetailTableConfig {
  /** Relationship name */
  relationship: string;
  /** Table label */
  label: string;
  /** Order by clause */
  orderBy: string;
  /** Bean class for table */
  beanclass: string;
}

/**
 * Dialog detail table configuration
 */
export interface DialogDetailTable {
  /** Relationship name */
  relationship: string;
  /** Table label */
  label: string;
  /** Order by clause */
  orderBy: string;
  /** Bean class for table */
  beanclass: string;
  /** Fields in this detail table */
  fields: SAFieldDefinition[];
}

/**
 * Dialog template definition
 */
export interface DialogTemplate {
  /** Unique identifier */
  id: string;
  /** Dialog ID for XML */
  dialogId: string;
  /** Dialog title/label */
  label: string;
  /** Bean class for dialog */
  beanclass: string;
  /** MBO name (if using MBO directly) */
  mboName: string;
  /** Relationship (alternative to MBO) */
  relationship: string;
  /** Header fields */
  headerFields: SAFieldDefinition[];
  /** Detail tables */
  detailTables: DialogDetailTable[];
}

/**
 * Project data structure for localStorage
 */
export interface SavedProject {
  /** Project ID */
  id: string;
  /** Project name */
  name: string;
  /** Application metadata */
  metadata: ApplicationMetadata;
  /** Field definitions */
  fields: SAFieldDefinition[];
  /** Detail table configurations (key = tabName:relationship) */
  detailTableConfigs: Record<string, DetailTableConfig>;
  /** Dialog templates */
  dialogTemplates: DialogTemplate[];
  /** Sub-tab configurations (key = tabName) */
  subTabConfigs: Record<string, SubTabDefinition[]>;
  /** Main detail labels (key = tabName, value = label) */
  mainDetailLabels: Record<string, string>;
  /** Created timestamp */
  createdAt: string;
  /** Updated timestamp */
  updatedAt: string;
}

/**
 * Default values for new fields
 */
export const DEFAULT_FIELD: SAFieldDefinition = {
  fieldName: '',
  label: '',
  type: 'textbox',
  inputMode: 'optional',
  lookup: '',
  relationship: '',
  applink: '',
  width: '',
  filterable: false,
  sortable: false,
  area: 'header',
  tabName: '',
  column: 0,
  order: 0,
  maxType: 'ALN',
  length: 100,
  scale: 0,
  dbRequired: false,
  defaultValue: '',
  persistent: true,
  title: '',
  objectName: '',
  descDataattribute: '',
  descLabel: '',
  descInputMode: 'optional',
  subTabName: '',
  mxevent: '',
};

/**
 * Default metadata for new projects
 */
export const DEFAULT_METADATA: ApplicationMetadata = {
  id: '',
  keyAttribute: '',
  mboName: 'SR',
  version: '7.6.1.2',
  orderBy: '',
  whereClause: '',
  isStandardObject: true,
  beanclass: '',
};

/**
 * Default detail table config
 */
export const DEFAULT_DETAIL_TABLE_CONFIG: DetailTableConfig = {
  relationship: '',
  label: '',
  orderBy: '',
  beanclass: '',
};

/**
 * Default sub-tab definition
 */
export const DEFAULT_SUB_TAB: SubTabDefinition = {
  id: '',
  label: '',
  order: 0,
};

/**
 * Default dialog detail table
 */
export const DEFAULT_DIALOG_DETAIL_TABLE: DialogDetailTable = {
  relationship: '',
  label: '',
  orderBy: '',
  beanclass: '',
  fields: [],
};

/**
 * Default dialog template
 */
export const DEFAULT_DIALOG_TEMPLATE: DialogTemplate = {
  id: '',
  dialogId: '',
  label: '',
  beanclass: '',
  mboName: '',
  relationship: '',
  headerFields: [],
  detailTables: [],
};
