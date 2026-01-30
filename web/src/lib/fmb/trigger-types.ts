/**
 * Trigger specification types for FMB analysis
 */

export type SqlStatementType = 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'CURSOR' | 'FUNCTION_CALL';

export type BusinessRuleType =
  | 'VALIDATION'      // 資料驗證
  | 'AUTO_POPULATE'   // 自動填值
  | 'CALCULATION'     // 計算邏輯
  | 'NAVIGATION'      // 導航控制
  | 'MASTER_DETAIL'   // 主從關聯
  | 'DELETE_CHECK'    // 刪除檢查
  | 'CUSTOM';         // 自定義邏輯

export interface ExtractedSql {
  type: SqlStatementType;
  statement: string;
  tables: string[];
  fields: string[];
}

export interface BusinessRule {
  type: BusinessRuleType;
  description: string;
  affectedFields: string[];
}

export interface TriggerSpec {
  no: number;
  name: string;                    // 事件名稱 (WHEN-VALIDATE-ITEM)
  eventDescription: string;        // 事件描述 (當項目驗證完成後觸發)
  javaUse: string;                 // Java 用途 (用於表單提交前的資料檢查)
  maximoLocation: string;          // Maximo Java 代碼位置 (Mbo.appValidate())
  level: 'Form' | 'Block';
  blockName?: string;
  triggerText: string;
  sqlStatements: ExtractedSql[];
  businessRules: BusinessRule[];
  summary: string;
}

export interface TriggerSectionSpec {
  formTriggers: TriggerSpec[];
  blockTriggers: { blockName: string; triggers: TriggerSpec[] }[];
  statistics: {
    totalCount: number;
    formLevelCount: number;
    blockLevelCount: number;
    byEventType: Record<string, number>;
  };
}
