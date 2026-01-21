import type { ProcessedField } from '../types';
import { generateId } from '../utils/id-generator';

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
 * Generate a tablecol XML element
 * @param field The field definition
 * @param isListTable Whether this is for the list table (adds mxevent)
 * @param useHyperlink Whether to use hyperlink menutype (for detail tables)
 */
export function generateTablecol(
  field: ProcessedField,
  isListTable: boolean = false,
  useHyperlink: boolean = false
): string {
  const attrs: Record<string, string | undefined> = {};

  // Add applink if present
  if (field.applink) {
    attrs.applink = field.applink;
  }

  // Add dataattribute
  attrs.dataattribute = field.dataattribute;

  // Add filterable for list tables
  if (isListTable) {
    attrs.filterable = field.filterable ? 'true' : 'false';
  }

  // Add ID - generate unique ID for each element
  attrs.id = generateId();

  // Add inputmode if readonly
  if (field.inputMode === 'readonly') {
    attrs.inputmode = 'readonly';
  }

  // Add label if provided
  if (field.label) {
    attrs.label = field.label;
  }

  // Add lookup if present
  if (field.lookup) {
    attrs.lookup = field.lookup;
  }

  // Add menutype if applink is present
  if (field.applink) {
    if (useHyperlink) {
      attrs.menutype = 'hyperlink';
    } else {
      attrs.menutype = 'normal';
    }
  }

  // Add mxevent for list tables
  if (isListTable) {
    attrs.mxevent = 'selectrecord';
    attrs.mxevent_desc = '移至%1';
  }

  // Add sortable for list tables
  if (isListTable) {
    attrs.sortable = field.sortable ? 'true' : 'false';
  }

  // Add type for list tables with applink
  if (isListTable && field.applink) {
    attrs.type = 'link';
  }

  // Add width if present
  if (field.width) {
    attrs.width = field.width;
  }

  const attrString = buildAttributes(attrs);
  return `<tablecol ${attrString}/>`;
}

/**
 * Generate a special tablecol for row selection checkbox
 */
export function generateSelectRowTablecol(id: string, keyAttribute: string): string {
  return `<tablecol dataattribute="${keyAttribute}" filterable="false" id="${id}" mxevent="toggleselectrow" mxevent_desc="選取橫列 {0}" sortable="false" type="event"/>`;
}

/**
 * Generate a special tablecol for bookmark
 */
export function generateBookmarkTablecol(): string {
  return '<tablecol filterable="false" id="results_bookmark" mxevent="BOOKMARK" mxevent_desc="新增至書籤" mxevent_icon="btn_addtobookmarks.gif" sortable="false" type="event"/>';
}
