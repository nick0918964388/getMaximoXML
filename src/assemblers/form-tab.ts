import type { TabDefinition, ProcessedField } from '../types';
import { generateSectionWithFields, generateTable } from '../generators';
import { generateId } from '../utils/id-generator';

/**
 * Generate a form tab with header section and optional detail tables
 */
export function generateFormTab(tab: TabDefinition): string {
  const parts: string[] = [];

  // Generate header section if there are header fields
  if (tab.headerFields.length > 0) {
    const sectionId = `${tab.id}_grid`;
    const section = generateSectionWithFields(sectionId, tab.headerFields);
    parts.push(section);
  }

  // Generate detail tables
  if (tab.detailTables.size > 0) {
    for (const [tableName, fields] of tab.detailTables) {
      // Use the table name as label
      const label = tableName.replace(/_/g, ' ');
      const table = generateTable(fields, tableName, label);
      parts.push(table);
    }
  }

  const content = parts.join('\n\t\t\t\t\t\t\t');

  return `<tab id="${tab.id}" label="${tab.label}" tabchangeevent="switchedTab" type="insert">
\t\t\t\t\t\t${content}
\t\t\t\t\t</tab>`;
}

/**
 * Generate a nested tab group (for tabs within tabs)
 */
export function generateNestedTabGroup(
  tabs: TabDefinition[],
  id?: string
): string {
  const tabGroupId = id || generateId();
  const tabContents = tabs.map(generateFormTab).join('\n\t\t\t\t\t\t\t');

  return `<tabgroup id="${tabGroupId}">
\t\t\t\t\t\t${tabContents}
\t\t\t\t\t</tabgroup>`;
}
