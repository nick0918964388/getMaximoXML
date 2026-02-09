import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../client');

import { __setResult, __resetAllMocks, __builder, supabase } from '../__mocks__/client';
import { getDraft, saveDraft, clearDraft } from '../drafts';

describe('drafts data access', () => {
  beforeEach(() => __resetAllMocks());

  it('getDraft returns mapped draft', async () => {
    __setResult({
      fields: [{ name: 'f1' }], metadata: { id: 'APP' },
      detail_table_configs: { tab: {} }, dialog_templates: [],
      sub_tab_configs: {}, main_detail_labels: {},
      project_id: 'p1', project_name: 'My Project', saved_at: '2025-01-01',
    });

    const result = await getDraft('user-123');
    expect(result).not.toBeNull();
    expect(result!.projectId).toBe('p1');
    expect(result!.detailTableConfigs).toEqual({ tab: {} });
    expect(supabase.from).toHaveBeenCalledWith('drafts');
  });

  it('getDraft returns null when no draft', async () => {
    __setResult(null);
    const result = await getDraft('user-123');
    expect(result).toBeNull();
  });

  it('saveDraft upserts draft', async () => {
    __setResult(null);
    const result = await saveDraft('user-123', {
      fields: [], metadata: {}, detailTableConfigs: {}, dialogTemplates: [],
      subTabConfigs: {}, mainDetailLabels: {}, projectId: null, projectName: '', savedAt: '2025-01-01',
    });
    expect(result).toBe(true);
    expect(__builder.upsert).toHaveBeenCalled();
  });

  it('saveDraft returns false on error', async () => {
    __setResult(null, 'error');
    const result = await saveDraft('user-123', {
      fields: [], metadata: {}, detailTableConfigs: {}, dialogTemplates: [],
      subTabConfigs: {}, mainDetailLabels: {}, projectId: null, projectName: '', savedAt: '2025-01-01',
    });
    expect(result).toBe(false);
  });

  it('clearDraft deletes draft', async () => {
    __setResult(null);
    const result = await clearDraft('user-123');
    expect(result).toBe(true);
    expect(__builder.delete).toHaveBeenCalled();
  });
});
