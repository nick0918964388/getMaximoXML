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
  | 'pushbutton';

/**
 * Input mode for fields
 */
export type InputMode = 'required' | 'readonly' | 'query' | '';

/**
 * Area where the field is placed
 */
export type FieldArea = 'header' | 'detail' | 'list';

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
  /** 欄位名稱 (dataattribute) - can be empty for auto-generation */
  fieldName: string;
  /** 標籤 (label) */
  label: string;
  /** 型別 (textbox/checkbox/tablecol etc.) */
  type: FieldType;
  /** 輸入模式 (required/readonly/query) */
  inputMode: InputMode;
  /** Lookup名稱 */
  lookup: string;
  /**
   * 關聯 (relationship) - 用途依 area 不同:
   * - header: 欄位資料來源關聯，產出 dataattribute="relationship.fieldName"
   * - detail: 明細表格的 relationship，用於分組欄位
   * - list: 通常不使用
   */
  relationship: string;
  /** 連結應用 (applink) */
  applink: string;
  /** 寬度 */
  width: string;
  /** 可篩選 */
  filterable: boolean;
  /** 可排序 */
  sortable: boolean;
  /** 區域 (header/detail/list) */
  area: FieldArea;
  /** Tab名稱 */
  tabName: string;
  /** 欄 (column number for multi-column layout, optional) */
  column: number;

  // ===== Database Configuration Fields =====
  /** Maximo 資料類型 (ALN/INTEGER/DECIMAL/DATE/YORN etc.) */
  maxType: MaximoDataType;
  /** 欄位長度 */
  length: number;
  /** 小數位數 (用於 DECIMAL) */
  scale: number;
  /** 資料庫層必填 */
  dbRequired: boolean;
  /** 預設值 */
  defaultValue: string;
  /** 是否持久化到資料庫 */
  persistent: boolean;
  /** 欄位標題 (MAXATTRIBUTE.TITLE) */
  title: string;
  /** 所屬物件名稱 (如果不同於主 MBO) */
  objectName: string;
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
}
