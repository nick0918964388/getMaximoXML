import type { ProcessedField } from '../types';
import {
  generateTablecol,
  generateSelectRowTablecol,
  generateBookmarkTablecol,
} from './tablecol';
import { generateId } from '../utils/id-generator';

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

  // Generate tablecol elements
  const columns = fields
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

  return `<table ${tableAttrs}>
\t\t\t\t\t\t\t\t\t\t\t\t\t<tablebody displayrowsperpage="10" id="${tablebodyId}">
\t\t\t\t\t\t\t\t\t\t\t\t\t\t${columns}
\t\t\t\t\t\t\t\t\t\t\t\t\t</tablebody>
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
