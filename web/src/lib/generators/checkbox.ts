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
 * Generate a checkbox XML element
 */
export function generateCheckbox(field: ProcessedField): string {
  const attrs: Record<string, string | undefined> = {
    dataattribute: field.dataattribute,
    id: generateId(),
  };

  // Add inputmode if not optional (default)
  if (field.inputMode && field.inputMode !== 'optional') {
    attrs.inputmode = field.inputMode;
  }

  // Add label if provided
  if (field.label) {
    attrs.label = field.label;
  }

  const attrString = buildAttributes(attrs);
  return `<checkbox ${attrString}/>`;
}
