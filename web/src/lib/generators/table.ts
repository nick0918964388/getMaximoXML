import type { ProcessedField } from '../types';
import {
  generateTablecol,
  generateSelectRowTablecol,
  generateBookmarkTablecol,
} from './tablecol';
import { generateId } from '../utils/id-generator';

/**
 * Generate a buttongroup with pushbutton elements
 */
function generateButtongroup(buttonFields: ProcessedField[]): string {
  const buttongroupId = generateId();

  const buttons = buttonFields.map((field, index) => {
    const attrs: string[] = [];

    // First button with dialogok event gets default="true"
    if (index === 0 && field.mxevent === 'dialogok') {
      attrs.push('default="true"');
    }

    attrs.push(`id="${generateId()}"`);

    if (field.label) {
      attrs.push(`label="${field.label}"`);
    }

    if (field.mxevent) {
      attrs.push(`mxevent="${field.mxevent}"`);
    }

    return `<pushbutton ${attrs.join(' ')}/>`;
  });

  return `<buttongroup id="${buttongroupId}">
\t\t\t\t\t\t\t\t\t\t\t\t\t\t${buttons.join('\n\t\t\t\t\t\t\t\t\t\t\t\t\t\t')}
\t\t\t\t\t\t\t\t\t\t\t\t\t</buttongroup>`;
}

/**
 * Generate a detail table XML element
 */
export function generateTable(
  fields: ProcessedField[],
  relationship: string,
  label: string,
  orderBy?: string,
  beanclass?: string
): string {
  const tableId = generateId();
  const tablebodyId = generateId();

  // Separate fields into tablecol fields and pushbutton fields
  const tablecolFields = fields.filter((field) => field.type !== 'pushbutton');
  const buttonFields = fields.filter((field) => field.type === 'pushbutton');

  // Generate tablecol elements
  const columns = tablecolFields
    .map((field) => generateTablecol(field, false, true))
    .join('\n\t\t\t\t\t\t\t\t\t\t\t\t\t\t');

  // Build table attributes
  let tableAttrs = `id="${tableId}" label="${label}" relationship="${relationship}"`;
  if (orderBy) {
    tableAttrs += ` orderby="${orderBy}"`;
  }
  if (beanclass) {
    tableAttrs += ` beanclass="${beanclass}"`;
  }

  // Build table content
  const tablebodyContent = columns
    ? `<tablebody displayrowsperpage="10" id="${tablebodyId}">
\t\t\t\t\t\t\t\t\t\t\t\t\t\t${columns}
\t\t\t\t\t\t\t\t\t\t\t\t\t</tablebody>`
    : `<tablebody displayrowsperpage="10" id="${tablebodyId}">
\t\t\t\t\t\t\t\t\t\t\t\t\t</tablebody>`;

  // Add buttongroup if there are pushbutton fields
  const buttongroupContent = buttonFields.length > 0
    ? `\n\t\t\t\t\t\t\t\t\t\t\t\t\t${generateButtongroup(buttonFields)}`
    : '';

  return `<table ${tableAttrs}>
\t\t\t\t\t\t\t\t\t\t\t\t\t${tablebodyContent}${buttongroupContent}
\t\t\t\t\t\t\t\t\t\t\t\t</table>`;
}

/**
 * Generate the main list table XML element
 */
export function generateListTable(
  fields: ProcessedField[],
  mboName: string,
  orderBy?: string
): string {
  const tablebody = 'results_showlist_tablebody';

  // Generate the select row column first
  const selectRowCol = generateSelectRowTablecol(
    `${tablebody}_1`,
    fields[0]?.dataattribute || 'ticketid'
  );

  // Generate tablecol elements for all fields
  const columns = fields
    .map((field) => generateTablecol(field, true))
    .join('\n\t\t\t\t\t\t\t');

  // Generate bookmark column
  const bookmarkCol = generateBookmarkTablecol();

  // Build orderby attribute
  const orderByAttr = orderBy ? ` orderby="${orderBy}"` : '';

  return `<table datasrc="results_showlist" id="results_showlist" inputmode="readonly" mboname="${mboName}"${orderByAttr} selectmode="multiple" startempty="false">
\t\t\t\t\t\t<tablebody displayrowsperpage="50" filterable="true" filterexpanded="true" id="${tablebody}">
\t\t\t\t\t\t\t${selectRowCol}
\t\t\t\t\t\t\t${columns}
\t\t\t\t\t\t\t${bookmarkCol}
\t\t\t\t\t\t</tablebody>
\t\t\t\t\t</table>`;
}
