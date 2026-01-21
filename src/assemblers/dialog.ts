import type { ProcessedField } from '../types';
import { generateTextbox } from '../generators';
import { generateId } from '../utils/id-generator';

/**
 * Generate search more dialog with searchable fields
 */
export function generateSearchMoreDialog(
  fields: ProcessedField[],
  mboName: string = 'SR'
): string {
  const dialogId = 'searchmore';

  // Filter to only filterable fields
  const searchableFields = fields.filter((f) => f.filterable);

  // Generate textbox elements for search fields
  const searchFields = searchableFields
    .map((field) => {
      const searchField: ProcessedField = {
        ...field,
        inputMode: 'query' as const,
      };
      return generateTextbox(searchField);
    })
    .join('\n\t\t\t\t\t');

  return `<dialog id="${dialogId}" label="更多搜尋欄位" mboname="${mboName}">
\t\t\t<section id="${generateId()}">
\t\t\t\t<sectionrow id="${generateId()}">
\t\t\t\t\t<sectioncol id="${generateId()}">
\t\t\t\t\t\t${searchFields}
\t\t\t\t\t</sectioncol>
\t\t\t\t</sectionrow>
\t\t\t</section>
\t\t\t<buttongroup id="${generateId()}">
\t\t\t\t<pushbutton default="true" id="${generateId()}" label="搜尋" mxevent="dialogok"/>
\t\t\t\t<pushbutton id="${generateId()}" label="取消" mxevent="dialogcancel"/>
\t\t\t</buttongroup>
\t\t</dialog>`;
}

/**
 * Generate a lookup dialog
 */
export function generateLookupDialog(
  lookupName: string,
  mboName: string,
  fields: ProcessedField[]
): string {
  const dialogId = lookupName.toLowerCase();

  // Generate table columns for lookup
  const columns = fields
    .map(
      (field) =>
        `<tablecol dataattribute="${field.dataattribute}" id="${generateId()}" mxevent="selectrecord"/>`
    )
    .join('\n\t\t\t\t\t\t');

  return `<dialog id="${dialogId}" label="${lookupName}" mboname="${mboName}">
\t\t\t<table id="${generateId()}" mboname="${mboName}" selectmode="single">
\t\t\t\t<tablebody id="${generateId()}">
\t\t\t\t\t${columns}
\t\t\t\t</tablebody>
\t\t\t</table>
\t\t</dialog>`;
}
