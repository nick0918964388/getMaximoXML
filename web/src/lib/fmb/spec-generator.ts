/**
 * FMB Spec Generator - Generate functional specification document from FMB module
 *
 * Output format matches the spec samples:
 * - 畫面規格：Block info + 欄位表格
 * - LOV 規格：LOV Column + Return Item
 */

import type { FmbModule, FmbItem, FmbBlock } from './types';

export interface FieldSpec {
  /** 編號 */
  no: number;
  /** Prompt (標籤) */
  prompt: string;
  /** DB Column (欄位名稱) */
  dbColumn: string;
  /** Displayed (是否顯示) */
  displayed: boolean;
  /** Data Type (資料類型) */
  dataType: string;
  /** Required (是否必填) */
  required: boolean;
  /** Case Restriction (大小寫限制) */
  caseRestriction: string;
  /** LOV 名稱 */
  lovName: string;
  /** FormatMask (格式遮罩) */
  formatMask: string;
  /** Update Allowed (可更新) */
  updateAllowed: boolean;
  /** Initial Value (預設值) */
  initialValue: string;
  /** Remark (備註) */
  remark: string;
}

export interface ButtonSpec {
  /** 按鈕名稱 */
  name: string;
  /** 按鈕標籤 */
  label: string;
  /** 按鈕說明 */
  description: string;
}

export interface BlockSpec {
  /** Block 名稱 */
  name: string;
  /** Base Table (表格名稱) */
  baseTable: string;
  /** WHERE 條件 */
  whereCondition: string;
  /** ORDER BY 條件 */
  orderByClause: string;
  /** Insert Allowed (新增資料否) */
  insertAllowed: boolean;
  /** Update Allowed (更新資料否) */
  updateAllowed: boolean;
  /** Delete Allowed (刪除資料否) */
  deleteAllowed: boolean;
  /** 欄位清單 */
  fields: FieldSpec[];
}

export interface LovColumnSpec {
  /** LOV Column Name */
  columnName: string;
  /** Return Item (回傳欄位) */
  returnItem: string;
}

export interface LovSpec {
  /** 編號 */
  no: number;
  /** LOV 名稱 */
  name: string;
  /** Record Group Name (資料來源) */
  recordGroupName: string;
  /** LOV Columns */
  columns: LovColumnSpec[];
}

export interface FormSpec {
  /** 表單名稱 */
  formName: string;
  /** 表單標題 */
  formTitle: string;
  /** 程式功能說明 */
  functionDescription: string;
  /** 畫面區塊 (含欄位) */
  blocks: BlockSpec[];
  /** 按鈕 */
  buttons: ButtonSpec[];
  /** LOV 清單 */
  lovs: LovSpec[];
}

/** Canvas names that contain visible form fields */
const VISIBLE_CANVASES = ['CANVAS_BODY', 'CANVAS_TAB'];
const SKIP_BLOCKS = ['TOOL_BUTTON', 'HEAD_BLOCK', 'CBLK'];

/** System button labels to skip */
const SYSTEM_BUTTON_LABELS = [
  'Save', 'Query', 'Record', 'Scroll', 'Values', 'Form', 'Clear', 'Exit',
  'F6', 'F7', 'F8', 'F9', 'F10', 'PageUp', 'PageDown', 'Up', 'Down', 'Ctrl',
];

/**
 * Decode HTML entities in string
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#10;/g, '\n')
    .replace(/&#13;/g, '\r');
}

/**
 * Get attribute value with fallback.
 * Handles namespaced attributes (e.g., "_overridden:WhereClause") by matching local name.
 * Priority: _overridden > plain > _inherited > _default
 */
function getAttr(attrs: Record<string, string>, key: string, defaultVal: string = ''): string {
  // Try plain key first
  if (attrs[key] !== undefined) return attrs[key];

  // Search for namespaced attributes by local name
  let overridden: string | undefined;
  let inherited: string | undefined;
  let defaultAttr: string | undefined;
  let any: string | undefined;

  for (const [attrName, value] of Object.entries(attrs)) {
    const localName = attrName.includes(':') ? attrName.split(':').pop()! : attrName;
    if (localName !== key) continue;

    if (attrName.includes('_overridden:')) {
      overridden = value;
    } else if (attrName.includes('_inherited:') || attrName.includes('inherited_overridden:')) {
      if (!inherited) inherited = value;
    } else if (attrName.includes('_default:')) {
      defaultAttr = value;
    } else {
      any = value;
    }
  }

  return overridden ?? inherited ?? any ?? defaultAttr ?? defaultVal;
}

function getBoolAttr(attrs: Record<string, string>, key: string, defaultVal: boolean = true): boolean {
  const val = getAttr(attrs, key).toLowerCase();
  if (val === 'true' || val === 'yes') return true;
  if (val === 'false' || val === 'no') return false;
  return defaultVal;
}

/**
 * Generate form specification from FMB module
 */
export function generateFormSpec(module: FmbModule): FormSpec {
  const blocks: BlockSpec[] = [];
  const buttons: ButtonSpec[] = [];

  // Process each block
  for (const block of module.blocks) {
    if (SKIP_BLOCKS.includes(block.name)) continue;

    const blockSpec = processBlock(block);
    if (blockSpec.fields.length > 0 || blockSpec.baseTable) {
      blocks.push(blockSpec);
    }

    // Extract buttons from block
    for (const item of block.items) {
      if (item.itemType === 'PUSH_BUTTON') {
        const label = item.label ?? item.prompt ?? item.name;
        if (SYSTEM_BUTTON_LABELS.some((sys) => label.includes(sys))) continue;

        buttons.push({
          name: item.name,
          label,
          description: inferButtonDescription(item),
        });
      }
    }
  }

  // Process LOVs
  const lovs = processLovs(module);

  return {
    formName: module.name,
    formTitle: module.title ?? module.name,
    functionDescription: inferFunctionDescription(module),
    blocks,
    buttons,
    lovs,
  };
}

/**
 * Process a single block
 */
function processBlock(block: FmbBlock): BlockSpec {
  const attrs = block.attributes;
  const fields: FieldSpec[] = [];
  let fieldNo = 1;

  for (const item of block.items) {
    // Skip items not on visible canvases
    if (!item.canvas || !VISIBLE_CANVASES.includes(item.canvas)) continue;

    // Skip push buttons (handled separately)
    if (item.itemType === 'PUSH_BUTTON') continue;

    // Skip hidden items
    if (item.visible === false) continue;

    const fieldSpec = createFieldSpec(item, fieldNo);
    fields.push(fieldSpec);
    fieldNo++;
  }

  return {
    name: block.name,
    baseTable: block.queryDataSource ?? '',
    whereCondition: decodeHtmlEntities(getAttr(attrs, 'WhereClause')),
    orderByClause: getAttr(attrs, 'OrderByClause'),
    insertAllowed: getBoolAttr(attrs, 'InsertAllowed', true),
    updateAllowed: getBoolAttr(attrs, 'UpdateAllowed', true),
    deleteAllowed: getBoolAttr(attrs, 'DeleteAllowed', true),
    fields,
  };
}

/**
 * Create field specification from FMB item
 */
function createFieldSpec(item: FmbItem, no: number): FieldSpec {
  const attrs = item.attributes;

  return {
    no,
    prompt: item.prompt ?? '',
    dbColumn: item.name,
    displayed: item.visible !== false,
    dataType: item.dataType ?? 'Char',
    required: item.required ?? false,
    caseRestriction: getAttr(attrs, 'CaseRestriction', 'Mixed'),
    lovName: item.lovName ?? '',
    formatMask: getAttr(attrs, 'FormatMask') || getAttr(attrs, 'Hint'),
    updateAllowed: item.enabled !== false,
    initialValue: getAttr(attrs, 'InitialValue'),
    remark: inferFieldRemark(item),
  };
}

/**
 * Process LOVs with column and return item information
 * Uses LOVColumnMapping from parsed FMB for accurate column/return item info
 */
function processLovs(module: FmbModule): LovSpec[] {
  const lovs: LovSpec[] = [];

  let lovNo = 1;
  for (const lov of module.lovs) {
    const lovSpec: LovSpec = {
      no: lovNo++,
      name: lov.name,
      recordGroupName: lov.recordGroupName ?? '',
      columns: lov.columnMappings.map((col) => ({
        columnName: col.name,
        returnItem: col.returnItem,
      })),
    };
    lovs.push(lovSpec);
  }

  return lovs;
}

/**
 * Infer field remark based on patterns
 */
function inferFieldRemark(item: FmbItem): string {
  const remarks: string[] = [];
  const name = item.name.toUpperCase();

  // Auto-generated fields
  if (name.includes('SLIP_NO') || name.includes('_NO')) {
    if (item.enabled === false || item.itemType === 'DISPLAY_ITEM') {
      remarks.push('新增存檔時，自動產生流水號');
    }
  }

  if (name.includes('_DATE') && (item.enabled === false || item.itemType === 'DISPLAY_ITEM')) {
    remarks.push('新增存檔時，自動產生系統日');
  }

  // LOV reference
  if (item.lovName) {
    remarks.push(`資料來源→${item.lovName}`);
  }

  return remarks.join('；');
}

/**
 * Infer button description
 */
function inferButtonDescription(item: FmbItem): string {
  const label = item.label ?? item.prompt ?? '';
  const name = item.name.toUpperCase();

  const buttonDescriptions: Record<string, string> = {
    'SUPPORTING': '憑證輸入',
    'LIST': '列印報告表',
    'REPORT': '產生報表',
    'PRINT': '列印',
    'HELP': '說明',
    'CERTIFICATE': '憑證',
  };

  for (const [key, desc] of Object.entries(buttonDescriptions)) {
    if (name.includes(key) || label.toUpperCase().includes(key)) {
      return desc;
    }
  }

  return '';
}

/**
 * Infer function description from module
 */
function inferFunctionDescription(module: FmbModule): string {
  const name = module.name.toUpperCase();

  if (name.includes('PCS')) return '差旅費申請作業';
  if (name.includes('APS')) return '應付帳款作業';
  if (name.includes('GLS')) return '總帳作業';

  return module.title ?? module.name;
}

/**
 * Generate markdown specification document
 */
export function generateMarkdownSpec(spec: FormSpec): string {
  const lines: string[] = [];

  // Header
  lines.push(`# ${spec.formName} 功能規格說明`);
  lines.push('');
  lines.push(`**程式名稱:** ${spec.formTitle}`);
  lines.push('');

  // Blocks (畫面規格)
  spec.blocks.forEach((block, idx) => {
    lines.push(`## (${idx + 1}) 畫面(${idx + 1})`);
    lines.push('');

    // Block info table
    lines.push('| 項目 | 內容 |');
    lines.push('|------|------|');
    lines.push(`| Block Name | ${block.name} |`);
    lines.push(`| Base Table(表格名稱) | ${block.baseTable || '-'} |`);

    if (block.whereCondition) {
      // Format WHERE clause for markdown
      const whereFormatted = block.whereCondition.replace(/\n/g, '<br>');
      lines.push(`| Where Condition(條件) | ${whereFormatted} |`);
    }

    if (block.orderByClause) {
      lines.push(`| Order By Clause(排序) | ${block.orderByClause} |`);
    }

    lines.push(`| Insert Allowed(新增資料否) | ${block.insertAllowed ? 'true' : 'false'} |`);
    lines.push(`| Update Allowed(更新資料否) | ${block.updateAllowed ? 'true' : 'false'} |`);
    lines.push(`| Delete Allowed(刪除資料否) | ${block.deleteAllowed ? 'true' : 'false'} |`);
    lines.push('');

    // Fields table
    if (block.fields.length > 0) {
      lines.push('### 欄位清單');
      lines.push('');
      lines.push('| No | Prompt | DB Column | Displayed | Data Type | Required | Case Restriction | LOV | FormatMask | Update Allowed | Initial Value | Remark |');
      lines.push('|----|--------|-----------|-----------|-----------|----------|------------------|-----|------------|----------------|---------------|--------|');

      for (const field of block.fields) {
        lines.push(`| ${field.no} | ${field.prompt || '-'} | ${field.dbColumn} | ${field.displayed ? 'Y' : 'N'} | ${field.dataType} | ${field.required ? 'TRUE' : '-'} | ${field.caseRestriction} | ${field.lovName || '-'} | ${field.formatMask || '-'} | ${field.updateAllowed ? 'TRUE' : 'FALSE'} | ${field.initialValue || '-'} | ${field.remark || '-'} |`);
      }
      lines.push('');
    }
  });

  // Buttons
  if (spec.buttons.length > 0) {
    lines.push('## 按鈕');
    lines.push('');
    lines.push('| 按鈕名稱 | 標籤 | 說明 |');
    lines.push('|----------|------|------|');
    for (const btn of spec.buttons) {
      lines.push(`| ${btn.name} | ${btn.label} | ${btn.description || '-'} |`);
    }
    lines.push('');
  }

  // LOV (規格)
  if (spec.lovs.length > 0) {
    lines.push('## (3) LOV');
    lines.push('');
    lines.push('- A. Name：List of Value 名稱');
    lines.push('- B. Record Group Name：LOV 的資料來源');
    lines.push('- C. LOV Column Name：LOV 顯示的欄位');
    lines.push('- D. Return Item：點選 LOV 後回傳至畫面對應的欄位');
    lines.push('');
    lines.push('| No | Name | Record Group Name | LOV Column Name | Return Item |');
    lines.push('|----|------|-------------------|-----------------|-------------|');

    let rowNo = 1;
    for (const lov of spec.lovs) {
      if (lov.columns.length > 0) {
        for (const col of lov.columns) {
          lines.push(`| ${rowNo++} | ${lov.name} | ${lov.recordGroupName} | ${col.columnName} | ${col.returnItem} |`);
        }
      } else {
        lines.push(`| ${rowNo++} | ${lov.name} | ${lov.recordGroupName} | - | - |`);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}
