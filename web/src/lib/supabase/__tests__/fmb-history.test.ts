import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../client');

import { __setResult, __resetAllMocks, __builder, supabase } from '../__mocks__/client';
import { getUploadHistory, addUploadHistory, deleteUploadHistory, clearUploadHistory } from '../fmb-history';

describe('fmb-history data access', () => {
  beforeEach(() => __resetAllMocks());

  it('getUploadHistory returns mapped records', async () => {
    __setResult([{
      id: 'h1', file_name: 'test.fmb', module_name: 'TEST',
      field_count: 5, uploaded_at: '2025-01-01', xml_content: '<xml/>',
    }]);

    const result = await getUploadHistory('user-123');
    expect(result).toHaveLength(1);
    expect(result[0].fileName).toBe('test.fmb');
    expect(result[0].fieldCount).toBe(5);
    expect(supabase.from).toHaveBeenCalledWith('fmb_upload_history');
  });

  it('getUploadHistory returns empty on error', async () => {
    __setResult(null, 'error');
    const result = await getUploadHistory('user-123');
    expect(result).toEqual([]);
  });

  it('addUploadHistory inserts and returns record', async () => {
    __setResult({
      id: 'new-h', file_name: 'new.fmb', module_name: 'NEW',
      field_count: 3, uploaded_at: '2025-01-01', xml_content: '<xml/>',
    });

    const result = await addUploadHistory('user-123', {
      fileName: 'new.fmb', moduleName: 'NEW', fieldCount: 3, xmlContent: '<xml/>',
    });
    expect(result).not.toBeNull();
    expect(result!.id).toBe('new-h');
    expect(__builder.insert).toHaveBeenCalled();
  });

  it('addUploadHistory returns null on error', async () => {
    __setResult(null, 'error');
    const result = await addUploadHistory('user-123', {
      fileName: 'x.fmb', moduleName: 'X', fieldCount: 0, xmlContent: '',
    });
    expect(result).toBeNull();
  });

  it('deleteUploadHistory deletes by id', async () => {
    __setResult(null);
    const result = await deleteUploadHistory('h1');
    expect(result).toBe(true);
    expect(__builder.delete).toHaveBeenCalled();
  });

  it('clearUploadHistory deletes all for user', async () => {
    __setResult(null);
    const result = await clearUploadHistory('user-123');
    expect(result).toBe(true);
    expect(__builder.delete).toHaveBeenCalled();
    expect(__builder.eq).toHaveBeenCalledWith('user_id', 'user-123');
  });
});
