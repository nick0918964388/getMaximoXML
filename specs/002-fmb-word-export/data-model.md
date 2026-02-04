# Data Model: FMB Word Export

**Feature**: 002-fmb-word-export
**Date**: 2026-02-04

## 概述

本功能不新增資料庫實體，僅使用現有的 `FormSpec` 介面作為輸入。以下文件記錄與 Word 生成相關的資料結構和介面。

## 現有資料結構 (不修改)

### FormSpec (來源: spec-generator.ts)

```typescript
interface FormSpec {
  formName: string;
  formTitle: string;
  functionDescription: string;
  blocks: BlockSpec[];
  buttons: ButtonSpec[];
  lovs: LovSpec[];
  recordGroups: RecordGroupSpec[];
  triggers: TriggerSectionSpec;
}
```

### BlockSpec

```typescript
interface BlockSpec {
  name: string;
  baseTable: string;
  whereCondition: string;
  orderByClause: string;
  insertAllowed: boolean;
  updateAllowed: boolean;
  deleteAllowed: boolean;
  fields: FieldSpec[];
}
```

### FieldSpec

```typescript
interface FieldSpec {
  no: number;
  prompt: string;
  dbColumn: string;
  displayed: boolean;
  dataType: string;
  required: boolean;
  caseRestriction: string;
  lovName: string;
  formatMask: string;
  updateAllowed: boolean;
  initialValue: string;
  remark: string;
}
```

### LovSpec

```typescript
interface LovSpec {
  no: number;
  name: string;
  recordGroupName: string;
  recordGroupQuery: string;
  columns: LovColumnSpec[];
}
```

### TriggerSectionSpec

```typescript
interface TriggerSectionSpec {
  statistics: {
    totalCount: number;
    formLevelCount: number;
    blockLevelCount: number;
  };
  formTriggers: TriggerSpec[];
  blockTriggers: {
    blockName: string;
    triggers: TriggerSpec[];
  }[];
}
```

## Word 生成相關介面 (新增)

### WordDocumentOptions

Word 文件生成的配置選項。

```typescript
interface WordDocumentOptions {
  /** 文件標題 (顯示在文件屬性中) */
  title?: string;
  /** 文件作者 */
  author?: string;
  /** 是否包含觸發器詳細資訊 */
  includeTriggerDetails?: boolean;
  /** 是否包含 SQL 代碼 */
  includeSqlCode?: boolean;
}
```

### WordStyleConfig

Word 樣式配置，用於自訂輸出樣式。

```typescript
interface WordStyleConfig {
  /** 標題字體大小 (pt) */
  headingSizes: {
    h1: number;  // default: 24
    h2: number;  // default: 18
    h3: number;  // default: 14
  };
  /** 表格表頭背景色 (hex) */
  tableHeaderBgColor: string;  // default: "E0E0E0"
  /** 代碼區塊字體 */
  codeFont: string;  // default: "Consolas"
  /** 代碼區塊背景色 (hex) */
  codeBgColor: string;  // default: "F5F5F5"
}
```

## 資料流程圖

```
┌─────────────┐     ┌──────────────────┐     ┌────────────────────┐
│  FmbModule  │────▶│ generateFormSpec │────▶│     FormSpec       │
│  (XML解析)  │     │  (現有函式)       │     │  (結構化資料)      │
└─────────────┘     └──────────────────┘     └─────────┬──────────┘
                                                       │
                                                       ▼
                    ┌──────────────────┐     ┌────────────────────┐
                    │ Packer.toBlob()  │◀────│generateWordDocument│
                    │  (docx 套件)     │     │  (新增函式)        │
                    └────────┬─────────┘     └────────────────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │   Blob 下載       │
                    │  (瀏覽器 API)    │
                    └──────────────────┘
```

## Word 文件結構

生成的 Word 文件包含以下結構：

```
Document
├── Section
│   ├── Paragraph (H1: {formName} 功能規格說明)
│   ├── Paragraph (程式名稱: {formTitle})
│   │
│   ├── [For each block]
│   │   ├── Paragraph (H2: 畫面 {n})
│   │   ├── Table (Block 資訊)
│   │   │   ├── Row: Block Name | {name}
│   │   │   ├── Row: Base Table | {baseTable}
│   │   │   └── ...
│   │   └── Table (欄位清單)
│   │       ├── Header Row
│   │       └── Data Rows
│   │
│   ├── [If buttons.length > 0]
│   │   ├── Paragraph (H2: 按鈕)
│   │   └── Table (按鈕清單)
│   │
│   ├── [If lovs.length > 0]
│   │   ├── Paragraph (H2: LOV 與資料來源)
│   │   └── [For each LOV]
│   │       ├── Paragraph (H3: {lov.name})
│   │       ├── Table (欄位對應)
│   │       └── Paragraph (SQL 代碼 - 等寬字體)
│   │
│   └── [If triggers.totalCount > 0]
│       ├── Paragraph (H2: 觸發器規則)
│       ├── Table (統計摘要)
│       └── [For each trigger group]
│           └── Table (觸發器清單)
```

## 驗證規則

1. `FormSpec` 必須有 `formName`（用於檔案名稱）
2. 如果 `blocks` 為空，仍生成有效文件但只包含標題
3. 特殊字元（`<`, `>`, `&`）由 docx 套件自動處理
4. 空字串欄位顯示為 `-`
