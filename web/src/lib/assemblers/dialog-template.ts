import type { DialogTemplate, DialogDetailTable, SAFieldDefinition } from '../types';
import { generateId } from '../utils/id-generator';
import { generateTextbox, generateCheckbox, generateMultipartTextbox, generateMultilineTextbox } from '../generators';

/**
 * Process a SAFieldDefinition to a ProcessedField for generators
 */
function processField(field: SAFieldDefinition): SAFieldDefinition & { id: string; dataattribute: string } {
  const id = generateId();
  const dataattribute = field.relationship
    ? `${field.relationship}.${field.fieldName}`
    : field.fieldName;

  return {
    ...field,
    id,
    dataattribute,
  };
}

/**
 * Generate a field element based on its type
 */
function generateField(field: SAFieldDefinition): string {
  const processed = processField(field);

  switch (field.type) {
    case 'checkbox':
      return generateCheckbox(processed);
    case 'multiparttextbox':
      return generateMultipartTextbox(processed);
    case 'multilinetextbox':
      return generateMultilineTextbox(processed);
    case 'statictext':
      return `<statictext dataattribute="${processed.dataattribute}" id="${processed.id}" label="${field.label}"/>`;
    default:
      return generateTextbox(processed);
  }
}

/**
 * Generate a tablecol element for dialog tables
 */
function generateDialogTablecol(field: SAFieldDefinition): string {
  const id = generateId();
  const dataattribute = field.fieldName;

  let attrs = `dataattribute="${dataattribute}" id="${id}"`;

  if (field.label) {
    attrs += ` label="${field.label}"`;
  }

  if (field.inputMode && field.inputMode !== 'optional') {
    attrs += ` inputmode="${field.inputMode}"`;
  }

  if (field.lookup) {
    attrs += ` lookup="${field.lookup}"`;
  }

  if (field.width) {
    attrs += ` width="${field.width}"`;
  }

  return `<tablecol ${attrs}/>`;
}

/**
 * Generate a detail table for dialog
 */
function generateDialogDetailTable(table: DialogDetailTable): string {
  const tableId = generateId();
  const tablebodyId = generateId();

  // Build table attributes
  let tableAttrs = `id="${tableId}" relationship="${table.relationship}"`;

  if (table.label) {
    tableAttrs += ` label="${table.label}"`;
  }

  if (table.orderBy) {
    tableAttrs += ` orderby="${table.orderBy}"`;
  }

  if (table.beanclass) {
    tableAttrs += ` beanclass="${table.beanclass}"`;
  }

  // Generate tablecol elements
  const columns = table.fields
    .map(generateDialogTablecol)
    .join('\n\t\t\t\t\t\t');

  return `<table ${tableAttrs}>
\t\t\t\t\t<tablebody displayrowsperpage="10" id="${tablebodyId}">
\t\t\t\t\t\t${columns}
\t\t\t\t\t</tablebody>
\t\t\t\t</table>`;
}

/**
 * Generate a complete dialog template XML
 */
export function generateDialogTemplate(dialog: DialogTemplate): string {
  if (!dialog.dialogId) {
    return '';
  }

  // Build dialog attributes
  let dialogAttrs = `id="${dialog.dialogId}"`;

  if (dialog.label) {
    dialogAttrs += ` label="${dialog.label}"`;
  }

  if (dialog.beanclass) {
    dialogAttrs += ` beanclass="${dialog.beanclass}"`;
  }

  if (dialog.mboName) {
    dialogAttrs += ` mboname="${dialog.mboName}"`;
  } else if (dialog.relationship) {
    dialogAttrs += ` relationship="${dialog.relationship}"`;
  }

  // Generate header section if there are header fields
  let headerSection = '';
  if (dialog.headerFields.length > 0) {
    const sectionId = generateId();
    const sectionrowId = generateId();
    const sectioncolId = generateId();

    const headerFields = dialog.headerFields
      .map(generateField)
      .join('\n\t\t\t\t\t');

    headerSection = `<section id="${sectionId}">
\t\t\t\t<sectionrow id="${sectionrowId}">
\t\t\t\t\t<sectioncol id="${sectioncolId}">
\t\t\t\t\t\t${headerFields}
\t\t\t\t\t</sectioncol>
\t\t\t\t</sectionrow>
\t\t\t</section>`;
  }

  // Generate detail tables
  const detailTables = dialog.detailTables
    .filter(table => table.relationship && table.fields.length > 0)
    .map(generateDialogDetailTable)
    .join('\n\t\t\t');

  // Generate button group
  const buttongroupId = generateId();
  const okButtonId = generateId();
  const cancelButtonId = generateId();

  const buttonGroup = `<buttongroup id="${buttongroupId}">
\t\t\t\t<pushbutton default="true" id="${okButtonId}" label="OK" mxevent="dialogok"/>
\t\t\t\t<pushbutton id="${cancelButtonId}" label="Cancel" mxevent="dialogcancel"/>
\t\t\t</buttongroup>`;

  // Combine all parts
  const parts = [headerSection, detailTables, buttonGroup].filter(Boolean);
  const content = parts.join('\n\t\t\t');

  return `<dialog ${dialogAttrs}>
\t\t\t${content}
\t\t</dialog>`;
}

/**
 * Generate all dialog templates
 */
export function generateAllDialogTemplates(dialogs: DialogTemplate[]): string {
  return dialogs
    .filter(d => d.dialogId)
    .map(generateDialogTemplate)
    .join('\n\t\t');
}
