/**
 * ER Diagram Mermaid Syntax Generator
 *
 * Generates Mermaid erDiagram syntax from ErDiagramData.
 * Used for Markdown export (no mermaid library import needed — pure string building).
 */

import type { ErDiagramData, ErEntity, ErRelationship } from './er-diagram-types';

/**
 * Map fieldRole to Mermaid annotation
 */
function roleAnnotation(role: string): string {
  switch (role) {
    case 'pk': return 'PK';
    case 'fk': return 'FK';
    default: return '';
  }
}

/**
 * Get Mermaid relationship notation based on line style.
 * Solid: ||--o{  (one-to-many)
 * Dashed: ||..o{ (one-to-many, dotted)
 */
function relationshipNotation(lineStyle: string): string {
  return lineStyle === 'dashed' ? '||..o{' : '||--o{';
}

/**
 * Build entity name → tableName lookup from entities array.
 */
function buildEntityTableMap(entities: ErEntity[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const entity of entities) {
    map.set(entity.id, entity.tableName);
  }
  return map;
}

/**
 * Filter entities and relationships based on showExternalRefs setting.
 */
function filterByVisibility(
  data: ErDiagramData
): { entities: ErEntity[]; relationships: ErRelationship[] } {
  if (data.showExternalRefs) {
    return { entities: data.entities, relationships: data.relationships };
  }

  const entities = data.entities.filter(e => e.entityType !== 'external');
  const entityIds = new Set(entities.map(e => e.id));
  const relationships = data.relationships.filter(
    r => entityIds.has(r.sourceEntityId) && entityIds.has(r.targetEntityId)
  );

  return { entities, relationships };
}

/**
 * Generate Mermaid erDiagram syntax string from ErDiagramData.
 *
 * @param data - The ER diagram data
 * @returns Valid Mermaid erDiagram syntax string
 */
export function toMermaidErDiagram(data: ErDiagramData): string {
  const lines: string[] = ['erDiagram'];
  const { entities, relationships } = filterByVisibility(data);
  const tableMap = buildEntityTableMap(data.entities);

  // Render relationships first (Mermaid convention)
  for (const rel of relationships) {
    const sourceTable = tableMap.get(rel.sourceEntityId);
    const targetTable = tableMap.get(rel.targetEntityId);
    if (!sourceTable || !targetTable) continue;

    const notation = relationshipNotation(rel.lineStyle);
    const label = rel.label ? `"${rel.label}"` : '"has"';
    lines.push(`    ${sourceTable} ${notation} ${targetTable} : ${label}`);
  }

  // Render entity definitions
  for (const entity of entities) {
    if (!entity.tableName) continue;

    if (entity.fields.length === 0) {
      // Empty entity — still declare it so it appears in diagram
      lines.push(`    ${entity.tableName} {`);
      lines.push('    }');
      continue;
    }

    lines.push(`    ${entity.tableName} {`);
    for (const field of entity.fields) {
      const annotation = roleAnnotation(field.fieldRole);
      if (annotation) {
        lines.push(`        ${field.dataType} ${field.name} ${annotation}`);
      } else {
        lines.push(`        ${field.dataType} ${field.name}`);
      }
    }
    lines.push('    }');
  }

  return lines.join('\n');
}
