import { supabase } from './client';

export interface FmbUploadRecord {
  id: string;
  fileName: string;
  moduleName: string;
  fieldCount: number;
  uploadedAt: string;
  xmlContent: string;
}

export async function getUploadHistory(userId: string): Promise<FmbUploadRecord[]> {
  const { data, error } = await supabase
    .from('fmb_upload_history')
    .select('*')
    .eq('user_id', userId)
    .order('uploaded_at', { ascending: false });

  if (error || !data) return [];

  return data.map(rowToRecord);
}

export async function addUploadHistory(
  userId: string,
  record: Omit<FmbUploadRecord, 'id' | 'uploadedAt'>
): Promise<FmbUploadRecord | null> {
  const { data, error } = await supabase
    .from('fmb_upload_history')
    .insert({
      user_id: userId,
      file_name: record.fileName,
      module_name: record.moduleName,
      field_count: record.fieldCount,
      xml_content: record.xmlContent,
    })
    .select()
    .single();

  if (error || !data) return null;
  return rowToRecord(data);
}

export async function deleteUploadHistory(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('fmb_upload_history')
    .delete()
    .eq('id', id);

  return !error;
}

export async function clearUploadHistory(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('fmb_upload_history')
    .delete()
    .eq('user_id', userId);

  return !error;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToRecord(row: any): FmbUploadRecord {
  return {
    id: row.id,
    fileName: row.file_name,
    moduleName: row.module_name,
    fieldCount: row.field_count,
    uploadedAt: row.uploaded_at,
    xmlContent: row.xml_content,
  };
}
