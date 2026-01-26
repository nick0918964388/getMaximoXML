import { useMemo } from 'react';
import { SAFieldDefinition } from '@/lib/types';

export interface FieldSuggestions {
  labels: string[];
  tabNames: string[];
  relationships: string[];
  lookups: string[];
}

/**
 * Hook to extract unique field values for autocomplete suggestions
 * from the current project's fields array.
 */
export function useFieldSuggestions(fields: SAFieldDefinition[]): FieldSuggestions {
  return useMemo(() => {
    const labelsSet = new Set<string>();
    const tabNamesSet = new Set<string>();
    const relationshipsSet = new Set<string>();
    const lookupsSet = new Set<string>();

    fields.forEach((field) => {
      if (field.label) labelsSet.add(field.label);
      if (field.tabName) tabNamesSet.add(field.tabName);
      if (field.relationship) relationshipsSet.add(field.relationship);
      if (field.lookup) lookupsSet.add(field.lookup);
    });

    return {
      labels: Array.from(labelsSet).sort(),
      tabNames: Array.from(tabNamesSet).sort(),
      relationships: Array.from(relationshipsSet).sort(),
      lookups: Array.from(lookupsSet).sort(),
    };
  }, [fields]);
}
