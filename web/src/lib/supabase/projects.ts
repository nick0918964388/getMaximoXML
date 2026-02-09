import { supabase } from './client';
import type { SavedProject, ApplicationMetadata, SAFieldDefinition, DetailTableConfig, DialogTemplate, SubTabDefinition } from '@/lib/types';

export async function getProjects(): Promise<SavedProject[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error || !data) return [];

  return data.map(rowToProject);
}

export async function getProject(id: string): Promise<SavedProject | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return rowToProject(data);
}

export async function saveProject(
  name: string,
  metadata: ApplicationMetadata,
  fields: SAFieldDefinition[],
  existingId?: string,
  detailTableConfigs: Record<string, DetailTableConfig> = {},
  dialogTemplates: DialogTemplate[] = [],
  subTabConfigs: Record<string, SubTabDefinition[]> = {},
  mainDetailLabels: Record<string, string> = {}
): Promise<SavedProject | null> {
  if (existingId) {
    return updateProject(existingId, {
      name,
      metadata,
      fields,
      detail_table_configs: detailTableConfigs,
      dialog_templates: dialogTemplates,
      sub_tab_configs: subTabConfigs,
      main_detail_labels: mainDetailLabels,
      updated_at: new Date().toISOString(),
    });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      name,
      metadata,
      fields,
      detail_table_configs: detailTableConfigs,
      dialog_templates: dialogTemplates,
      sub_tab_configs: subTabConfigs,
      main_detail_labels: mainDetailLabels,
    })
    .select()
    .single();

  if (error || !data) return null;
  return rowToProject(data);
}

export async function updateProject(
  id: string,
  updates: Record<string, unknown>
): Promise<SavedProject | null> {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) return null;
  return rowToProject(data);
}

export async function deleteProject(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  return !error;
}

export async function importProject(
  json: string
): Promise<SavedProject | null> {
  try {
    const project = JSON.parse(json) as SavedProject;
    if (!project.name || !project.metadata || !project.fields) return null;

    return saveProject(
      `${project.name} (Imported)`,
      project.metadata,
      project.fields,
      undefined,
      project.detailTableConfigs || {},
      project.dialogTemplates || [],
      project.subTabConfigs || {},
      project.mainDetailLabels || {}
    );
  } catch {
    return null;
  }
}

export function exportProject(project: SavedProject): string {
  return JSON.stringify(project, null, 2);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToProject(row: any): SavedProject {
  return {
    id: row.id,
    name: row.name,
    metadata: row.metadata,
    fields: row.fields,
    detailTableConfigs: row.detail_table_configs || {},
    dialogTemplates: row.dialog_templates || [],
    subTabConfigs: row.sub_tab_configs || {},
    mainDetailLabels: row.main_detail_labels || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
