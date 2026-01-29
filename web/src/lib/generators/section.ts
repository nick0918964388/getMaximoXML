import type { ProcessedField } from '../types';
import { generateTextbox, generateMultilineTextbox, generateMultipartTextbox, generateStaticText, generatePushbutton, generateButtongroup, generateCombobox } from './textbox';
import { generateCheckbox } from './checkbox';
import { generateAttachments } from './attachments';
import { generateSemanticId } from '../utils/id-generator';

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
    case 'statictext':
      return generateStaticText(field);
    case 'pushbutton':
      return generatePushbutton(field);
    case 'combobox':
      return generateCombobox(field);
    case 'textbox':
    default:
      return generateTextbox(field);
  }
}

/**
 * Process fields to group consecutive pushbuttons into buttongroups
 * Returns array of either single fields or buttongroup arrays
 */
type FieldOrButtongroup = ProcessedField | ProcessedField[];

function groupConsecutivePushbuttons(fields: ProcessedField[]): FieldOrButtongroup[] {
  const result: FieldOrButtongroup[] = [];
  let currentPushbuttonGroup: ProcessedField[] = [];

  const flushPushbuttonGroup = () => {
    if (currentPushbuttonGroup.length >= 2) {
      result.push([...currentPushbuttonGroup]);
    } else if (currentPushbuttonGroup.length === 1) {
      // Single pushbutton, don't wrap in group
      result.push(currentPushbuttonGroup[0]);
    }
    currentPushbuttonGroup = [];
  };

  for (const field of fields) {
    if (field.type === 'pushbutton') {
      currentPushbuttonGroup.push(field);
    } else {
      flushPushbuttonGroup();
      result.push(field);
    }
  }

  flushPushbuttonGroup();
  return result;
}

/**
 * Generate XML for a field or buttongroup
 */
function generateFieldOrButtongroupXml(item: FieldOrButtongroup): string {
  if (Array.isArray(item)) {
    return generateButtongroup(item);
  } else {
    return generateFieldXml(item);
  }
}

/**
 * Options for generateSectionWithFields
 */
export interface SectionWithFieldsOptions {
  /** Add border="true" attribute */
  border?: boolean;
  /** Relationship for the section */
  relationship?: string;
  /** Number of fields per column for auto-layout (default: 4) */
  fieldsPerColumn?: number;
}

/**
 * Generate a section with fields laid out in sectionrow/sectioncol
 * Supports multi-column layout based on field.column property or auto-layout
 * @param id - Section ID
 * @param fields - Array of processed fields
 * @param options - Optional configuration (border, relationship, fieldsPerColumn)
 */
export function generateSectionWithFields(
  id: string,
  fields: ProcessedField[],
  options?: SectionWithFieldsOptions
): string {
  const fieldsPerColumn = options?.fieldsPerColumn ?? DEFAULT_FIELDS_PER_COLUMN;
  // Use semantic ID for sectionrow: {sectionId}_row1
  const sectionrowId = generateSemanticId(id, 'row1');

  // Group fields into columns
  const columns = groupFieldsIntoColumns(fields, fieldsPerColumn);

  // Generate sectioncol for each column
  const sectioncolXmls = columns.map((columnFields, colIndex) => {
    // Use semantic ID: {sectionId}_row1_col{n}
    const sectioncolId = generateSemanticId(sectionrowId, `col${colIndex + 1}`);
    // Use semantic ID for inner section: {sectioncolId}_section
    const innerSectionId = generateSemanticId(sectioncolId, 'section');
    // Group consecutive pushbuttons into buttongroups
    const groupedFields = groupConsecutivePushbuttons(columnFields);
    const fieldXmls = groupedFields.map(generateFieldOrButtongroupXml).join('\n\t\t\t\t\t\t\t\t\t\t\t\t\t');

    return `<sectioncol id="${sectioncolId}">
\t\t\t\t\t\t\t\t\t\t\t<section id="${innerSectionId}">
\t\t\t\t\t\t\t\t\t\t\t\t${fieldXmls}
\t\t\t\t\t\t\t\t\t\t\t</section>
\t\t\t\t\t\t\t\t\t\t</sectioncol>`;
  }).join('\n\t\t\t\t\t\t\t\t\t\t');

  // Build section attributes
  let sectionAttrs = `id="${id}"`;
  if (options?.border !== undefined) {
    sectionAttrs += ` border="${options.border}"`;
  }
  if (options?.relationship) {
    sectionAttrs += ` relationship="${options.relationship}"`;
  }

  return `<section ${sectionAttrs}>
\t\t\t\t\t\t\t\t\t<sectionrow id="${sectionrowId}">
\t\t\t\t\t\t\t\t\t\t${sectioncolXmls}
\t\t\t\t\t\t\t\t\t</sectionrow>
\t\t\t\t\t\t\t\t</section>`;
}
