import { supabase } from './client';
import type { SAFieldDefinition, ApplicationMetadata, DetailTableConfig, DialogTemplate, SubTabDefinition } from '@/lib/types';

export interface DraftData {
  fields: SAFieldDefinition[];
  metadata: ApplicationMetadata;
  detailTableConfigs: Record<string, DetailTableConfig>;
  dialogTemplates: DialogTemplate[];
  subTabConfigs: Record<string, SubTabDefinition[]>;
  mainDetailLabels: Record<string, string>;
  projectId: string | null;
  projectName: string;
  savedAt: string;
}

export async function getDraft(userId: string): Promise<DraftData | null> {
  const { data, error } = await supabase
    .from('drafts')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    fields: data.fields,
    metadata: data.metadata,
    detailTableConfigs: data.detail_table_configs || {},
    dialogTemplates: data.dialog_templates || [],
    subTabConfigs: data.sub_tab_configs || {},
    mainDetailLabels: data.main_detail_labels || {},
    projectId: data.project_id,
    projectName: data.project_name || '',
    savedAt: data.saved_at,
  };
}

export async function saveDraft(userId: string, draft: DraftData): Promise<boolean> {
  const { error } = await supabase
    .from('drafts')
    .upsert({
      user_id: userId,
      fields: draft.fields,
      metadata: draft.metadata,
      detail_table_configs: draft.detailTableConfigs,
      dialog_templates: draft.dialogTemplates,
      sub_tab_configs: draft.subTabConfigs,
      main_detail_labels: draft.mainDetailLabels,
      project_id: draft.projectId,
      project_name: draft.projectName,
      saved_at: draft.savedAt,
    }, { onConflict: 'user_id' });

  return !error;
}

export async function clearDraft(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('drafts')
    .delete()
    .eq('user_id', userId);

  return !error;
}
