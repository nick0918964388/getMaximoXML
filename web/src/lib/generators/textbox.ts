import type { ProcessedField } from '../types';
import { generateId } from '../utils/id-generator';

/**
 * Build XML attributes string from key-value pairs
 */
function buildAttributes(attrs: Record<string, string | undefined>): string {
  return Object.entries(attrs)
    .filter((entry) => entry[1] !== undefined && entry[1] !== '')
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');
}

/**
 * Generate a textbox XML element
 */
export function generateTextbox(field: ProcessedField): string {
  const attrs: Record<string, string | undefined> = {
    dataattribute: field.dataattribute,
    id: generateId(),
  };

  // Add optional attributes
  if (field.applink) {
    attrs.applink = field.applink;
  }

  if (field.inputMode && field.inputMode !== 'optional') {
    attrs.inputmode = field.inputMode;
  }

  // Add label if provided
  if (field.label) {
    attrs.label = field.label;
  }

  if (field.lookup) {
    attrs.lookup = field.lookup;
  }

  // Add menutype if applink is provided
  if (field.applink) {
    attrs.menutype = 'NORMAL';
  }

  // Add size if width is provided
  if (field.width) {
    attrs.size = field.width;
  }

  const attrString = buildAttributes(attrs);
  return `<textbox ${attrString}/>`;
}

/**
 * Generate a multiline textbox XML element
 */
export function generateMultilineTextbox(
  field: ProcessedField,
  rows: number = 7
): string {
  const columns = field.width || '45';

  const attrs: Record<string, string | undefined> = {
    columns,
    dataattribute: field.dataattribute,
    id: generateId(),
  };

  // Add inputmode if not optional (default)
  if (field.inputMode && field.inputMode !== 'optional') {
    attrs.inputmode = field.inputMode;
  }

  if (field.label) {
    attrs.label = field.label;
  }

  attrs.rows = String(rows);

  const attrString = buildAttributes(attrs);
  return `<multilinetextbox ${attrString}/>`;
}

/**
 * Generate a multipart textbox XML element
 */
export function generateMultipartTextbox(field: ProcessedField): string {
  // Use provided descDataattribute or default to fieldname.DESCRIPTION
  let descDataattribute = field.descDataattribute;
  if (!descDataattribute) {
    const baseAttr = field.dataattribute.includes('.')
      ? field.dataattribute
      : field.fieldName;
    descDataattribute = `${baseAttr}.DESCRIPTION`;
  }

  const attrs: Record<string, string | undefined> = {
    dataattribute: field.dataattribute,
    descdataattribute: descDataattribute,
    id: generateId(),
  };

  if (field.applink) {
    attrs.applink = field.applink;
    attrs.menutype = 'normal';
  }

  // Add inputmode if not optional (default)
  if (field.inputMode && field.inputMode !== 'optional') {
    attrs.inputmode = field.inputMode;
  }

  if (field.label) {
    attrs.label = field.label;
  }

  // Add description label if provided
  if (field.descLabel) {
    attrs.desclabel = field.descLabel;
  }

  // Add description inputmode if not optional (default)
  if (field.descInputMode && field.descInputMode !== 'optional') {
    attrs.descinputmode = field.descInputMode;
  }

  if (field.lookup) {
    attrs.lookup = field.lookup;
  }

  const attrString = buildAttributes(attrs);
  return `<multiparttextbox ${attrString}/>`;
}
