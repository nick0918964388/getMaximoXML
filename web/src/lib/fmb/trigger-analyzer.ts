/**
 * PL/SQL Trigger Analyzer
 * Extracts SQL statements and business rules from FMB trigger text
 */

import type { FmbModule } from './types';
import type {
  TriggerSectionSpec,
  TriggerSpec,
  ExtractedSql,
  BusinessRule,
} from './trigger-types';
import { getTriggerEventInfo } from './trigger-events';

/**
 * Decode HTML entities in trigger text
 */
export function decodeTriggerText(text: string | undefined): string {
  if (!text) return '';

  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#10;/g, '\n')
    .replace(/&#13;/g, '\r');
}

/**
 * Extract SQL statements from PL/SQL code
 */
export function extractSqlStatements(plsql: string): ExtractedSql[] {
  const statements: ExtractedSql[] = [];
  const normalizedSql = plsql.toLowerCase();

  // Skip simple trigger text
  if (isSimpleTrigger(normalizedSql)) {
    return [];
  }

  // Extract CURSOR declarations
  const cursorRegex = /cursor\s+\w+\s+is\s+(select\s+([\s\S]*?)\s+from\s+([\s\S]*?))(?:;|$)/gi;
  let match: RegExpExecArray | null;
  while ((match = cursorRegex.exec(plsql)) !== null) {
    const selectClause = match[2].trim();
    const fromClause = match[3].trim();
    statements.push({
      type: 'CURSOR',
      statement: match[0].trim(),
      tables: extractTables('from ' + fromClause),
      fields: extractSelectFields(selectClause),
    });
  }

  // Extract SELECT INTO statements (not inside CURSOR)
  const selectIntoRegex = /\bselect\s+([\s\S]*?)\s+into\s+[\s\S]*?\s+from\s+(\w+)/gi;
  while ((match = selectIntoRegex.exec(plsql)) !== null) {
    // Skip if this is part of a cursor declaration
    const beforeMatch = plsql.slice(0, match.index).toLowerCase();
    if (/cursor\s+\w+\s+is\s*$/.test(beforeMatch)) continue;

    statements.push({
      type: 'SELECT',
      statement: match[0].trim(),
      tables: [match[2].toLowerCase()],
      fields: extractSelectFields(match[1]),
    });
  }

  // Extract function call assignments (:field := function_name(...))
  const funcAssignRegex = /:(\w+\.\w+)\s*:=\s*(\w+)\s*\(/gi;
  while ((match = funcAssignRegex.exec(plsql)) !== null) {
    const funcName = match[2].toLowerCase();
    // Skip built-in assignments like := null
    if (['null', 'true', 'false', 'nvl', 'trunc', 'to_char', 'to_date', 'to_number'].includes(funcName)) continue;

    statements.push({
      type: 'FUNCTION_CALL',
      statement: match[0].trim(),
      tables: [],
      fields: [match[1]],
    });
  }

  // Extract standalone procedure calls (p_xxx; or p_xxx(params);)
  const procCallRegex = /(?:^|;|\s)(p_\w+|sf_\w+)\s*(?:\([^)]*\))?\s*;/gi;
  let procMatch: RegExpExecArray | null;
  while ((procMatch = procCallRegex.exec(plsql)) !== null) {
    // Skip if already captured as function assignment
    if (statements.some(s => s.statement.includes(procMatch![1]))) continue;

    statements.push({
      type: 'FUNCTION_CALL',
      statement: procMatch[1] + (procMatch[0].includes('(') ? '(...)' : ''),
      tables: [],
      fields: [],
    });
  }

  return statements;
}

/**
 * Check if trigger text is a simple system operation
 */
function isSimpleTrigger(text: string): boolean {
  const simplePatterns = [
    /^\s*null\s*;?\s*$/i,
    /^\s*do_key\s*\([^)]+\)\s*;?\s*$/i,
  ];
  return simplePatterns.some(p => p.test(text));
}

/**
 * Extract table names from SQL fragment
 */
function extractTables(sql: string): string[] {
  const tables: string[] = [];
  const fromRegex = /from\s+(\w+)/gi;
  let match;
  while ((match = fromRegex.exec(sql)) !== null) {
    tables.push(match[1].toLowerCase());
  }
  return [...new Set(tables)];
}

/**
 * Extract field names from SELECT clause (pure field list, no FROM)
 */
function extractSelectFields(selectClause: string): string[] {
  const fields: string[] = [];
  // Remove 'distinct' keyword
  const cleaned = selectClause.replace(/\bdistinct\b/gi, '').trim();
  // Split by comma and extract field names
  const parts = cleaned.split(',');
  for (const part of parts) {
    const trimmed = part.trim();
    // Handle aliased fields: field as alias or field alias
    const aliasMatch = trimmed.match(/^(\w+(?:\.\w+)?)\s+(?:as\s+)?(\w+)$/i);
    if (aliasMatch) {
      fields.push(aliasMatch[1]);
    } else {
      // Simple field name (just the identifier)
      const fieldMatch = trimmed.match(/^(\w+(?:\.\w+)?)$/);
      if (fieldMatch && fieldMatch[1] !== '*') {
        fields.push(fieldMatch[1]);
      }
    }
  }
  return [...new Set(fields)];
}

/**
 * Analyze business rules from PL/SQL code
 */
export function analyzeBusinessRules(plsql: string, triggerName: string): BusinessRule[] {
  const rules: BusinessRule[] = [];
  const upperTrigger = triggerName.toUpperCase();
  const lowerPlsql = plsql.toLowerCase();

  // Skip simple triggers
  if (isSimpleTrigger(lowerPlsql)) {
    return [];
  }

  // VALIDATION: Check for raise form_trigger_failure
  if (lowerPlsql.includes('raise form_trigger_failure') ||
      lowerPlsql.includes('s_alert') ||
      lowerPlsql.includes('show_alert')) {
    rules.push({
      type: 'VALIDATION',
      description: extractValidationDescription(plsql),
      affectedFields: extractAffectedFields(plsql),
    });
  }

  // AUTO_POPULATE: Check for field assignment with function call in PRE-INSERT/PRE-UPDATE
  const funcAssignRegex = /:(\w+\.\w+)\s*:=\s*(?!null|true|false|:)(\w+)\s*\(/gi;
  let match;
  while ((match = funcAssignRegex.exec(plsql)) !== null) {
    rules.push({
      type: 'AUTO_POPULATE',
      description: `自動產生 ${match[1]} 的值`,
      affectedFields: [match[1]],
    });
  }

  // CALCULATION: Check for arithmetic operations in assignments
  const calcRegex = /:(\w+\.\w+)\s*:=\s*:[\w.]+\s*[+\-*/]\s*:[\w.]+/gi;
  while ((match = calcRegex.exec(plsql)) !== null) {
    rules.push({
      type: 'CALCULATION',
      description: `計算 ${match[1]} 的值`,
      affectedFields: [match[1]],
    });
  }

  // NAVIGATION: Check for go_block, go_item, next_block, etc.
  if (/go_block|go_item|next_block|previous_block|next_item|previous_item/i.test(plsql)) {
    rules.push({
      type: 'NAVIGATION',
      description: '導航至指定區塊或欄位',
      affectedFields: [],
    });
  }

  // MASTER_DETAIL: Check for cursor with master reference
  if (/cursor\s+\w+\s+is\s+select[\s\S]*?where[\s\S]*?=\s*:\w+\.\w+/i.test(plsql)) {
    rules.push({
      type: 'MASTER_DETAIL',
      description: '主從關聯資料處理',
      affectedFields: extractAffectedFields(plsql),
    });
  }

  // DELETE_CHECK: Check in PRE-DELETE trigger
  if (upperTrigger === 'PRE-DELETE' &&
      (lowerPlsql.includes('select') && lowerPlsql.includes('count'))) {
    rules.push({
      type: 'DELETE_CHECK',
      description: '刪除前檢查關聯資料',
      affectedFields: [],
    });
  }

  // If no specific rules identified, mark as CUSTOM
  if (rules.length === 0 && !isSimpleTrigger(lowerPlsql)) {
    rules.push({
      type: 'CUSTOM',
      description: extractCustomDescription(plsql, triggerName),
      affectedFields: extractAffectedFields(plsql),
    });
  }

  return rules;
}

/**
 * Extract validation description from PL/SQL
 */
function extractValidationDescription(plsql: string): string {
  // Try to extract message from s_alert or show_alert
  const alertMatch = plsql.match(/s_alert\s*\([^,]+,\s*'([^']+)'/i) ||
                     plsql.match(/show_alert\s*\([^,]+,\s*'([^']+)'/i) ||
                     plsql.match(/show_alert_message\s*\('([^']+)'/i);
  if (alertMatch) {
    return `驗證規則: ${alertMatch[1]}`;
  }

  // Try to extract condition
  const condMatch = plsql.match(/if\s+([\s\S]+?)\s+then/i);
  if (condMatch) {
    const condition = condMatch[1].trim().slice(0, 50);
    return `驗證條件: ${condition}`;
  }

  return '資料驗證';
}

/**
 * Extract custom description based on trigger type
 */
function extractCustomDescription(plsql: string, triggerName: string): string {
  const upperTrigger = triggerName.toUpperCase();

  if (upperTrigger.includes('BUTTON')) {
    return '按鈕事件處理';
  }
  if (upperTrigger.includes('QUERY')) {
    return '查詢處理';
  }
  if (upperTrigger.includes('INSERT')) {
    return '新增前/後處理';
  }
  if (upperTrigger.includes('UPDATE')) {
    return '更新前/後處理';
  }
  if (upperTrigger.includes('DELETE')) {
    return '刪除前/後處理';
  }

  return '自定義邏輯處理';
}

/**
 * Extract affected field names from PL/SQL
 */
function extractAffectedFields(plsql: string): string[] {
  const fields: string[] = [];
  const fieldRegex = /:(\w+\.\w+)/g;
  let match;
  while ((match = fieldRegex.exec(plsql)) !== null) {
    // Skip system variables
    if (!match[1].toLowerCase().startsWith('system.') &&
        !match[1].toLowerCase().startsWith('global.')) {
      fields.push(match[1]);
    }
  }
  return [...new Set(fields)];
}

/**
 * Generate human-readable summary of trigger
 */
export function generateTriggerSummary(plsql: string, triggerName: string): string {
  const lowerPlsql = plsql.toLowerCase().trim();

  // Handle simple triggers
  if (/^\s*null\s*;?\s*$/i.test(lowerPlsql)) {
    return '無特殊處理';
  }
  if (/^\s*do_key\s*\(/i.test(lowerPlsql)) {
    return '系統按鍵操作';
  }

  const rules = analyzeBusinessRules(plsql, triggerName);
  if (rules.length === 0) {
    return '無特殊處理';
  }

  // Summarize based on rule types
  const summaryParts: string[] = [];

  const hasValidation = rules.some(r => r.type === 'VALIDATION');
  const hasAutoPopulate = rules.some(r => r.type === 'AUTO_POPULATE');
  const hasCalculation = rules.some(r => r.type === 'CALCULATION');
  const hasNavigation = rules.some(r => r.type === 'NAVIGATION');
  const hasMasterDetail = rules.some(r => r.type === 'MASTER_DETAIL');
  const hasDeleteCheck = rules.some(r => r.type === 'DELETE_CHECK');

  if (hasValidation) summaryParts.push('資料驗證');
  if (hasAutoPopulate) {
    const autoFields = rules
      .filter(r => r.type === 'AUTO_POPULATE')
      .flatMap(r => r.affectedFields)
      .map(f => f.split('.').pop())
      .join(', ');
    summaryParts.push(`自動產生${autoFields ? ` (${autoFields})` : ''}`);
  }
  if (hasCalculation) summaryParts.push('欄位計算');
  if (hasNavigation) summaryParts.push('導航控制');
  if (hasMasterDetail) summaryParts.push('主從關聯');
  if (hasDeleteCheck) summaryParts.push('刪除檢查');

  if (summaryParts.length === 0) {
    const customRule = rules.find(r => r.type === 'CUSTOM');
    return customRule?.description ?? '自定義邏輯';
  }

  return summaryParts.join('、');
}

/**
 * Analyze all triggers in an FMB module
 */
export function analyzeTriggers(module: FmbModule): TriggerSectionSpec {
  const formTriggers: TriggerSpec[] = [];
  const blockTriggers: { blockName: string; triggers: TriggerSpec[] }[] = [];
  const byEventType: Record<string, number> = {};

  let no = 1;

  // Process form-level triggers
  for (const trigger of module.triggers) {
    const decodedText = decodeTriggerText(trigger.triggerText);
    const eventInfo = getTriggerEventInfo(trigger.name);

    const spec: TriggerSpec = {
      no: no++,
      name: trigger.name,
      eventDescription: eventInfo.description,
      javaUse: eventInfo.javaUse,
      maximoLocation: eventInfo.maximoLocation,
      level: 'Form',
      triggerText: decodedText,
      sqlStatements: extractSqlStatements(decodedText),
      businessRules: analyzeBusinessRules(decodedText, trigger.name),
      summary: generateTriggerSummary(decodedText, trigger.name),
    };

    formTriggers.push(spec);
    byEventType[trigger.name] = (byEventType[trigger.name] || 0) + 1;
  }

  // Process block-level triggers
  for (const block of module.blocks) {
    if (block.triggers.length === 0) continue;

    const blockTriggerSpecs: TriggerSpec[] = [];

    for (const trigger of block.triggers) {
      const decodedText = decodeTriggerText(trigger.triggerText);
      const eventInfo = getTriggerEventInfo(trigger.name);

      const spec: TriggerSpec = {
        no: no++,
        name: trigger.name,
        eventDescription: eventInfo.description,
        javaUse: eventInfo.javaUse,
        maximoLocation: eventInfo.maximoLocation,
        level: 'Block',
        blockName: block.name,
        triggerText: decodedText,
        sqlStatements: extractSqlStatements(decodedText),
        businessRules: analyzeBusinessRules(decodedText, trigger.name),
        summary: generateTriggerSummary(decodedText, trigger.name),
      };

      blockTriggerSpecs.push(spec);
      byEventType[trigger.name] = (byEventType[trigger.name] || 0) + 1;
    }

    blockTriggers.push({
      blockName: block.name,
      triggers: blockTriggerSpecs,
    });
  }

  const totalCount = formTriggers.length + blockTriggers.reduce((sum, b) => sum + b.triggers.length, 0);

  return {
    formTriggers,
    blockTriggers,
    statistics: {
      totalCount,
      formLevelCount: formTriggers.length,
      blockLevelCount: totalCount - formTriggers.length,
      byEventType,
    },
  };
}
