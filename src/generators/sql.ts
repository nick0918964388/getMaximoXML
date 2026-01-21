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
 * Generate ALTER TABLE statement for adding a column
 */
export function generateAlterTableSQL(
  field: ProcessedField,
  mboName: string
): string {
  // Skip non-persistent fields
  if (!field.persistent) {
    return '';
  }

  // Skip fields with relationship (they belong to other tables)
  if (field.relationship) {
    return '';
  }

  const tableName = field.objectName || mboName;
  const columnName = field.fieldName.toUpperCase();
  const dataType = getOracleDataType(field.maxType, field.length, field.scale);

  let sql = `ALTER TABLE ${tableName} ADD ${columnName} ${dataType}`;

  // Add DEFAULT clause if defaultValue is provided
  if (field.defaultValue) {
    // Check if it's a numeric default
    if (['INTEGER', 'SMALLINT', 'DECIMAL', 'FLOAT', 'YORN'].includes(field.maxType)) {
      sql += ` DEFAULT ${field.defaultValue}`;
    } else {
      sql += ` DEFAULT '${escapeSql(field.defaultValue)}'`;
    }
  }

  // Add NOT NULL if required
  if (field.dbRequired) {
    sql += ' NOT NULL';
  }

  sql += ';';

  return sql;
}

/**
 * Generate INSERT statement for MAXATTRIBUTE table
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
 */
export function generateAllSQL(
  fields: ProcessedField[],
  mboName: string
): string {
  const lines: string[] = [];

  lines.push('-- =============================================');
  lines.push('-- Database Configuration SQL');
  lines.push(`-- Generated for MBO: ${mboName}`);
  lines.push(`-- Generated at: ${new Date().toISOString()}`);
  lines.push('-- =============================================');
  lines.push('');

  // Filter fields that need ALTER TABLE (persistent and belong to main object)
  const alterTableFields = fields.filter(f =>
    f.persistent &&
    !f.relationship &&
    f.fieldName.toUpperCase().startsWith('ZZ_') // Only custom fields
  );

  if (alterTableFields.length > 0) {
    lines.push('-- =============================================');
    lines.push('-- ALTER TABLE statements');
    lines.push('-- Add columns to the database table');
    lines.push('-- =============================================');
    lines.push('');

    alterTableFields.forEach(field => {
      const sql = generateAlterTableSQL(field, mboName);
      if (sql) {
        lines.push(sql);
      }
    });

    lines.push('');
  }

  // Generate MAXATTRIBUTE INSERT statements
  const maxAttrFields = fields.filter(f =>
    f.persistent &&
    !f.relationship &&
    f.fieldName.toUpperCase().startsWith('ZZ_')
  );

  if (maxAttrFields.length > 0) {
    lines.push('-- =============================================');
    lines.push('-- MAXATTRIBUTE INSERT statements');
    lines.push('-- Register attributes in Maximo metadata');
    lines.push('-- =============================================');
    lines.push('');

    let attributeNo = 1000;
    maxAttrFields.forEach(field => {
      const sql = generateMaxAttributeSQL(field, mboName, attributeNo++);
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
