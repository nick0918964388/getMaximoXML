import type {
  SAFieldDefinition,
  ProcessedField,
  ApplicationDefinition,
  TabDefinition
} from './types';
import { generateId } from './utils/id-generator';

/**
 * Generate field name from label if not provided
 * Only uses English characters - Chinese characters are removed
 * Returns empty string if no valid characters found (user must provide manually)
 */
export function generateFieldName(label: string): string {
  if (!label) return '';

  // Remove Chinese characters and other non-alphanumeric characters
  // Only keep A-Z, a-z, 0-9
  const fieldName = label
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '_')  // Replace all non-alphanumeric with underscore
    .replace(/_+/g, '_')          // Collapse multiple underscores
    .replace(/^_|_$/g, '');       // Remove leading/trailing underscores

  // Return empty if no valid characters (e.g., label was all Chinese)
  if (!fieldName) return '';

  // Prefix with ZZ_ for custom fields
  return `ZZ_${fieldName}`;
}

/**
 * Process a single field definition
 * Generates ID and dataattribute
 */
export function processField(field: SAFieldDefinition): ProcessedField {
  const id = generateId();

  // Generate field name if not provided
  const fieldName = field.fieldName || generateFieldName(field.label);

  // Generate dataattribute based on area and relationship
  // - Header fields with relationship: use "relationship.fieldName" format (data from related MBO)
  // - Detail fields: use "fieldName" only (table element handles the relationship)
  // - List fields: use "fieldName" only
  let dataattribute = fieldName;
  if (field.relationship && field.area === 'header') {
    dataattribute = `${field.relationship}.${fieldName}`;
  }
  // Detail and list fields keep dataattribute as just fieldName

  return {
    ...field,
    fieldName,
    id,
    dataattribute,
  };
}

/**
 * Process all fields and group them into an ApplicationDefinition
 */
export function processFields(fields: SAFieldDefinition[]): ApplicationDefinition {
  const processedFields = fields.map(processField);

  const listFields: ProcessedField[] = [];
  const tabsMap = new Map<string, TabDefinition>();

  for (const field of processedFields) {
    if (field.area === 'list') {
      listFields.push(field);
    } else {
      // Header and detail fields go into tabs
      const tabName = field.tabName || 'Main';

      if (!tabsMap.has(tabName)) {
        tabsMap.set(tabName, {
          id: `tab_${tabName.toLowerCase().replace(/\s+/g, '_')}`,
          label: tabName,
          headerFields: [],
          detailTables: new Map(),
        });
      }

      const tab = tabsMap.get(tabName)!;

      if (field.area === 'header') {
        tab.headerFields.push(field);
      } else if (field.area === 'detail') {
        const relationship = field.relationship || 'default';
        if (!tab.detailTables.has(relationship)) {
          tab.detailTables.set(relationship, []);
        }
        tab.detailTables.get(relationship)!.push(field);
      }
    }
  }

  return {
    listFields,
    tabs: tabsMap,
  };
}

/**
 * Check if a string contains Chinese characters
 */
export function containsChinese(str: string): boolean {
  return /[\u4e00-\u9fff]/.test(str);
}

/**
 * Validate a field definition
 * Returns array of error messages
 */
export function validateField(field: SAFieldDefinition): string[] {
  const errors: string[] = [];

  if (!field.label) {
    errors.push('Label is required');
  }

  // Check if field name is needed when label contains Chinese
  if (containsChinese(field.label) && !field.fieldName) {
    errors.push('Field name is required when label contains Chinese characters');
  }

  if (!field.area) {
    errors.push('Area is required');
  }

  if (field.area === 'detail' && !field.relationship) {
    errors.push('Relationship is required for detail fields');
  }

  if (field.maxType === 'DECIMAL' && field.scale < 0) {
    errors.push('Scale must be non-negative for DECIMAL type');
  }

  if (field.length < 0) {
    errors.push('Length must be non-negative');
  }

  return errors;
}

/**
 * Validate all fields
 * Returns map of field index to error messages
 */
export function validateFields(fields: SAFieldDefinition[]): Map<number, string[]> {
  const errors = new Map<number, string[]>();

  fields.forEach((field, index) => {
    const fieldErrors = validateField(field);
    if (fieldErrors.length > 0) {
      errors.set(index, fieldErrors);
    }
  });

  return errors;
}
