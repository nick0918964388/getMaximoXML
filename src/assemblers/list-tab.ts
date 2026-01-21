import type { ProcessedField } from '../types';
import { generateListTable } from '../generators';

/**
 * Generate the list tab (results) with table
 */
export function generateListTab(
  fields: ProcessedField[],
  mboName: string,
  orderBy?: string,
  label: string = '清單'
): string {
  const table = generateListTable(fields, mboName, orderBy);

  return `<tab default="true" id="results" label="${label}" type="list">
\t\t\t\t\t<menubar event="search" id="actiontoolbar" sourcemethod="getAppSearchOptions"/>
\t\t\t\t\t${table}
\t\t\t\t</tab>`;
}
