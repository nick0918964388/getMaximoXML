import { supabase } from './client';
import type { DbcBuilderState } from '@/lib/dbc/types';

export async function getDbcState(userId: string): Promise<DbcBuilderState | null> {
  const { data, error } = await supabase
    .from('dbc_builder_states')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    script: data.script,
    checks: data.checks || [],
    operations: data.operations || [],
    selectedId: data.selected_id,
  };
}

export async function saveDbcState(userId: string, state: DbcBuilderState): Promise<boolean> {
  const { error } = await supabase
    .from('dbc_builder_states')
    .upsert({
      user_id: userId,
      script: state.script,
      checks: state.checks,
      operations: state.operations,
      selected_id: state.selectedId,
      saved_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  return !error;
}

export async function clearDbcState(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('dbc_builder_states')
    .delete()
    .eq('user_id', userId);

  return !error;
}
