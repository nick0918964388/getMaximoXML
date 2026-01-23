import type { ApplicationDefinition, ApplicationMetadata, ProcessedField, DetailTableConfig, DialogTemplate } from '../types';
import { generateListTab } from './list-tab';
import { generateFormTab } from './form-tab';
import { generateSearchMoreDialog } from './dialog';
import { generateAllDialogTemplates } from './dialog-template';

/**
 * Generate the complete presentation XML
 */
export function generatePresentation(
  appDef: ApplicationDefinition,
  metadata: ApplicationMetadata,
  detailTableConfigs: Record<string, DetailTableConfig> = {}
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
    formTabs.push(generateFormTab(tab, detailTableConfigs));
  }

  const allTabs = [listTab, ...formTabs].join('\n\t\t\t\t');

  // Build where clause attribute (escape XML entities)
  const whereClauseAttr = metadata.whereClause
    ? ` whereclause="${escapeXml(metadata.whereClause)}"`
    : '';

  const orderByAttr = metadata.orderBy
    ? ` orderby="${metadata.orderBy}"`
    : '';

  const beanclassAttr = metadata.beanclass
    ? ` beanclass="${metadata.beanclass}"`
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>

<presentation id="${metadata.id}"${beanclassAttr} keyattribute="${metadata.keyAttribute}" mboname="${metadata.mboName}"${orderByAttr} resultstableid="results_showlist" version="${metadata.version}"${whereClauseAttr}>
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
  metadata: ApplicationMetadata,
  detailTableConfigs: Record<string, DetailTableConfig> = {},
  dialogTemplates: DialogTemplate[] = []
): string {
  // Collect all filterable fields for search dialog
  const allFields: ProcessedField[] = [];

  for (const tab of appDef.tabs.values()) {
    allFields.push(...tab.headerFields);
  }
  allFields.push(...appDef.listFields);

  // Generate presentation
  const presentation = generatePresentation(appDef, metadata, detailTableConfigs);

  // Generate search more dialog
  const searchDialog = generateSearchMoreDialog(allFields, metadata.mboName);

  // Generate custom dialog templates
  const customDialogs = generateAllDialogTemplates(dialogTemplates);

  // Combine all dialogs
  const allDialogs = [searchDialog, customDialogs].filter(Boolean).join('\n\t\t');

  // Insert dialogs before closing presentation tag
  const presentationWithDialogs = presentation.replace(
    '</presentation>',
    `\t${allDialogs}\n</presentation>`
  );

  return presentationWithDialogs;
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
