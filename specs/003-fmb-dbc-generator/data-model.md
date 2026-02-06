# Data Model: FMB 轉 DBC 檔案產生器

**Feature**: 003-fmb-dbc-generator
**Date**: 2026-02-04

## 新增型別定義

### DBC Script 相關型別

```typescript
/**
 * DBC 腳本元資料
 */
export interface DbcScriptMetadata {
  /** 腳本作者 */
  author: string;
  /** 腳本名稱 */
  scriptname: string;
  /** 腳本描述 */
  description: string;
}

/**
 * DBC 屬性定義 (對應 <attrdef> 元素)
 */
export interface DbcAttributeDefinition {
  /** 屬性名稱 */
  attribute: string;
  /** Maximo 資料型別 */
  maxtype: DbcDataType;
  /** 欄位長度 (字串型別適用) */
  length?: number;
  /** 欄位標題 */
  title: string;
  /** 備註說明 */
  remarks: string;
  /** 是否必填 */
  required?: boolean;
}

/**
 * DBC 表格定義 (對應 <define_table> 元素)
 */
export interface DbcTableDefinition {
  /** MBO 物件名稱 */
  object: string;
  /** 表格描述 */
  description: string;
  /** 物件類型 (通常為 "system") */
  type: 'system' | 'mbo';
  /** 主鍵欄位 (多欄位以逗號分隔) */
  primarykey: string;
  /** MBO 類別名稱 */
  classname: string;
  /** 服務名稱 */
  service: string;
  /** 屬性定義清單 */
  attributes: DbcAttributeDefinition[];
}

/**
 * 完整 DBC 腳本定義
 */
export interface DbcScript {
  /** 腳本元資料 */
  metadata: DbcScriptMetadata;
  /** 表格定義清單 */
  tables: DbcTableDefinition[];
}

/**
 * DBC 資料型別 (擴充自 MaximoDataType)
 */
export type DbcDataType =
  | 'ALN'       // 英數混合
  | 'UPPER'     // 大寫英數
  | 'LOWER'     // 小寫英數
  | 'INTEGER'   // 整數
  | 'SMALLINT'  // 短整數
  | 'BIGINT'    // 長整數
  | 'DECIMAL'   // 小數
  | 'FLOAT'     // 浮點數
  | 'AMOUNT'    // 金額
  | 'DATE'      // 日期
  | 'DATETIME'  // 日期時間
  | 'TIME'      // 時間
  | 'YORN'      // 是/否
  | 'CLOB'      // 大型文字
  | 'LONGALN'   // 長英數
  | 'GL';       // 總帳帳號

/**
 * DBC 產生器設定
 */
export interface DbcGeneratorConfig {
  /** 預設 classname */
  defaultClassname: string;
  /** 預設 service */
  defaultService: string;
  /** 預設 type */
  defaultType: 'system' | 'mbo';
}

/**
 * DBC 產生結果
 */
export interface DbcGenerationResult {
  /** 產生的 DBC XML 內容 */
  content: string;
  /** 腳本定義 (結構化資料) */
  script: DbcScript;
  /** 建議的檔案名稱 */
  suggestedFilename: string;
}
```

## 預設值常數

```typescript
/**
 * DBC 產生器預設配置
 */
export const DEFAULT_DBC_CONFIG: DbcGeneratorConfig = {
  defaultClassname: 'psdi.mbo.custapp.CustomMboSet',
  defaultService: 'CUSTAPP',
  defaultType: 'system',
};

/**
 * DBC 腳本預設元資料
 */
export const DEFAULT_DBC_METADATA: DbcScriptMetadata = {
  author: 'MaximoExpert',
  scriptname: '',
  description: '',
};
```

## 型別對應表

### MaximoDataType → DbcDataType 對應

| 來源 (MaximoDataType) | 目標 (DbcDataType) | 備註 |
|----------------------|-------------------|------|
| ALN | ALN | 直接對應 |
| UPPER | UPPER | 直接對應 |
| LOWER | LOWER | 直接對應 |
| INTEGER | INTEGER | 直接對應 |
| SMALLINT | SMALLINT | 直接對應 |
| DECIMAL | DECIMAL / AMOUNT | 根據欄位名稱判斷 (含 AMT, AMOUNT, PRICE, COST → AMOUNT) |
| FLOAT | FLOAT | 直接對應 |
| DATE | DATE | 直接對應 |
| DATETIME | DATETIME | 直接對應 |
| TIME | TIME | 直接對應 |
| YORN | YORN | 直接對應 |
| CLOB | CLOB | 直接對應 |
| LONGALN | LONGALN | 直接對應 |
| GL | GL | 直接對應 |

## 資料流程

```
┌─────────────────┐
│   FmbModule     │
│ (已解析的 XML)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────────┐
│ SAFieldDefini-  │      │ DbcScriptMeta-   │
│ tion[]          │      │ data (使用者輸入) │
│ (欄位定義清單)  │      │                  │
└────────┬────────┘      └────────┬─────────┘
         │                        │
         └──────────┬─────────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │ extractMboDefini-  │
         │ tions()            │
         │ (萃取 MBO 定義)     │
         └─────────┬───────────┘
                   │
                   ▼
         ┌─────────────────────┐
         │ DbcScript          │
         │ (結構化腳本資料)    │
         └─────────┬───────────┘
                   │
                   ▼
         ┌─────────────────────┐
         │ generateDbcXml()   │
         │ (產生 XML 字串)     │
         └─────────┬───────────┘
                   │
                   ▼
         ┌─────────────────────┐
         │ DBC XML Content    │
         │ (可下載的檔案內容)  │
         └─────────────────────┘
```

## Entity Relationships

```
DbcScript
    │
    ├── metadata: DbcScriptMetadata (1:1)
    │       ├── author: string
    │       ├── scriptname: string
    │       └── description: string
    │
    └── tables: DbcTableDefinition[] (1:N)
            │
            ├── object: string
            ├── description: string
            ├── type: string
            ├── primarykey: string
            ├── classname: string
            ├── service: string
            │
            └── attributes: DbcAttributeDefinition[] (1:N)
                    ├── attribute: string
                    ├── maxtype: DbcDataType
                    ├── length?: number
                    ├── title: string
                    ├── remarks: string
                    └── required?: boolean
```

## 驗證規則

### DbcAttributeDefinition 驗證

| 欄位 | 規則 |
|------|------|
| attribute | 必填，僅允許大寫英文、數字、底線 |
| maxtype | 必填，須為有效的 DbcDataType |
| length | 字串型別 (ALN, UPPER, LOWER, LONGALN) 必填 |
| title | 必填 |
| remarks | 選填 |
| required | 選填，預設 false |

### DbcTableDefinition 驗證

| 欄位 | 規則 |
|------|------|
| object | 必填，僅允許大寫英文、數字、底線，長度 <= 30 |
| description | 必填 |
| type | 必填，須為 "system" 或 "mbo" |
| primarykey | 必填，須對應至少一個 attribute |
| classname | 必填 |
| service | 必填 |
| attributes | 必須有至少一個屬性 |

### DbcScriptMetadata 驗證

| 欄位 | 規則 |
|------|------|
| author | 必填 |
| scriptname | 必填，僅允許大寫英文、數字、底線 |
| description | 選填 |
