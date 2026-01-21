import type { ProcessedField } from '../types';
import { generateTextbox, generateMultilineTextbox, generateMultipartTextbox } from './textbox';
import { generateCheckbox } from './checkbox';
import { generateId } from '../utils/id-generator';

interface SectionOptions {
  border?: boolean;
  relationship?: string;
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
    case 'textbox':
    default:
      return generateTextbox(field);
  }
}

/**
 * Generate a section with fields laid out in sectionrow/sectioncol
 */
export function generateSectionWithFields(
  id: string,
  fields: ProcessedField[],
  relationship?: string
): string {
  const sectionrowId = generateId();
  const sectioncolId = generateId();

  // Generate field XML elements
  const fieldXmls = fields.map(generateFieldXml).join('\n\t\t\t\t\t\t\t\t\t\t\t\t\t');

  // Build section attributes
  let sectionAttrs = `id="${id}"`;
  if (relationship) {
    sectionAttrs += ` relationship="${relationship}"`;
  }

  return `<section ${sectionAttrs}>
\t\t\t\t\t\t\t\t\t<sectionrow id="${sectionrowId}">
\t\t\t\t\t\t\t\t\t\t<sectioncol id="${sectioncolId}">
\t\t\t\t\t\t\t\t\t\t\t<section id="${generateId()}">
\t\t\t\t\t\t\t\t\t\t\t\t${fieldXmls}
\t\t\t\t\t\t\t\t\t\t\t</section>
\t\t\t\t\t\t\t\t\t\t</sectioncol>
\t\t\t\t\t\t\t\t\t</sectionrow>
\t\t\t\t\t\t\t\t</section>`;
}
