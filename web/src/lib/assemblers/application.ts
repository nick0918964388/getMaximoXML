import type { ApplicationDefinition, ApplicationMetadata, ProcessedField } from '../types';
import { generateListTab } from './list-tab';
import { generateFormTab } from './form-tab';
import { generateSearchMoreDialog } from './dialog';

/**
 * Generate the complete presentation XML
 */
export function generatePresentation(
  appDef: ApplicationDefinition,
  metadata: ApplicationMetadata
): string {
  // Generate list tab
  const listTab = generateListTab(
    appDef.listFields,
    metadata.mboName,
    metadata.orderBy,
    'List'
  );

  // Generate form tabs
  const formTabs: string[] = [];
  for (const tab of appDef.tabs.values()) {
    formTabs.push(generateFormTab(tab));
  }

  const allTabs = [listTab, ...formTabs].join('\n\t\t\t\t');

  // Build where clause attribute (escape XML entities)
  const whereClauseAttr = metadata.whereClause
    ? ` whereclause="${escapeXml(metadata.whereClause)}"`
    : '';

  const orderByAttr = metadata.orderBy
    ? ` orderby="${metadata.orderBy}"`
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>

<presentation id="${metadata.id}" keyattribute="${metadata.keyAttribute}" mboname="${metadata.mboName}"${orderByAttr} resultstableid="results_showlist" version="${metadata.version}"${whereClauseAttr}>
\t<page id="mainrec">
\t\t<include controltoclone="pageHeader" id="INCLUDE-pageHeader"/>
\t\t<clientarea id="clientarea">
\t\t\t<tabgroup id="maintabs" style="form">
\t\t\t\t${allTabs}
\t\t\t</tabgroup>
\t\t</clientarea>
\t\t<include controltoclone="pageFooter" id="INCLUDE-pageFooter"/>
\t</page>
</presentation>`;
}

/**
 * Generate the complete application XML including dialogs
 */
export function generateApplication(
  appDef: ApplicationDefinition,
  metadata: ApplicationMetadata
): string {
  // Collect all filterable fields for search dialog
  const allFields: ProcessedField[] = [];

  for (const tab of appDef.tabs.values()) {
    allFields.push(...tab.headerFields);
  }
  allFields.push(...appDef.listFields);

  // Generate presentation
  const presentation = generatePresentation(appDef, metadata);

  // Generate search more dialog
  const searchDialog = generateSearchMoreDialog(allFields, metadata.mboName);

  // Insert dialog before closing presentation tag
  const presentationWithDialog = presentation.replace(
    '</presentation>',
    `\t${searchDialog}\n</presentation>`
  );

  return presentationWithDialog;
}

/**
 * Escape XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
