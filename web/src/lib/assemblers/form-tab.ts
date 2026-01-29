import type { TabDefinition, DetailTableConfig, ProcessedField } from '../types';
import { generateSectionWithFields, generateTable } from '../generators';
import { generateId } from '../utils/id-generator';

/**
 * Generate content for a tab or subtab (header section + detail tables)
 */
function generateTabContent(
  headerFields: ProcessedField[],
  detailTables: Map<string, ProcessedField[]>,
  sectionId: string,
  tabLabel: string,
  detailTableConfigs: Record<string, DetailTableConfig> = {}
): string[] {
  const parts: string[] = [];

  // Generate header section if there are header fields
  if (headerFields.length > 0) {
    const section = generateSectionWithFields(sectionId, headerFields);
    parts.push(section);
  }

  // Generate detail tables
  if (detailTables.size > 0) {
    for (const [tableName, fields] of detailTables) {
      // Get config for this detail table
      const configKey = `${tabLabel}:${tableName}`;
      const config = detailTableConfigs[configKey];

      // Use config values if available, otherwise use defaults
      const label = config?.label || tableName.replace(/_/g, ' ');
      const orderBy = config?.orderBy || undefined;
      const beanclass = config?.beanclass || undefined;

      const table = generateTable(fields, tableName, label, orderBy, beanclass);
      parts.push(table);
    }
  }

  return parts;
}

/**
 * Generate a form tab with header section and optional detail tables
 * Also supports nested subTabs (tabgroup within tab)
 */
export function generateFormTab(
  tab: TabDefinition,
  detailTableConfigs: Record<string, DetailTableConfig> = {}
): string {
  const parts: string[] = [];

  // Generate header section if there are header fields (fields without subTabName)
  if (tab.headerFields.length > 0) {
    const sectionId = `${tab.id}_grid`;
    const section = generateSectionWithFields(sectionId, tab.headerFields, { border: true });
    parts.push(section);
  }

  // Build tabgroup: detailTables become the first sub-tab, then existing subTabs
  const hasDetailTables = tab.detailTables.size > 0;
  const hasSubTabs = tab.subTabs && tab.subTabs.size > 0;

  if (hasDetailTables || hasSubTabs) {
    const subTabGroupId = `${tab.id}_subtabgroup`;
    const subTabParts: string[] = [];

    // Main detail area as first sub-tab
    if (hasDetailTables) {
      const mainDetailLabel = tab.mainDetailLabel || '主區域';
      const mainDetailId = `subtab_${tab.id}_main_details`;
      const mainDetailContentParts = generateTabContent(
        [],
        tab.detailTables,
        `${mainDetailId}_grid`,
        tab.label,
        detailTableConfigs
      );
      const mainDetailContent = mainDetailContentParts.join('\n\t\t\t\t\t\t\t\t\t');
      const mainDetailXml = `<tab id="${mainDetailId}" label="${mainDetailLabel}" tabchangeevent="switchedTab" type="insert">
\t\t\t\t\t\t\t\t${mainDetailContent}
\t\t\t\t\t\t\t</tab>`;
      subTabParts.push(mainDetailXml);
    }

    // Existing subTabs
    if (hasSubTabs) {
      for (const [subTabName, subTab] of tab.subTabs) {
        const subTabContentParts = generateTabContent(
          subTab.headerFields,
          subTab.detailTables,
          `${subTab.id}_grid`,
          `${tab.label}:${subTabName}`,
          detailTableConfigs
        );

        const subTabContent = subTabContentParts.join('\n\t\t\t\t\t\t\t\t\t');
        const subTabXml = `<tab id="${subTab.id}" label="${subTab.label}" tabchangeevent="switchedTab" type="insert">
\t\t\t\t\t\t\t\t${subTabContent}
\t\t\t\t\t\t\t</tab>`;
        subTabParts.push(subTabXml);
      }
    }

    const nestedTabGroup = `<tabgroup id="${subTabGroupId}" style="form">
\t\t\t\t\t\t\t${subTabParts.join('\n\t\t\t\t\t\t\t')}
\t\t\t\t\t\t</tabgroup>`;
    parts.push(nestedTabGroup);
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
  id?: string,
  detailTableConfigs: Record<string, DetailTableConfig> = {}
): string {
  const tabGroupId = id || generateId();
  const tabContents = tabs.map(tab => generateFormTab(tab, detailTableConfigs)).join('\n\t\t\t\t\t\t\t');

  return `<tabgroup id="${tabGroupId}">
\t\t\t\t\t\t${tabContents}
\t\t\t\t\t</tabgroup>`;
}
