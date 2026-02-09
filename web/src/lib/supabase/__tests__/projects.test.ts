import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../client');

import { __setResult, __resetAllMocks, __builder, supabase } from '../__mocks__/client';
import { getProjects, getProject, saveProject, deleteProject, importProject, exportProject } from '../projects';

describe('projects data access', () => {
  beforeEach(() => __resetAllMocks());

  it('getProjects returns mapped projects', async () => {
    __setResult([
      {
        id: 'p1', name: 'Test', metadata: { id: 'APP1' }, fields: [],
        detail_table_configs: {}, dialog_templates: [], sub_tab_configs: {},
        main_detail_labels: {}, created_at: '2025-01-01', updated_at: '2025-01-02',
      },
    ]);

    const result = await getProjects();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Test');
    expect(result[0].detailTableConfigs).toEqual({});
    expect(supabase.from).toHaveBeenCalledWith('projects');
  });

  it('getProjects returns empty on error', async () => {
    __setResult(null, 'DB error');
    const result = await getProjects();
    expect(result).toEqual([]);
  });

  it('getProject returns single project', async () => {
    __setResult({
      id: 'p1', name: 'Test', metadata: {}, fields: [],
      detail_table_configs: {}, dialog_templates: [], sub_tab_configs: {},
      main_detail_labels: {}, created_at: '2025-01-01', updated_at: '2025-01-02',
    });

    const result = await getProject('p1');
    expect(result).not.toBeNull();
    expect(result!.id).toBe('p1');
  });

  it('getProject returns null on not found', async () => {
    __setResult(null, 'Not found');
    const result = await getProject('nonexistent');
    expect(result).toBeNull();
  });

  it('saveProject creates new project', async () => {
    __setResult({
      id: 'new-id', name: 'New Project', metadata: { id: 'APP' }, fields: [{ name: 'f1' }],
      detail_table_configs: {}, dialog_templates: [], sub_tab_configs: {},
      main_detail_labels: {}, created_at: '2025-01-01', updated_at: '2025-01-01',
    });

    const result = await saveProject('New Project', { id: 'APP' }, [{ name: 'f1' }]);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('New Project');
    expect(__builder.insert).toHaveBeenCalled();
  });

  it('saveProject updates existing project', async () => {
    __setResult({
      id: 'existing-id', name: 'Updated', metadata: {}, fields: [],
      detail_table_configs: {}, dialog_templates: [], sub_tab_configs: {},
      main_detail_labels: {}, created_at: '2025-01-01', updated_at: '2025-01-02',
    });

    const result = await saveProject('Updated', {}, [], 'existing-id');
    expect(result).not.toBeNull();
    expect(__builder.update).toHaveBeenCalled();
  });

  it('deleteProject returns true on success', async () => {
    __setResult(null);
    const result = await deleteProject('p1');
    expect(result).toBe(true);
    expect(__builder.delete).toHaveBeenCalled();
  });

  it('deleteProject returns false on error', async () => {
    __setResult(null, 'error');
    const result = await deleteProject('p1');
    expect(result).toBe(false);
  });

  it('importProject parses JSON and creates project', async () => {
    __setResult({
      id: 'imported', name: 'My App (Imported)', metadata: { id: 'APP' }, fields: [{ name: 'f1' }],
      detail_table_configs: {}, dialog_templates: [], sub_tab_configs: {},
      main_detail_labels: {}, created_at: '2025-01-01', updated_at: '2025-01-01',
    });

    const json = JSON.stringify({ name: 'My App', metadata: { id: 'APP' }, fields: [{ name: 'f1' }] });
    const result = await importProject(json);
    expect(result).not.toBeNull();
  });

  it('importProject returns null on invalid JSON', async () => {
    const result = await importProject('not json');
    expect(result).toBeNull();
  });

  it('exportProject returns JSON string', () => {
    const project = {
      id: 'p1', name: 'Test', metadata: {} as Record<string, unknown>, fields: [],
      detailTableConfigs: {}, dialogTemplates: [], subTabConfigs: {},
      mainDetailLabels: {}, createdAt: '', updatedAt: '',
    };
    const json = exportProject(project);
    expect(JSON.parse(json).name).toBe('Test');
  });
});
