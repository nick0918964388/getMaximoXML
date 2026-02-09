import {
  getUploadHistory as getFromSupabase,
  addUploadHistory as addToSupabase,
  deleteUploadHistory as deleteFromSupabase,
  clearUploadHistory as clearFromSupabase,
  type FmbUploadRecord,
} from '@/lib/supabase/fmb-history';

export type { FmbUploadRecord };

export async function getUploadHistory(userId: string): Promise<FmbUploadRecord[]> {
  return getFromSupabase(userId);
}

export async function addUploadHistory(
  userId: string,
  record: Omit<FmbUploadRecord, 'id' | 'uploadedAt'>
): Promise<FmbUploadRecord | null> {
  return addToSupabase(userId, record);
}

export async function deleteUploadHistory(id: string): Promise<boolean> {
  return deleteFromSupabase(id);
}

export async function clearUploadHistory(userId: string): Promise<boolean> {
  return clearFromSupabase(userId);
}
