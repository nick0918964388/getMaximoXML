/**
 * 欄位編輯器的下拉選項常數
 */

export const FIELD_TYPES = [
  { value: 'textbox', label: '文字框' },
  { value: 'checkbox', label: '勾選框' },
  { value: 'tablecol', label: '表格欄位' },
  { value: 'multiparttextbox', label: '多部分文字框' },
  { value: 'multilinetextbox', label: '多行文字框' },
  { value: 'statictext', label: '靜態文字' },
  { value: 'pushbutton', label: '按鈕' },
  { value: 'attachments', label: '附件' },
] as const;

export const INPUT_MODES = [
  { value: 'optional', label: '預設' },
  { value: 'required', label: '必填' },
  { value: 'readonly', label: '唯讀' },
  { value: 'query', label: '查詢' },
] as const;

export const FIELD_AREAS = [
  { value: 'header', label: '標頭' },
  { value: 'detail', label: '明細' },
  { value: 'list', label: '列表' },
] as const;

export const MAXIMO_DATA_TYPES = [
  { value: 'ALN', label: 'ALN (英數混合)' },
  { value: 'UPPER', label: 'UPPER (大寫)' },
  { value: 'LOWER', label: 'LOWER (小寫)' },
  { value: 'INTEGER', label: 'INTEGER (整數)' },
  { value: 'SMALLINT', label: 'SMALLINT (短整數)' },
  { value: 'DECIMAL', label: 'DECIMAL (十進位)' },
  { value: 'FLOAT', label: 'FLOAT (浮點數)' },
  { value: 'DATE', label: 'DATE (日期)' },
  { value: 'DATETIME', label: 'DATETIME (日期時間)' },
  { value: 'TIME', label: 'TIME (時間)' },
  { value: 'YORN', label: 'YORN (是/否)' },
  { value: 'CLOB', label: 'CLOB (大文字)' },
  { value: 'LONGALN', label: 'LONGALN (長字串)' },
  { value: 'GL', label: 'GL (總帳)' },
] as const;

/**
 * Default length values by data type
 */
export const DEFAULT_LENGTHS: Record<string, number> = {
  ALN: 100,
  UPPER: 100,
  LOWER: 100,
  INTEGER: 10,
  SMALLINT: 5,
  DECIMAL: 10,
  FLOAT: 10,
  DATE: 0,
  DATETIME: 0,
  TIME: 0,
  YORN: 1,
  CLOB: 0,
  LONGALN: 4000,
  GL: 20,
};
