import type { ProcessedField } from '../types';

/**
 * Build XML attributes string from key-value pairs
 */
function buildAttributes(attrs: Record<string, string | undefined>): string {
  return Object.entries(attrs)
    .filter(([_, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');
}

/**
 * Generate a textbox XML element
 */
export function generateTextbox(field: ProcessedField): string {
  const attrs: Record<string, string | undefined> = {
    dataattribute: field.dataattribute,
    id: field.id,
  };

  // Add optional attributes
  if (field.applink) {
    attrs.applink = field.applink;
  }

  if (field.inputMode) {
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
    id: field.id,
  };

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
  // Description attribute is typically fieldname.DESCRIPTION
  const baseAttr = field.dataattribute.includes('.')
    ? field.dataattribute
    : field.fieldName;
  const descDataattribute = `${baseAttr}.DESCRIPTION`;

  const attrs: Record<string, string | undefined> = {
    dataattribute: field.dataattribute,
    descdataattribute: descDataattribute,
    id: field.id,
  };

  if (field.applink) {
    attrs.applink = field.applink;
    attrs.menutype = 'normal';
  }

  if (field.label) {
    attrs.label = field.label;
  }

  if (field.lookup) {
    attrs.lookup = field.lookup;
  }

  const attrString = buildAttributes(attrs);
  return `<multiparttextbox ${attrString}/>`;
}
