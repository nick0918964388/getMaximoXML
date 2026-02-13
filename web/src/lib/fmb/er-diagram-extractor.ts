/**
 * ER Diagram Extractor - Extract entity-relationship data from FormSpec
 */

import type { FormSpec, BlockSpec, FieldSpec, LovSpec } from './spec-generator';
import type {
  ErDiagramData,
  ErEntity,
  ErField,
  ErFieldRole,
  ErEntityType,
  ErRelationship,
} from './er-diagram-types';

/** Pattern matching for primary key field names */
const PK_PATTERNS = [/_ID$/, /_NO$/, /_CODE$/];

function isPkPattern(fieldName: string): boolean {
  const upper = fieldName.toUpperCase();
  return PK_PATTERNS.some(p => p.test(upper));
}

/**
 * Determine the role of a field for ER diagram display.
 * Returns undefined if the field should not be shown.
 */
function getFieldRole(field: FieldSpec): ErFieldRole | undefined {
  if (field.lovName) return 'fk';
  if (field.required) return 'pk';
  if (isPkPattern(field.dbColumn)) return 'pk';
  return undefined;
}

/**
 * Classify a block as header or detail.
 * Detail blocks have fields with tabPage set.
 * The first block without tabPage fields is the header.
 */
function classifyBlock(block: BlockSpec, isFirstNonTabBlock: boolean): ErEntityType {
  const hasTabFields = block.fields.some(f => f.tabPage !== '');
  if (hasTabFields) return 'detail';
  if (isFirstNonTabBlock) return 'header';
  return 'header';
}

/**
 * Extract key fields from a block's field list.
 * Only includes: required, FK (lovName), or PK pattern fields.
 */
function extractKeyFields(fields: FieldSpec[]): ErField[] {
  const result: ErField[] = [];
  for (const field of fields) {
    const role = getFieldRole(field);
    if (!role) continue;
    result.push({
      name: field.dbColumn,
      dataType: field.dataType,
      fieldRole: role,
      lovName: field.lovName || undefined,
    });
  }
  return result;
}

/**
 * Parse a simple SQL query to extract the main table name from the FROM clause.
 * Returns undefined if parsing fails.
 */
function parseTableFromSql(sql: string): string | undefined {
  if (!sql || sql.trim() === '') return undefined;
  // Match FROM <table_name> (case-insensitive, allow schema prefix)
  const match = sql.match(/\bFROM\s+([A-Za-z_][A-Za-z0-9_.]*)/i);
  return match ? match[1].toUpperCase() : undefined;
}

/**
 * Build a map of LOV name → source table name from LOV specs.
 */
function buildLovTableMap(lovs: LovSpec[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const lov of lovs) {
    const sql = lov.recordGroupQuery;
    const tableName = parseTableFromSql(sql);
    if (tableName) {
      map.set(lov.name, tableName);
    }
  }
  return map;
}

/**
 * Extract ER diagram data from a FormSpec.
 *
 * @param spec - The form specification from generateFormSpec()
 * @returns ErDiagramData containing entities, relationships, and metadata
 */
export function extractErDiagram(spec: FormSpec): ErDiagramData {
  const entities: ErEntity[] = [];
  const relationships: ErRelationship[] = [];

  // Track which block is the first non-tab block (header candidate)
  let foundFirstHeader = false;
  let headerEntityId: string | undefined;

  // Phase 1: Extract entities from blocks
  for (const block of spec.blocks) {
    const hasTabFields = block.fields.some(f => f.tabPage !== '');
    const isFirstNonTabBlock = !hasTabFields && !foundFirstHeader;

    if (isFirstNonTabBlock) {
      foundFirstHeader = true;
    }

    const entityType = classifyBlock(block, isFirstNonTabBlock);
    if (entityType === 'header' && !headerEntityId) {
      headerEntityId = block.name;
    }

    const entity: ErEntity = {
      id: block.name,
      blockName: block.name,
      tableName: block.baseTable,
      entityType,
      fields: extractKeyFields(block.fields),
    };
    entities.push(entity);
  }

  // Phase 2: Create parent-child relationships (header → detail)
  if (headerEntityId) {
    for (const entity of entities) {
      if (entity.entityType === 'detail') {
        relationships.push({
          id: `rel-${headerEntityId}-${entity.id}`,
          sourceEntityId: headerEntityId,
          targetEntityId: entity.id,
          cardinality: '1:N',
          lineStyle: 'solid',
        });
      }
    }
  }

  // Phase 3: Extract LOV external references
  const lovTableMap = buildLovTableMap(spec.lovs);
  const externalTableSet = new Set<string>();

  // Map of LOV name → which block entity contains it
  for (const block of spec.blocks) {
    for (const field of block.fields) {
      if (!field.lovName) continue;
      const extTableName = lovTableMap.get(field.lovName);
      if (!extTableName) continue;

      // Create external entity (deduplicated by table name)
      if (!externalTableSet.has(extTableName)) {
        externalTableSet.add(extTableName);
        entities.push({
          id: `ext-${extTableName}`,
          blockName: '',
          tableName: extTableName,
          entityType: 'external',
          fields: [],
        });
      }

      // Create dashed relationship from the block to the external table
      const relId = `lov-${block.name}-${extTableName}`;
      // Avoid duplicate relationships
      if (!relationships.some(r => r.id === relId)) {
        relationships.push({
          id: relId,
          sourceEntityId: block.name,
          targetEntityId: `ext-${extTableName}`,
          cardinality: '1:N',
          lineStyle: 'dashed',
          label: field.lovName,
        });
      }
    }
  }

  return {
    entities,
    relationships,
    formName: spec.formName,
    showExternalRefs: false,
  };
}
