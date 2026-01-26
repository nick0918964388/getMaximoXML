import type {
  SAFieldDefinition,
  ProcessedField,
  ApplicationDefinition,
  TabDefinition
} from './types';
import { generateId } from './utils/id-generator';
import {
  translateToFieldName,
  translateToFieldNameSync,
  containsChinese as checkChinese,
} from './translation-service';

/**
 * Generate field name from label if not provided (synchronous)
 * For English labels: converts to uppercase with underscores
 * For Chinese labels: uses dictionary lookup (returns empty if not found)
 * Returns empty string if no valid characters found
 */
export function generateFieldName(label: string): string {
  if (!label) return '';

  // Try synchronous translation (dictionary + cache)
  const translated = translateToFieldNameSync(label);
  if (translated !== null) {
    return translated;
  }

  // Fallback: Remove Chinese characters and other non-alphanumeric characters
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
 * Generate field name from label asynchronously
 * Uses dictionary first, then Google Translate API for Chinese labels
 */
export async function generateFieldNameAsync(label: string): Promise<string> {
  if (!label) return '';

  // Use translation service (handles both dictionary and API)
  return translateToFieldName(label);
}

// Re-export for convenience
export { translateToFieldNameSync, translateToFieldName, checkChinese as containsChineseChars };

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
 * Get the order value for a field, using the index as fallback for legacy data
 */
function getFieldOrder(field: ProcessedField, index: number): number {
  return field.order ?? index;
}

/**
 * Sort fields by order, handling legacy data without order property
 */
function sortFieldsByOrder(fields: ProcessedField[]): ProcessedField[] {
  return [...fields].sort((a, b) => {
    const indexA = fields.indexOf(a);
    const indexB = fields.indexOf(b);
    return getFieldOrder(a, indexA) - getFieldOrder(b, indexB);
  });
}

/**
 * Process all fields and group them into an ApplicationDefinition
 */
export function processFields(fields: SAFieldDefinition[]): ApplicationDefinition {
  const processedFields = fields.map((field, index) => ({
    ...processField(field),
    _originalIndex: index, // Track original index for sorting fallback
  }));

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
          subTabs: new Map(),
        });
      }

      const tab = tabsMap.get(tabName)!;
      const subTabName = field.subTabName;

      // If field has a subTabName, group it into subTabs
      if (subTabName) {
        if (!tab.subTabs.has(subTabName)) {
          tab.subTabs.set(subTabName, {
            id: `subtab_${subTabName.toLowerCase().replace(/\s+/g, '_')}`,
            label: subTabName,
            headerFields: [],
            detailTables: new Map(),
          });
        }

        const subTab = tab.subTabs.get(subTabName)!;

        if (field.area === 'header') {
          subTab.headerFields.push(field);
        } else if (field.area === 'detail') {
          const relationship = field.relationship || 'default';
          if (!subTab.detailTables.has(relationship)) {
            subTab.detailTables.set(relationship, []);
          }
          subTab.detailTables.get(relationship)!.push(field);
        }
      } else {
        // No subTabName, add directly to tab
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
  }

  // Sort all field arrays by order
  const sortedListFields = sortFieldsByOrder(listFields);

  // Sort fields within each tab
  for (const tab of tabsMap.values()) {
    tab.headerFields = sortFieldsByOrder(tab.headerFields);

    // Sort detail table fields
    for (const [relationship, detailFields] of tab.detailTables) {
      tab.detailTables.set(relationship, sortFieldsByOrder(detailFields));
    }

    // Sort subTab fields
    for (const subTab of tab.subTabs.values()) {
      subTab.headerFields = sortFieldsByOrder(subTab.headerFields);
      for (const [relationship, detailFields] of subTab.detailTables) {
        subTab.detailTables.set(relationship, sortFieldsByOrder(detailFields));
      }
    }
  }

  return {
    listFields: sortedListFields,
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
