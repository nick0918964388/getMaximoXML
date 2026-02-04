/**
 * DBC (Database Configuration) Generator
 * Generates Maximo DBC script files from FMB XML data
 */

import type { FmbModule, DbcScript, DbcTableDefinition, DbcAttributeDefinition, DbcDataType, DbcScriptMetadata, DbcGenerationResult, DbcGeneratorConfig, MboExtractionResult, DbcRelationshipDefinition } from './types';
import { DEFAULT_DBC_CONFIG, DEFAULT_DBC_METADATA } from './types';
import type { SAFieldDefinition, ApplicationMetadata, MaximoDataType } from '../types';

/**
 * Amount-related field name patterns
 */
const AMOUNT_FIELD_PATTERNS = ['AMT', 'AMOUNT', 'PRICE', 'COST'];

/**
 * String types that require length attribute
 */
const STRING_TYPES: DbcDataType[] = ['ALN', 'UPPER', 'LOWER', 'LONGALN'];

/**
 * Maps Maximo data type to DBC data type
 * @param maxType Maximo data type
 * @param fieldName Optional field name for context-based mapping (e.g., DECIMAL to AMOUNT)
 * @returns DBC data type
 */
export function mapMaximoTypeToDbcType(maxType: MaximoDataType, fieldName?: string): DbcDataType {
  // Handle DECIMAL type with context-based mapping
  if (maxType === 'DECIMAL' && fieldName) {
    const upperFieldName = fieldName.toUpperCase();
    const isAmountField = AMOUNT_FIELD_PATTERNS.some(pattern => upperFieldName.includes(pattern));
    if (isAmountField) {
      return 'AMOUNT';
    }
  }

  // Direct mapping for most types
  const typeMap: Record<string, DbcDataType> = {
    ALN: 'ALN',
    UPPER: 'UPPER',
    LOWER: 'LOWER',
    INTEGER: 'INTEGER',
    SMALLINT: 'SMALLINT',
    DECIMAL: 'DECIMAL',
    FLOAT: 'FLOAT',
    AMOUNT: 'AMOUNT',
    DATE: 'DATE',
    DATETIME: 'DATETIME',
    TIME: 'TIME',
    YORN: 'YORN',
    CLOB: 'CLOB',
    LONGALN: 'LONGALN',
    GL: 'GL',
  };

  return typeMap[maxType] ?? 'ALN';
}

/**
 * Field types to exclude from DBC (non-persistent UI elements)
 */
const EXCLUDED_FIELD_TYPES = ['pushbutton', 'statictext'];

/**
 * Converts fields to DBC attributes, removing duplicates by field name
 * @param fields Fields to convert
 * @returns Array of DBC attribute definitions (unique by attribute name)
 */
function fieldsToAttributes(fields: SAFieldDefinition[]): DbcAttributeDefinition[] {
  const seenAttributes = new Set<string>();
  const attributes: DbcAttributeDefinition[] = [];

  for (const field of fields) {
    // Skip duplicate field names
    if (seenAttributes.has(field.fieldName)) {
      continue;
    }
    seenAttributes.add(field.fieldName);

    const dbcType = mapMaximoTypeToDbcType(field.maxType, field.fieldName);
    const attr: DbcAttributeDefinition = {
      attribute: field.fieldName,
      maxtype: dbcType,
      title: field.title || field.label || field.fieldName,
      remarks: field.label || field.title || '',
      required: field.dbRequired,
    };

    // Add length for string types
    if (STRING_TYPES.includes(dbcType) && field.length) {
      attr.length = field.length;
    }

    attributes.push(attr);
  }

  return attributes;
}

/**
 * Determines primary key from fields
 * @param fields Fields to search
 * @returns Primary key field name
 */
function determinePrimaryKey(fields: SAFieldDefinition[]): string {
  const requiredField = fields.find(f => f.dbRequired);
  return requiredField?.fieldName || fields[0]?.fieldName || 'ID';
}

/**
 * Extracts MBO definitions from FmbModule and field definitions
 * @param fmbModule Parsed FMB module
 * @param fields SA field definitions from converter
 * @param metadata Application metadata (contains mboName)
 * @param config Optional DBC generator config
 * @returns MBO extraction result with tables and relationships
 */
export function extractMboDefinitions(
  fmbModule: FmbModule,
  fields: SAFieldDefinition[],
  metadata: ApplicationMetadata,
  config: DbcGeneratorConfig = DEFAULT_DBC_CONFIG
): MboExtractionResult {
  const tables: DbcTableDefinition[] = [];
  const relationships: DbcRelationshipDefinition[] = [];

  // Use metadata.mboName as the main table name (not queryDataSource)
  const mainMboName = metadata.mboName;

  if (!mainMboName) {
    return { tables: [], relationships: [] };
  }

  // Filter out UI-only fields (buttons, static text, list area)
  const persistentFields = fields.filter(f => {
    // Exclude UI-only field types
    if (EXCLUDED_FIELD_TYPES.includes(f.type)) return false;
    // Exclude list area fields (duplicates)
    if (f.area === 'list') return false;
    return true;
  });

  if (persistentFields.length === 0) {
    return { tables: [], relationships: [] };
  }

  // Separate header fields (main MBO) from detail fields (child MBOs)
  const headerFields = persistentFields.filter(f => f.area === 'header');
  const detailFields = persistentFields.filter(f => f.area === 'detail' && f.relationship);

  // Generate main table from header fields
  if (headerFields.length > 0) {
    // Create primary key field: {objectname}ID with BIGINT type
    const primaryKeyAttr: DbcAttributeDefinition = {
      attribute: `${mainMboName}ID`,
      maxtype: 'BIGINT',
      title: `${mainMboName} ID`,
      remarks: '主鍵',
      required: true,
    };

    const mainTable: DbcTableDefinition = {
      object: mainMboName,
      description: fmbModule.title || fmbModule.name || mainMboName,
      type: config.defaultType,
      primarykey: `${mainMboName}ID`,
      classname: config.defaultClassname,
      service: config.defaultService,
      attributes: [primaryKeyAttr, ...fieldsToAttributes(headerFields)],
    };
    tables.push(mainTable);
  }

  // Group detail fields by relationship to generate child tables
  const relationshipGroups = new Map<string, SAFieldDefinition[]>();
  for (const field of detailFields) {
    const rel = field.relationship;
    if (!relationshipGroups.has(rel)) {
      relationshipGroups.set(rel, []);
    }
    relationshipGroups.get(rel)!.push(field);
  }

  // Generate child tables and relationships
  for (const [relationshipName, relationshipFields] of relationshipGroups) {
    // Create primary key field for child table: {relationshipName}ID with BIGINT type
    const childPrimaryKeyAttr: DbcAttributeDefinition = {
      attribute: `${relationshipName}ID`,
      maxtype: 'BIGINT',
      title: `${relationshipName} ID`,
      remarks: '主鍵',
      required: true,
    };

    // Generate child table definition
    const childTable: DbcTableDefinition = {
      object: relationshipName,
      description: `${mainMboName} - ${relationshipName}`,
      type: config.defaultType,
      primarykey: `${relationshipName}ID`,
      classname: config.defaultClassname,
      service: config.defaultService,
      attributes: [childPrimaryKeyAttr, ...fieldsToAttributes(relationshipFields)],
    };
    tables.push(childTable);

    // Generate relationship definition
    // Try to find the primary key field for whereclause
    const primaryKeyField = determinePrimaryKey(headerFields);
    const relationship: DbcRelationshipDefinition = {
      name: relationshipName,
      parent: mainMboName,
      child: relationshipName,
      whereclause: `${primaryKeyField.toLowerCase()} = :${primaryKeyField.toLowerCase()}`,
      remarks: `${mainMboName} 與 ${relationshipName} 的關聯`,
    };
    relationships.push(relationship);
  }

  return { tables, relationships };
}

/**
 * Escapes special XML characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generates DBC XML content from script definition
 * @param script DBC script definition
 * @returns XML string
 */
export function generateDbcXml(script: DbcScript): string {
  const lines: string[] = [];

  // XML declaration
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<!DOCTYPE script SYSTEM "script.dtd">');

  // Script root element with metadata
  const descAttr = script.metadata.description
    ? ` description="${escapeXml(script.metadata.description)}"`
    : '';
  lines.push(`<script author="${escapeXml(script.metadata.author)}" scriptname="${escapeXml(script.metadata.scriptname)}"${descAttr}>`);

  // Statements wrapper
  const hasContent = script.tables.length > 0 || (script.relationships && script.relationships.length > 0);
  if (hasContent) {
    lines.push('  <statements>');

    // Generate define_table elements
    for (const table of script.tables) {
      lines.push(`    <define_table object="${escapeXml(table.object)}" description="${escapeXml(table.description)}" type="${table.type}" primarykey="${escapeXml(table.primarykey)}" classname="${escapeXml(table.classname)}" service="${escapeXml(table.service)}">`);

      // Generate attrdef elements
      for (const attr of table.attributes) {
        const lengthAttr = attr.length !== undefined && STRING_TYPES.includes(attr.maxtype)
          ? ` length="${attr.length}"`
          : '';
        const requiredAttr = attr.required !== undefined
          ? ` required="${attr.required}"`
          : '';

        lines.push(`      <attrdef attribute="${escapeXml(attr.attribute)}" maxtype="${attr.maxtype}"${lengthAttr} title="${escapeXml(attr.title)}" remarks="${escapeXml(attr.remarks)}"${requiredAttr}/>`);
      }

      lines.push('    </define_table>');
    }

    // Generate create_relationship elements
    if (script.relationships && script.relationships.length > 0) {
      lines.push('');  // Add blank line between tables and relationships
      for (const rel of script.relationships) {
        lines.push(`    <create_relationship name="${escapeXml(rel.name)}" parent="${escapeXml(rel.parent)}" child="${escapeXml(rel.child)}" whereclause="${escapeXml(rel.whereclause)}" remarks="${escapeXml(rel.remarks)}" />`);
      }
    }

    lines.push('  </statements>');
  }

  lines.push('</script>');

  return lines.join('\n');
}

/**
 * Generates complete DBC output including XML content and metadata
 * @param fields SA field definitions
 * @param fmbModule FMB module data
 * @param metadata Application metadata
 * @param scriptMetadata Optional script metadata (author, scriptname, description)
 * @returns DBC generation result
 */
export function generateDbc(
  fields: SAFieldDefinition[],
  fmbModule: FmbModule,
  metadata: ApplicationMetadata,
  scriptMetadata?: Partial<DbcScriptMetadata>
): DbcGenerationResult {
  // Extract MBO definitions (pass metadata for correct mboName)
  const { tables, relationships } = extractMboDefinitions(fmbModule, fields, metadata);

  // Build script metadata with defaults
  const mergedMetadata: DbcScriptMetadata = {
    author: scriptMetadata?.author || DEFAULT_DBC_METADATA.author,
    scriptname: scriptMetadata?.scriptname || `${metadata.mboName || fmbModule.name}_SETUP`,
    description: scriptMetadata?.description || DEFAULT_DBC_METADATA.description,
  };

  // Build script definition
  const script: DbcScript = {
    metadata: mergedMetadata,
    tables,
    relationships,
  };

  // Generate XML content
  const content = generateDbcXml(script);

  // Generate suggested filename
  const suggestedFilename = `${fmbModule.name}_dbc.dbc`;

  return {
    content,
    script,
    suggestedFilename,
  };
}

/**
 * Field validation result
 */
export interface FieldValidationResult {
  /** Fields that are in Maximo XML but missing from DBC */
  missingFields: string[];
  /** Fields that are in DBC */
  dbcFields: string[];
  /** All expected fields from Maximo XML (excluding buttons/statictext/list) */
  expectedFields: string[];
  /** Whether all expected fields are in DBC */
  isValid: boolean;
}

/**
 * Validates that all Maximo XML fields have corresponding DBC fields
 * @param fields SA field definitions from converter
 * @param dbcScript Generated DBC script
 * @returns Validation result with missing fields
 */
export function validateFieldCoverage(
  fields: SAFieldDefinition[],
  dbcScript: DbcScript
): FieldValidationResult {
  // Get expected fields: exclude buttons, statictext, and list area
  const expectedFields = fields
    .filter(f => !EXCLUDED_FIELD_TYPES.includes(f.type) && f.area !== 'list')
    .map(f => f.fieldName);

  // Remove duplicates from expected fields
  const uniqueExpectedFields = [...new Set(expectedFields)];

  // Get all DBC attribute names (excluding auto-generated primary keys)
  const dbcFields = new Set<string>();
  for (const table of dbcScript.tables) {
    for (const attr of table.attributes) {
      // Skip auto-generated primary keys (ending with ID and type BIGINT)
      if (attr.maxtype === 'BIGINT' && attr.attribute.endsWith('ID')) {
        continue;
      }
      dbcFields.add(attr.attribute);
    }
  }

  // Find missing fields
  const missingFields = uniqueExpectedFields.filter(f => !dbcFields.has(f));

  return {
    missingFields,
    dbcFields: [...dbcFields],
    expectedFields: uniqueExpectedFields,
    isValid: missingFields.length === 0,
  };
}

/**
 * Triggers browser download of DBC file
 * @param content DBC XML content
 * @param filename Filename for download
 */
export function downloadDbc(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}
