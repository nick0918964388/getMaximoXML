import type { ProcessedField } from '../types';

/**
 * Generate attachments XML element
 * Format: <attachments id="xxx"/>
 */
export function generateAttachments(field: ProcessedField): string {
  return `<attachments id="${field.id}"/>`;
}
