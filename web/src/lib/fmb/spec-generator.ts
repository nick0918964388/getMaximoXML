/**
 * FMB Spec Generator - Generate functional specification document from FMB module
 *
 * Output format matches the spec samples:
 * - 畫面規格：Block info + 欄位表格
 * - LOV 規格：LOV Column + Return Item
 */

import type { FmbModule, FmbItem, FmbBlock } from './types';
import type { TriggerSectionSpec } from './trigger-types';
import { analyzeTriggers } from './trigger-analyzer';

export interface TabPageSpec {
  /** 頁籤名稱 */
  name: string;
  /** 頁籤標籤 */
  label: string;
  /** Canvas 名稱 */
  canvasName: string;
}

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
  /** TabPage 名稱 */
  tabPage: string;
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
  /** Record Group SQL 查詢 */
  recordGroupQuery: string;
  /** LOV Columns */
  columns: LovColumnSpec[];
}

export interface RecordGroupColumnSpec {
  /** 欄位名稱 */
  name: string;
  /** 資料類型 */
  dataType: string;
  /** 最大長度 */
  maxLength?: number;
}

export interface RecordGroupSpec {
  /** 編號 */
  no: number;
  /** Record Group 名稱 */
  name: string;
  /** 類型 (Query/Static) */
  recordGroupType: string;
  /** SQL 查詢語句 */
  query: string;
  /** 欄位定義 */
  columns: RecordGroupColumnSpec[];
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
  /** Record Group 清單 (含 SQL) */
  recordGroups: RecordGroupSpec[];
  /** 觸發器規則 */
  triggers: TriggerSectionSpec;
  /** TabPages (頁籤) */
  tabPages: TabPageSpec[];
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

  // Process Record Groups
  const recordGroups = processRecordGroups(module);

  // Process Triggers
  const triggers = analyzeTriggers(module);

  // Process TabPages
  const tabPages = processTabPages(module);

  return {
    formName: module.name,
    formTitle: module.title ?? module.name,
    functionDescription: inferFunctionDescription(module),
    blocks,
    buttons,
    lovs,
    recordGroups,
    triggers,
    tabPages,
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
    tabPage: item.tabPage ?? '',
  };
}

/**
 * Process LOVs with column and return item information
 * Uses LOVColumnMapping from parsed FMB for accurate column/return item info
 * Includes Record Group SQL query for each LOV
 */
function processLovs(module: FmbModule): LovSpec[] {
  const lovs: LovSpec[] = [];

  // Build a map of Record Group name -> query for quick lookup
  const recordGroupMap = new Map<string, string>();
  if (module.recordGroups) {
    for (const rg of module.recordGroups) {
      if (rg.recordGroupType === 'Query' && rg.query) {
        recordGroupMap.set(rg.name, rg.query);
      }
    }
  }

  let lovNo = 1;
  for (const lov of module.lovs) {
    const recordGroupName = lov.recordGroupName ?? '';
    const lovSpec: LovSpec = {
      no: lovNo++,
      name: lov.name,
      recordGroupName,
      recordGroupQuery: recordGroupMap.get(recordGroupName) ?? '',
      columns: (lov.columnMappings ?? []).map((col) => ({
        columnName: col.name,
        returnItem: col.returnItem,
      })),
    };
    lovs.push(lovSpec);
  }

  return lovs;
}

/**
 * Process Record Groups with SQL query information
 */
function processRecordGroups(module: FmbModule): RecordGroupSpec[] {
  const recordGroups: RecordGroupSpec[] = [];

  if (!module.recordGroups) return recordGroups;

  let rgNo = 1;
  for (const rg of module.recordGroups) {
    // Only include record groups with Query type (have SQL)
    if (rg.recordGroupType === 'Query' && rg.query) {
      recordGroups.push({
        no: rgNo++,
        name: rg.name,
        recordGroupType: rg.recordGroupType,
        query: rg.query,
        columns: rg.columns.map((col) => ({
          name: col.name,
          dataType: col.dataType,
          maxLength: col.maxLength,
        })),
      });
    }
  }

  return recordGroups;
}

/**
 * Process TabPages from canvases
 */
function processTabPages(module: FmbModule): TabPageSpec[] {
  const tabPages: TabPageSpec[] = [];

  for (const canvas of module.canvases) {
    for (const tabPage of canvas.tabPages) {
      tabPages.push({
        name: tabPage.name,
        label: tabPage.label ?? '',
        canvasName: canvas.name,
      });
    }
  }

  return tabPages;
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

  // TabPages (頁籤)
  if (spec.tabPages && spec.tabPages.length > 0) {
    lines.push('## TabPages (頁籤)');
    lines.push('');
    lines.push('| 頁籤名稱 | 標籤 |');
    lines.push('|----------|------|');
    for (const tabPage of spec.tabPages) {
      lines.push(`| ${tabPage.name} | ${tabPage.label || '-'} |`);
    }
    lines.push('');
  }

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

  // LOV (規格) - 整合 Record Group SQL
  if (spec.lovs.length > 0) {
    lines.push('## (3) LOV 與資料來源');
    lines.push('');
    lines.push('- A. Name：List of Value 名稱');
    lines.push('- B. Record Group Name：LOV 的資料來源');
    lines.push('- C. LOV Column Name：LOV 顯示的欄位');
    lines.push('- D. Return Item：點選 LOV 後回傳至畫面對應的欄位');
    lines.push('- E. SQL Query：資料查詢語句');
    lines.push('');

    for (const lov of spec.lovs) {
      lines.push(`### ${lov.no}. ${lov.name}`);
      lines.push('');
      lines.push(`**Record Group:** ${lov.recordGroupName || '-'}`);
      lines.push('');

      // LOV Column mappings
      if (lov.columns.length > 0) {
        lines.push('**欄位對應:**');
        lines.push('| LOV Column Name | Return Item |');
        lines.push('|-----------------|-------------|');
        for (const col of lov.columns) {
          lines.push(`| ${col.columnName} | ${col.returnItem} |`);
        }
        lines.push('');
      }

      // SQL Query from Record Group
      if (lov.recordGroupQuery) {
        lines.push('**SQL Query:**');
        lines.push('```sql');
        lines.push(lov.recordGroupQuery);
        lines.push('```');
        lines.push('');
      }
    }
  }

  // Triggers (觸發器規則)
  if (spec.triggers && spec.triggers.statistics.totalCount > 0) {
    lines.push('## (4) 觸發器規則');
    lines.push('');

    // Statistics
    lines.push('### 統計摘要');
    lines.push('');
    lines.push('| 項目 | 數量 |');
    lines.push('|------|------|');
    lines.push(`| 總數 | ${spec.triggers.statistics.totalCount} |`);
    lines.push(`| Form 層級 | ${spec.triggers.statistics.formLevelCount} |`);
    lines.push(`| Block 層級 | ${spec.triggers.statistics.blockLevelCount} |`);
    lines.push('');

    // Form-level triggers
    if (spec.triggers.formTriggers.length > 0) {
      lines.push('### Form 層級觸發器');
      lines.push('');
      lines.push('| No | 名稱 | 事件描述 | 業務規則摘要 |');
      lines.push('|----|------|----------|--------------|');
      for (const t of spec.triggers.formTriggers) {
        lines.push(`| ${t.no} | ${t.name} | ${t.eventDescription} | ${t.summary} |`);
      }
      lines.push('');
    }

    // Block-level triggers
    for (const block of spec.triggers.blockTriggers) {
      lines.push(`### Block: ${block.blockName}`);
      lines.push('');
      lines.push('| No | 名稱 | 事件描述 | 業務規則 | SQL |');
      lines.push('|----|------|----------|----------|-----|');
      for (const t of block.triggers) {
        const hasSql = t.sqlStatements.length > 0 ? '✓' : '-';
        lines.push(`| ${t.no} | ${t.name} | ${t.eventDescription} | ${t.summary} | ${hasSql} |`);
      }
      lines.push('');
    }

    // Detailed business rules
    const allTriggers = [
      ...spec.triggers.formTriggers,
      ...spec.triggers.blockTriggers.flatMap(b => b.triggers),
    ];
    const triggersWithDetails = allTriggers.filter(
      t => t.businessRules.length > 0 || t.sqlStatements.length > 0
    );

    if (triggersWithDetails.length > 0) {
      lines.push('### 詳細業務規則');
      lines.push('');

      for (const t of triggersWithDetails) {
        const blockInfo = t.level === 'Block' ? ` (Block: ${t.blockName})` : '';
        lines.push(`#### ${t.no}. ${t.name}${blockInfo}`);
        lines.push(`**事件描述:** ${t.eventDescription}`);
        lines.push(`**Java 用途:** ${t.javaUse}`);
        lines.push(`**Maximo Java 位置:** \`${t.maximoLocation}\``);
        lines.push('');

        if (t.businessRules.length > 0) {
          lines.push('**業務規則:**');
          for (const rule of t.businessRules) {
            const fields = rule.affectedFields.length > 0
              ? `\n  - 影響欄位: ${rule.affectedFields.join(', ')}`
              : '';
            lines.push(`- [${rule.type}] ${rule.description}${fields}`);
          }
          lines.push('');
        }

        if (t.sqlStatements.length > 0) {
          lines.push('**SQL 語句:**');
          lines.push('```sql');
          for (const sql of t.sqlStatements) {
            lines.push(`-- ${sql.type}`);
            lines.push(sql.statement);
          }
          lines.push('```');
          lines.push('');
        }
      }
    }
  }

  return lines.join('\n');
}
