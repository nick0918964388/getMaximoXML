import type { ProcessedField } from '../types';
import { generateTextbox, generateMultilineTextbox, generateMultipartTextbox } from './textbox';
import { generateCheckbox } from './checkbox';
import { generateAttachments } from './attachments';
import { generateId } from '../utils/id-generator';

interface SectionOptions {
  border?: boolean;
  relationship?: string;
}

/**
 * Default number of fields per column for auto-layout
 */
const DEFAULT_FIELDS_PER_COLUMN = 4;

/**
 * Group fields into columns based on column property or auto-layout
 * @param fields - Array of processed fields
 * @param fieldsPerColumn - Number of fields per column for auto-layout (default: 4)
 * @returns Array of field arrays, one for each column
 */
export function groupFieldsIntoColumns(
  fields: ProcessedField[],
  fieldsPerColumn: number = DEFAULT_FIELDS_PER_COLUMN
): ProcessedField[][] {
  // Check if any field has manual column assignment (column > 0)
  const hasManualColumns = fields.some((f) => f.column > 0);

  if (hasManualColumns) {
    // Group by manual column assignment
    const columnMap = new Map<number, ProcessedField[]>();

    for (const field of fields) {
      const col = field.column > 0 ? field.column : 1; // Default to column 1 if not specified
      if (!columnMap.has(col)) {
        columnMap.set(col, []);
      }
      columnMap.get(col)!.push(field);
    }

    // Sort by column number and return as array
    const sortedKeys = Array.from(columnMap.keys()).sort((a, b) => a - b);
    return sortedKeys.map((key) => columnMap.get(key)!);
  } else {
    // Auto-layout: split fields evenly into columns
    if (fields.length <= fieldsPerColumn) {
      return [fields];
    }

    const columns: ProcessedField[][] = [];
    for (let i = 0; i < fields.length; i += fieldsPerColumn) {
      columns.push(fields.slice(i, i + fieldsPerColumn));
    }
    return columns;
  }
}

/**
 * Generate a section XML element with content
 */
export function generateSection(
  id: string,
  content: string,
  options?: SectionOptions
): string {
  let attrs = `id="${id}"`;

  if (options?.border !== undefined) {
    attrs += ` border="${options.border}"`;
  }

  if (options?.relationship) {
    attrs += ` relationship="${options.relationship}"`;
  }

  return `<section ${attrs}>
${content}
\t\t\t\t\t\t\t\t</section>`;
}

/**
 * Generate field XML based on its type
 */
function generateFieldXml(field: ProcessedField): string {
  switch (field.type) {
    case 'checkbox':
      return generateCheckbox(field);
    case 'multilinetextbox':
      return generateMultilineTextbox(field);
    case 'multiparttextbox':
      return generateMultipartTextbox(field);
    case 'attachments':
      return generateAttachments(field);
    case 'textbox':
    default:
      return generateTextbox(field);
  }
}

/**
 * Generate a section with fields laid out in sectionrow/sectioncol
 * Supports multi-column layout based on field.column property or auto-layout
 * @param id - Section ID
 * @param fields - Array of processed fields
 * @param relationship - Optional relationship for the section
 * @param fieldsPerColumn - Number of fields per column for auto-layout (default: 4)
 */
export function generateSectionWithFields(
  id: string,
  fields: ProcessedField[],
  relationship?: string,
  fieldsPerColumn: number = DEFAULT_FIELDS_PER_COLUMN
): string {
  const sectionrowId = generateId();

  // Group fields into columns
  const columns = groupFieldsIntoColumns(fields, fieldsPerColumn);

  // Generate sectioncol for each column
  const sectioncolXmls = columns.map((columnFields) => {
    const sectioncolId = generateId();
    const innerSectionId = generateId();
    const fieldXmls = columnFields.map(generateFieldXml).join('\n\t\t\t\t\t\t\t\t\t\t\t\t\t');

    return `<sectioncol id="${sectioncolId}">
\t\t\t\t\t\t\t\t\t\t\t<section id="${innerSectionId}">
\t\t\t\t\t\t\t\t\t\t\t\t${fieldXmls}
\t\t\t\t\t\t\t\t\t\t\t</section>
\t\t\t\t\t\t\t\t\t\t</sectioncol>`;
  }).join('\n\t\t\t\t\t\t\t\t\t\t');

  // Build section attributes
  let sectionAttrs = `id="${id}"`;
  if (relationship) {
    sectionAttrs += ` relationship="${relationship}"`;
  }

  return `<section ${sectionAttrs}>
\t\t\t\t\t\t\t\t\t<sectionrow id="${sectionrowId}">
\t\t\t\t\t\t\t\t\t\t${sectioncolXmls}
\t\t\t\t\t\t\t\t\t</sectionrow>
\t\t\t\t\t\t\t\t</section>`;
}
