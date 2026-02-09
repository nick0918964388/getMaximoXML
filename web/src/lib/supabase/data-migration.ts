import { supabase } from './client';
import { saveDraft } from './drafts';
import { saveDbcState } from './dbc-state';
import type { DraftData } from './drafts';
import type { DbcBuilderState } from '@/lib/dbc/types';

const MIGRATION_KEY = 'supabase-migration-v1';

export function isMigrationDone(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(MIGRATION_KEY) === 'done';
}

export function markMigrationDone(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MIGRATION_KEY, 'done');
}

export interface MigrationResult {
  draft: boolean;
  dbcState: boolean;
  fmbHistory: number;
}

/**
 * Migrate localStorage data to Supabase on first login.
 * Returns counts of what was migrated.
 */
export async function migrateLocalDataToSupabase(userId: string): Promise<MigrationResult> {
  if (isMigrationDone()) {
    return { draft: false, dbcState: false, fmbHistory: 0 };
  }

  const result: MigrationResult = { draft: false, dbcState: false, fmbHistory: 0 };

  // 1. Migrate draft
  try {
    const draftRaw = localStorage.getItem('maximo-xml-generator-draft');
    if (draftRaw) {
      const draft: DraftData = JSON.parse(draftRaw);
      const ok = await saveDraft(userId, draft);
      if (ok) result.draft = true;
    }
  } catch { /* ignore */ }

  // 2. Migrate DBC builder state
  try {
    const dbcRaw = localStorage.getItem('dbc-builder-state');
    if (dbcRaw) {
      const state: DbcBuilderState = JSON.parse(dbcRaw);
      const ok = await saveDbcState(userId, state);
      if (ok) result.dbcState = true;
    }
  } catch { /* ignore */ }

  // 3. Migrate FMB upload history (try all username-scoped keys)
  try {
    const username = localStorage.getItem('maximo-xml-generator-username');
    if (username) {
      const historyRaw = localStorage.getItem(`fmb-upload-history:${username}`);
      if (historyRaw) {
        const records = JSON.parse(historyRaw) as Array<{
          id: string;
          fileName: string;
          moduleName: string;
          fieldCount: number;
          uploadedAt: string;
          xmlContent: string;
        }>;

        for (const r of records) {
          const { error } = await supabase.from('fmb_upload_history').insert({
            user_id: userId,
            file_name: r.fileName,
            module_name: r.moduleName,
            field_count: r.fieldCount,
            xml_content: r.xmlContent,
            uploaded_at: r.uploadedAt,
          });
          if (!error) result.fmbHistory++;
        }
      }
    }
  } catch { /* ignore */ }

  markMigrationDone();
  return result;
}
