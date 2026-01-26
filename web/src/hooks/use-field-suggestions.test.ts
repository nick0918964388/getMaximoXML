import { renderHook } from '@testing-library/react';
import { useFieldSuggestions } from './use-field-suggestions';
import { SAFieldDefinition, DEFAULT_FIELD } from '@/lib/types';

describe('useFieldSuggestions', () => {
  const createField = (overrides: Partial<SAFieldDefinition> = {}): SAFieldDefinition => ({
    ...DEFAULT_FIELD,
    ...overrides,
  });

  it('should return empty arrays when fields is empty', () => {
    const { result } = renderHook(() => useFieldSuggestions([]));

    expect(result.current.labels).toEqual([]);
    expect(result.current.tabNames).toEqual([]);
    expect(result.current.relationships).toEqual([]);
    expect(result.current.lookups).toEqual([]);
  });

  it('should extract unique labels from fields', () => {
    const fields: SAFieldDefinition[] = [
      createField({ label: '工單編號' }),
      createField({ label: '資產編號' }),
      createField({ label: '工單編號' }), // duplicate
    ];

    const { result } = renderHook(() => useFieldSuggestions(fields));

    expect(result.current.labels).toEqual(['工單編號', '資產編號']);
  });

  it('should extract unique tabNames from fields', () => {
    const fields: SAFieldDefinition[] = [
      createField({ tabName: '基本資料' }),
      createField({ tabName: '詳細資料' }),
      createField({ tabName: '基本資料' }), // duplicate
    ];

    const { result } = renderHook(() => useFieldSuggestions(fields));

    expect(result.current.tabNames).toEqual(['基本資料', '詳細資料']);
  });

  it('should extract unique relationships from fields', () => {
    const fields: SAFieldDefinition[] = [
      createField({ relationship: 'ASSET' }),
      createField({ relationship: 'LOCATION' }),
      createField({ relationship: 'ASSET' }), // duplicate
    ];

    const { result } = renderHook(() => useFieldSuggestions(fields));

    expect(result.current.relationships).toEqual(['ASSET', 'LOCATION']);
  });

  it('should extract unique lookups from fields', () => {
    const fields: SAFieldDefinition[] = [
      createField({ lookup: 'VALUELIST' }),
      createField({ lookup: 'DOMAINID' }),
      createField({ lookup: 'VALUELIST' }), // duplicate
    ];

    const { result } = renderHook(() => useFieldSuggestions(fields));

    expect(result.current.lookups).toEqual(['DOMAINID', 'VALUELIST']);
  });

  it('should filter out empty values', () => {
    const fields: SAFieldDefinition[] = [
      createField({ label: '', tabName: '', relationship: '', lookup: '' }),
      createField({ label: '標籤', tabName: '', relationship: 'REL', lookup: '' }),
    ];

    const { result } = renderHook(() => useFieldSuggestions(fields));

    expect(result.current.labels).toEqual(['標籤']);
    expect(result.current.tabNames).toEqual([]);
    expect(result.current.relationships).toEqual(['REL']);
    expect(result.current.lookups).toEqual([]);
  });

  it('should return sorted results', () => {
    const fields: SAFieldDefinition[] = [
      createField({ label: 'Zebra', tabName: 'Tab3', relationship: 'REL_Z', lookup: 'LOOKUP_Z' }),
      createField({ label: 'Apple', tabName: 'Tab1', relationship: 'REL_A', lookup: 'LOOKUP_A' }),
      createField({ label: 'Mango', tabName: 'Tab2', relationship: 'REL_M', lookup: 'LOOKUP_M' }),
    ];

    const { result } = renderHook(() => useFieldSuggestions(fields));

    expect(result.current.labels).toEqual(['Apple', 'Mango', 'Zebra']);
    expect(result.current.tabNames).toEqual(['Tab1', 'Tab2', 'Tab3']);
    expect(result.current.relationships).toEqual(['REL_A', 'REL_M', 'REL_Z']);
    expect(result.current.lookups).toEqual(['LOOKUP_A', 'LOOKUP_M', 'LOOKUP_Z']);
  });

  it('should memoize results when fields reference does not change', () => {
    const fields: SAFieldDefinition[] = [
      createField({ label: 'Test' }),
    ];

    const { result, rerender } = renderHook(() => useFieldSuggestions(fields));
    const firstResult = result.current;

    rerender();

    expect(result.current).toBe(firstResult);
  });
});
