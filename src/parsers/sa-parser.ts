import type {
  SAFieldDefinition,
  ProcessedField,
  ApplicationDefinition,
  TabDefinition,
  FieldType,
  InputMode,
  FieldArea,
  MaximoDataType,
} from '../types';
import { generateId } from '../utils/id-generator';

/**
 * Column name mappings from Chinese to English
 */
const COLUMN_MAPPINGS: Record<string, keyof SAFieldDefinition> = {
  '欄位名稱': 'fieldName',
  '標籤': 'label',
  '型別': 'type',
  '輸入模式': 'inputMode',
  'Lookup': 'lookup',
  '關聯': 'relationship',
  '連結應用': 'applink',
  '寬度': 'width',
  '可篩選': 'filterable',
  '可排序': 'sortable',
  '區域': 'area',
  'Tab名稱': 'tabName',
  // DB Configuration fields
  '資料類型': 'maxType',
  '長度': 'length',
  '小數位數': 'scale',
  'DB必填': 'dbRequired',
  '預設值': 'defaultValue',
  '持久化': 'persistent',
  '欄位標題': 'title',
  '所屬物件': 'objectName',
};

/**
 * Valid field types
 */
const VALID_TYPES: FieldType[] = [
  'textbox',
  'checkbox',
  'tablecol',
  'multiparttextbox',
  'multilinetextbox',
  'statictext',
  'pushbutton',
];

/**
 * Valid input modes
 */
const VALID_INPUT_MODES: InputMode[] = ['required', 'readonly', 'query', ''];

/**
 * Valid areas
 */
const VALID_AREAS: FieldArea[] = ['header', 'detail', 'list'];

/**
 * Valid Maximo data types
 */
const VALID_MAX_TYPES: MaximoDataType[] = [
  'ALN',
  'UPPER',
  'LOWER',
  'INTEGER',
  'SMALLINT',
  'DECIMAL',
  'FLOAT',
  'DATE',
  'DATETIME',
  'TIME',
  'YORN',
  'CLOB',
  'LONGALN',
  'GL',
];

/**
 * Parse a boolean value from Excel cell
 */
function parseBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toUpperCase() === 'TRUE';
  }
  return false;
}

/**
 * Parse a string value from Excel cell
 */
function parseString(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

/**
 * Parse a number value from Excel cell
 */
function parseNumber(value: unknown, defaultValue: number = 0): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
}

/**
 * Parse a single Excel row into SAFieldDefinition
 */
export function parseExcelRow(row: Record<string, unknown>): SAFieldDefinition {
  // UI fields
  const fieldName = parseString(row['欄位名稱']);
  const label = parseString(row['標籤']);
  const typeStr = parseString(row['型別']).toLowerCase() as FieldType;
  const inputModeStr = parseString(row['輸入模式']).toLowerCase() as InputMode;
  const lookup = parseString(row['Lookup']);
  const relationship = parseString(row['關聯']);
  const applink = parseString(row['連結應用']);
  const width = parseString(row['寬度']);
  const filterable = parseBoolean(row['可篩選']);
  const sortable = parseBoolean(row['可排序']);
  const areaStr = parseString(row['區域']).toLowerCase() as FieldArea;
  const tabName = parseString(row['Tab名稱']);

  // DB Configuration fields
  const maxTypeStr = parseString(row['資料類型']).toUpperCase() as MaximoDataType;
  const length = parseNumber(row['長度'], 0);
  const scale = parseNumber(row['小數位數'], 0);
  const dbRequired = parseBoolean(row['DB必填']);
  const defaultValue = parseString(row['預設值']);
  const persistent = parseBoolean(row['持久化']);
  const title = parseString(row['欄位標題']) || label; // Default to label if not provided
  const objectName = parseString(row['所屬物件']);

  // Validate type
  const type = VALID_TYPES.includes(typeStr) ? typeStr : 'textbox';

  // Validate input mode
  const inputMode = VALID_INPUT_MODES.includes(inputModeStr) ? inputModeStr : '';

  // Validate area
  const area = VALID_AREAS.includes(areaStr) ? areaStr : 'header';

  // Validate and default maxType based on UI type
  let maxType: MaximoDataType = 'ALN';
  if (VALID_MAX_TYPES.includes(maxTypeStr)) {
    maxType = maxTypeStr;
  } else {
    // Auto-detect based on UI type
    if (type === 'checkbox') {
      maxType = 'YORN';
    } else if (type === 'multilinetextbox') {
      maxType = 'CLOB';
    }
  }

  return {
    fieldName,
    label,
    type,
    inputMode,
    lookup,
    relationship,
    applink,
    width,
    filterable,
    sortable,
    area,
    tabName,
    // DB fields
    maxType,
    length,
    scale,
    dbRequired,
    defaultValue,
    persistent,
    title,
    objectName,
  };
}

/**
 * Generate field name when not provided
 */
export function generateFieldName(
  field: SAFieldDefinition,
  index: number
): string {
  const timestamp = Date.now();
  const label = field.label.toLowerCase().replace(/\s+/g, '_') || field.type;
  const area = field.area;
  const tab = field.tabName.toLowerCase().replace(/\s+/g, '_') || 'default';

  if (field.area === 'detail' && field.relationship) {
    return `detail_${field.relationship.toLowerCase()}_${label}_${timestamp}`;
  }

  if (field.area === 'list') {
    return `list_${label}_${timestamp}`;
  }

  return `${area}_${tab}_${label}_${timestamp}`;
}

/**
 * Process raw field definitions into processed fields with IDs
 */
export function processFields(fields: SAFieldDefinition[]): ProcessedField[] {
  return fields.map((field, index) => {
    const id = generateId();
    const fieldName = field.fieldName || generateFieldName(field, index);

    // Determine dataattribute based on relationship
    let dataattribute = fieldName;
    if (field.relationship && field.area === 'header') {
      dataattribute = `${field.relationship}.${fieldName}`;
    }

    return {
      ...field,
      id,
      fieldName,
      dataattribute,
    };
  });
}

/**
 * Group processed fields by area (list, header tabs, detail tables)
 */
export function groupFieldsByArea(
  fields: ProcessedField[]
): ApplicationDefinition {
  const listFields: ProcessedField[] = [];
  const tabs = new Map<string, TabDefinition>();

  for (const field of fields) {
    if (field.area === 'list') {
      listFields.push(field);
      continue;
    }

    // Get or create tab
    const tabName = field.tabName || 'main';
    if (!tabs.has(tabName)) {
      tabs.set(tabName, {
        id: generateId(),
        label: tabName,
        headerFields: [],
        detailTables: new Map(),
      });
    }

    const tab = tabs.get(tabName)!;

    if (field.area === 'header') {
      tab.headerFields.push(field);
    } else if (field.area === 'detail') {
      // Use relationship as the detail table key
      const tableRelationship = field.relationship || 'default';
      if (!tab.detailTables.has(tableRelationship)) {
        tab.detailTables.set(tableRelationship, []);
      }
      tab.detailTables.get(tableRelationship)!.push(field);
    }
  }

  return {
    listFields,
    tabs,
  };
}

/**
 * SA Parser class for parsing Excel files
 */
export class SAParser {
  /**
   * Parse Excel file and return application definition
   */
  async parseFile(filePath: string): Promise<ApplicationDefinition> {
    // Dynamic import to avoid issues in test environment
    const XLSX = await import('xlsx');

    const workbook = XLSX.default.readFile(filePath);

    // Try to find the field definition sheet
    let sheetName: string | undefined = workbook.SheetNames.find(
      (name) => name === '欄位定義' || name === 'Fields' || name === 'Sheet1'
    );

    if (!sheetName) {
      sheetName = workbook.SheetNames[0];
    }

    if (!sheetName) {
      throw new Error('No sheets found in Excel file');
    }

    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.default.utils.sheet_to_json(worksheet) as Record<
      string,
      unknown
    >[];

    // Parse rows
    const rawFields = rawData.map(parseExcelRow);

    // Process fields
    const processedFields = processFields(rawFields);

    // Group by area
    return groupFieldsByArea(processedFields);
  }

  /**
   * Parse raw data array (useful for testing)
   */
  parseData(data: Record<string, unknown>[]): ApplicationDefinition {
    const rawFields = data.map(parseExcelRow);
    const processedFields = processFields(rawFields);
    return groupFieldsByArea(processedFields);
  }
}
