import type { ProcessedField, MaximoDataType } from '../types';

/**
 * Convert Maximo data type to Oracle data type
 */
export function getOracleDataType(
  maxType: MaximoDataType,
  length: number,
  scale: number
): string {
  switch (maxType) {
    case 'ALN':
    case 'UPPER':
    case 'LOWER':
    case 'LONGALN':
      return `VARCHAR2(${length || 100})`;

    case 'INTEGER':
      return 'NUMBER(10)';

    case 'SMALLINT':
      return 'NUMBER(5)';

    case 'DECIMAL':
    case 'FLOAT':
      if (scale > 0) {
        return `NUMBER(${length || 10},${scale})`;
      }
      return `NUMBER(${length || 10})`;

    case 'DATE':
      return 'DATE';

    case 'DATETIME':
      return 'TIMESTAMP';

    case 'TIME':
      return 'DATE'; // Oracle stores time as DATE

    case 'YORN':
      return 'NUMBER(1)';

    case 'CLOB':
      return 'CLOB';

    case 'GL':
      return `VARCHAR2(${length || 20})`;

    default:
      return `VARCHAR2(${length || 100})`;
  }
}

/**
 * Escape single quotes in SQL strings
 */
function escapeSql(value: string): string {
  return value.replace(/'/g, "''");
}

/**
 * Generate INSERT statement for MAXATTRIBUTECFG table
 * This is the proper Maximo way - insert into CFG table, then run ConfigDB
 */
export function generateMaxAttributeCfgSQL(
  field: ProcessedField,
  mboName: string,
  attributeNo?: number
): string {
  // Skip fields with relationship (they belong to other objects)
  if (field.relationship && !field.objectName) {
    return '';
  }

  const objectName = field.objectName || mboName;
  const attributeName = field.fieldName.toUpperCase();
  const attrNo = attributeNo || Math.floor(Math.random() * 9000) + 1000;
  const length = field.length || getDefaultLength(field.maxType);

  const columns = [
    'OBJECTNAME',
    'ATTRIBUTENAME',
    'ATTRIBUTENO',
    'ALIAS',
    'MAXTYPE',
    'LENGTH',
    'SCALE',
    'TITLE',
    'REMARKS',
    'REQUIRED',
    'PERSISTENT',
    'USERDEFINED',
    'DEFAULTVALUE',
    'CHANGED',
  ];

  const values = [
    `'${objectName}'`,                                    // OBJECTNAME
    `'${attributeName}'`,                                 // ATTRIBUTENAME
    `${attrNo}`,                                          // ATTRIBUTENO
    `'${attributeName}'`,                                 // ALIAS
    `'${field.maxType}'`,                                 // MAXTYPE
    `${length}`,                                          // LENGTH
    `${field.scale}`,                                     // SCALE
    `'${escapeSql(field.title || field.label)}'`,         // TITLE
    `'${escapeSql(field.label)}'`,                        // REMARKS
    `${field.dbRequired ? 1 : 0}`,                        // REQUIRED
    `${field.persistent ? 1 : 0}`,                        // PERSISTENT
    `1`,                                                  // USERDEFINED (always 1 for custom fields)
    field.defaultValue ? `'${escapeSql(field.defaultValue)}'` : 'NULL', // DEFAULTVALUE
    `'I'`,                                                // CHANGED ('I' = Insert new attribute)
  ];

  return `INSERT INTO MAXATTRIBUTECFG (${columns.join(', ')})
VALUES (${values.join(', ')});`;
}

/**
 * Generate INSERT statement for MAXATTRIBUTE table (legacy - for reference only)
 * @deprecated Use generateMaxAttributeCfgSQL instead for proper Maximo configuration workflow
 */
export function generateMaxAttributeSQL(
  field: ProcessedField,
  mboName: string,
  attributeNo?: number
): string {
  // Skip fields with relationship (they belong to other objects)
  if (field.relationship && !field.objectName) {
    return '';
  }

  const objectName = field.objectName || mboName;
  const attributeName = field.fieldName.toUpperCase();
  const attrNo = attributeNo || Math.floor(Math.random() * 9000) + 1000;

  const columns = [
    'OBJECTNAME',
    'ATTRIBUTENAME',
    'ATTRIBUTENO',
    'ALIAS',
    'MAXTYPE',
    'LENGTH',
    'SCALE',
    'TITLE',
    'REMARKS',
    'REQUIRED',
    'PERSISTENT',
    'USERDEFINED',
    'DEFAULTVALUE',
  ];

  const values = [
    `'${objectName}'`,                                    // OBJECTNAME
    `'${attributeName}'`,                                 // ATTRIBUTENAME
    `${attrNo}`,                                          // ATTRIBUTENO
    `'${attributeName}'`,                                 // ALIAS
    `'${field.maxType}'`,                                 // MAXTYPE
    `${field.length || getDefaultLength(field.maxType)}`, // LENGTH
    `${field.scale}`,                                     // SCALE
    `'${escapeSql(field.title || field.label)}'`,         // TITLE
    `'${escapeSql(field.label)}'`,                        // REMARKS
    `${field.dbRequired ? 1 : 0}`,                        // REQUIRED
    `${field.persistent ? 1 : 0}`,                        // PERSISTENT
    `1`,                                                  // USERDEFINED (always 1 for custom fields)
    field.defaultValue ? `'${escapeSql(field.defaultValue)}'` : 'NULL', // DEFAULTVALUE
  ];

  return `INSERT INTO MAXATTRIBUTE (${columns.join(', ')})
VALUES (${values.join(', ')});`;
}

/**
 * Get default length for a data type
 */
function getDefaultLength(maxType: MaximoDataType): number {
  switch (maxType) {
    case 'ALN':
    case 'UPPER':
    case 'LOWER':
      return 100;
    case 'LONGALN':
      return 4000;
    case 'INTEGER':
      return 10;
    case 'SMALLINT':
      return 5;
    case 'DECIMAL':
    case 'FLOAT':
      return 10;
    case 'YORN':
      return 1;
    case 'GL':
      return 20;
    default:
      return 0;
  }
}

/**
 * Generate all SQL statements for a list of fields
 * Uses MAXATTRIBUTECFG for proper Maximo configuration workflow
 */
export function generateAllSQL(
  fields: ProcessedField[],
  mboName: string
): string {
  const lines: string[] = [];

  lines.push('-- =============================================');
  lines.push('-- Maximo Database Configuration SQL');
  lines.push(`-- Generated for MBO: ${mboName}`);
  lines.push(`-- Generated at: ${new Date().toISOString()}`);
  lines.push('-- =============================================');
  lines.push('--');
  lines.push('-- 使用方式:');
  lines.push('-- 1. 執行此 SQL 將欄位定義插入 MAXATTRIBUTECFG');
  lines.push('-- 2. 登入 Maximo 執行「資料庫配置」應用程式');
  lines.push('-- 3. 點選「套用配置變更」讓 Maximo 建立實際的資料庫欄位');
  lines.push('-- =============================================');
  lines.push('');

  // Filter fields that need configuration (persistent and belong to main object)
  const cfgFields = fields.filter(f =>
    f.persistent &&
    !f.relationship &&
    f.fieldName.toUpperCase().startsWith('ZZ_') // Only custom fields
  );

  if (cfgFields.length > 0) {
    lines.push('-- =============================================');
    lines.push('-- MAXATTRIBUTECFG INSERT statements');
    lines.push('-- 新增自訂欄位到配置表');
    lines.push('-- =============================================');
    lines.push('');

    let attributeNo = 1000;
    cfgFields.forEach(field => {
      const sql = generateMaxAttributeCfgSQL(field, mboName, attributeNo++);
      if (sql) {
        lines.push(sql);
        lines.push('');
      }
    });
  }

  lines.push('-- =============================================');
  lines.push('-- COMMIT');
  lines.push('-- =============================================');
  lines.push('COMMIT;');
  lines.push('');
  lines.push('-- =============================================');
  lines.push('-- 下一步: 執行 Maximo 資料庫配置');
  lines.push('-- 系統管理 > 配置 > 資料庫配置');
  lines.push('-- 選擇物件後點選「套用配置變更」');
  lines.push('-- =============================================');

  return lines.join('\n');
}

/**
 * Generate SQL for a specific object (child table)
 */
export function generateChildObjectSQL(
  fields: ProcessedField[],
  objectName: string
): string {
  const childFields = fields.filter(f => f.objectName === objectName);

  if (childFields.length === 0) {
    return '';
  }

  return generateAllSQL(childFields, objectName);
}
