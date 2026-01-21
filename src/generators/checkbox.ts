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
 * Generate a checkbox XML element
 */
export function generateCheckbox(field: ProcessedField): string {
  const attrs: Record<string, string | undefined> = {
    dataattribute: field.dataattribute,
    id: field.id,
  };

  // Add label if provided
  if (field.label) {
    attrs.label = field.label;
  }

  const attrString = buildAttributes(attrs);
  return `<checkbox ${attrString}/>`;
}
