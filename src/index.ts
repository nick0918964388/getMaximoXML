// Types
export type {
  FieldType,
  InputMode,
  FieldArea,
  SAFieldDefinition,
  ProcessedField,
  TabDefinition,
  ApplicationDefinition,
  ApplicationMetadata,
} from './types';

// Parsers
export { SAParser, parseExcelRow, groupFieldsByArea, processFields, generateId, generateFieldName } from './parsers/sa-parser';

// Generators
export {
  generateTextbox,
  generateMultilineTextbox,
  generateMultipartTextbox,
  generateCheckbox,
  generateTablecol,
  generateSelectRowTablecol,
  generateBookmarkTablecol,
  generateTable,
  generateListTable,
  generateSection,
  generateSectionWithFields,
} from './generators';

// Assemblers
export {
  generateListTab,
  generateFormTab,
  generateNestedTabGroup,
  generateSearchMoreDialog,
  generateLookupDialog,
  generateApplication,
  generatePresentation,
} from './assemblers';

// Main function
import { SAParser } from './parsers/sa-parser';
import { generateApplication } from './assemblers';
import type { ApplicationMetadata } from './types';

/**
 * Generate Maximo XML from SA document (Excel file)
 */
export async function generateMaximoXml(
  inputPath: string,
  metadata: ApplicationMetadata
): Promise<string> {
  const parser = new SAParser();
  const appDef = await parser.parseFile(inputPath);
  return generateApplication(appDef, metadata);
}
