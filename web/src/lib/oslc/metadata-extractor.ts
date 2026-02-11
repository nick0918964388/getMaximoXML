/**
 * Metadata Extractor Orchestrator
 *
 * Takes a MetadataSelection and produces an ordered list of DbcOperations:
 * 1. Domains (referenced by attributes)
 * 2. Objects with attributes (define_table)
 * 3. Relationships
 * 4. Indexes
 * 5. Applications
 * 6. Modules
 */

import type { DbcOperation } from '@/lib/dbc/types';
import type { MetadataSelection, ExtractionResult } from './types';
import { mapObjectToDefineTable } from './mappers/object-mapper';
import { mapDomainToDbcOp } from './mappers/domain-mapper';
import { mapRelationshipToDbcOp } from './mappers/relationship-mapper';
import { mapIndexToDbcOp } from './mappers/index-mapper';
import { mapAppToDbcOp } from './mappers/app-mapper';
import { mapModuleToDbcOp } from './mappers/module-mapper';

export function extractMetadataToDbc(selection: MetadataSelection): ExtractionResult {
  const operations: DbcOperation[] = [];
  const warnings: string[] = [];

  // 1. Domains
  for (const domain of selection.domains.values()) {
    try {
      operations.push(mapDomainToDbcOp(domain));
    } catch (e) {
      warnings.push(`Failed to map domain ${domain.domainid}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // 2. Objects (define_table with attributes)
  for (const selected of selection.objects.values()) {
    try {
      operations.push(mapObjectToDefineTable(selected.object, selected.attributes));
    } catch (e) {
      warnings.push(`Failed to map object ${selected.object.objectname}: ${e instanceof Error ? e.message : String(e)}`);
    }

    // 3. Relationships
    for (const rel of selected.relationships) {
      try {
        operations.push(mapRelationshipToDbcOp(rel));
      } catch (e) {
        warnings.push(`Failed to map relationship ${rel.name}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    // 4. Indexes
    for (const idx of selected.indexes) {
      try {
        operations.push(mapIndexToDbcOp(idx));
      } catch (e) {
        warnings.push(`Failed to map index ${idx.name}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }

  // 5. Applications
  for (const app of selection.apps.values()) {
    try {
      operations.push(mapAppToDbcOp(app));
    } catch (e) {
      warnings.push(`Failed to map app ${app.app}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // 6. Modules
  for (const mod of selection.modules.values()) {
    try {
      operations.push(mapModuleToDbcOp(mod));
    } catch (e) {
      warnings.push(`Failed to map module ${mod.module}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return { operations, warnings };
}
