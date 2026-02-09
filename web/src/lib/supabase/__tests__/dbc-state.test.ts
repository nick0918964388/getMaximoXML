import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../client');

import { __setResult, __resetAllMocks, __builder, supabase } from '../__mocks__/client';
import { getDbcState, saveDbcState, clearDbcState } from '../dbc-state';

describe('dbc-state data access', () => {
  beforeEach(() => __resetAllMocks());

  it('getDbcState returns mapped state', async () => {
    __setResult({
      script: { author: 'Nick', scriptname: 'test' },
      checks: [],
      operations: [{ id: 'op-1', operation: { type: 'add_table' } }],
      selected_id: 'op-1',
    });

    const result = await getDbcState('user-123');
    expect(result).not.toBeNull();
    expect(result!.script.author).toBe('Nick');
    expect(result!.selectedId).toBe('op-1');
    expect(supabase.from).toHaveBeenCalledWith('dbc_builder_states');
  });

  it('getDbcState returns null when none exists', async () => {
    __setResult(null);
    const result = await getDbcState('user-123');
    expect(result).toBeNull();
  });

  it('saveDbcState upserts state', async () => {
    __setResult(null);
    const result = await saveDbcState('user-123', {
      script: { author: '', scriptname: '' }, checks: [], operations: [], selectedId: null,
    });
    expect(result).toBe(true);
    expect(__builder.upsert).toHaveBeenCalled();
  });

  it('saveDbcState returns false on error', async () => {
    __setResult(null, 'error');
    const result = await saveDbcState('user-123', {
      script: { author: '', scriptname: '' }, checks: [], operations: [], selectedId: null,
    });
    expect(result).toBe(false);
  });

  it('clearDbcState deletes state', async () => {
    __setResult(null);
    const result = await clearDbcState('user-123');
    expect(result).toBe(true);
    expect(__builder.delete).toHaveBeenCalled();
  });
});
