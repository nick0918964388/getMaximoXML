# Research: FMB 轉 DBC 檔案產生器

**Feature**: 003-fmb-dbc-generator
**Date**: 2026-02-04

## 研究項目

### 1. Maximo DBC Script 格式規範

**Decision**: 採用符合 Maximo script.dtd 的 XML 格式

**Rationale**:
- 分析現有範例檔案 `/spec/xml/V1000_01_ZZ_GL_TABLES.dbc`
- DBC 為 XML 格式，根元素為 `<script>`，包含 `author` 與 `scriptname` 屬性
- 主要結構：`script > statements > define_table > attrdef`
- 必要屬性：
  - `define_table`: object, description, type, primarykey, classname, service
  - `attrdef`: attribute, maxtype, title, remarks; 選填: length, required

**Alternatives considered**:
- 純文字 SQL 格式 - 無法直接在 Maximo 執行
- JSON 中間格式 - 增加額外轉換步驟

### 2. 資料來源萃取策略

**Decision**: 從現有 FmbConversionResult 與 SAFieldDefinition[] 萃取 MBO 與屬性資訊

**Rationale**:
- 現有 `convertFmbToMaximo()` 已將 FMB 結構轉換為標準化的欄位定義
- `SAFieldDefinition` 包含完整的資料庫屬性（maxType, length, dbRequired, title）
- FmbBlock 的 `queryDataSource` 可作為 MBO 名稱來源
- 複用現有解析結果避免重複處理

**Data mapping**:
| FMB/SA 來源 | DBC 目標 |
|-------------|----------|
| FmbBlock.queryDataSource / metadata.mboName | define_table.object |
| FmbBlock.name (或自訂描述) | define_table.description |
| SAFieldDefinition.fieldName | attrdef.attribute |
| SAFieldDefinition.maxType | attrdef.maxtype |
| SAFieldDefinition.length | attrdef.length |
| SAFieldDefinition.title | attrdef.title |
| SAFieldDefinition.label | attrdef.remarks |
| SAFieldDefinition.dbRequired | attrdef.required |

### 3. MBO 定義萃取邏輯

**Decision**: 以 FmbBlock 為基礎單位，每個 Block 對應一個 MBO

**Rationale**:
- Oracle Forms 的 Block 概念對應 Maximo 的 MBO
- Block 的 `queryDataSource` 通常指向資料表/View
- 多個 Block 可能對應多個 MBO（主檔/明細關係）
- 若無明確的 queryDataSource，使用 Block 名稱作為 MBO 名稱

**Extraction logic**:
```typescript
interface MboDefinition {
  name: string;          // Block.queryDataSource || Block.name
  description: string;   // 從 Block 描述或自動生成
  type: 'system';        // 固定值
  primarykey: string;    // 第一個 required 欄位或 ID 欄位
  classname: string;     // 預設 "psdi.mbo.custapp.CustomMboSet"
  service: string;       // 預設 "CUSTAPP"
}
```

### 4. 型別對應策略

**Decision**: 直接使用現有 `MaximoDataType` 列舉，補充 DBC 特有型別

**Rationale**:
- 現有 `MaximoDataType` 已涵蓋主要型別（ALN, UPPER, INTEGER, DECIMAL, DATE 等）
- DBC 額外支援 BIGINT, AMOUNT 型別，需擴充或對應

**Type mapping additions**:
| 現有 MaximoDataType | DBC maxtype |
|---------------------|-------------|
| ALN | ALN |
| UPPER | UPPER |
| LOWER | LOWER (需新增) |
| INTEGER | INTEGER |
| SMALLINT | SMALLINT |
| DECIMAL | AMOUNT (金額) 或 DECIMAL |
| FLOAT | FLOAT |
| DATE | DATE |
| DATETIME | DATETIME |
| YORN | YORN |
| CLOB | CLOB |
| LONGALN | LONGALN |
| - (新增) | BIGINT |

### 5. UI 元件設計

**Decision**: 新增 DbcPanel 元件，整合至現有 FmbConverterPage 的 TabGroup

**Rationale**:
- 遵循現有分頁架構（TreeViewer, ConverterPanel, SpecPanel）
- 複用 shadcn/ui Card, Button, Textarea 元件
- 程式碼預覽採用等寬字體顯示

**Component structure**:
```typescript
// DbcPanel props
interface DbcPanelProps {
  fmbModule: FmbModule | null;
  fields: SAFieldDefinition[];
  metadata: ApplicationMetadata;
}
```

### 6. 下載功能實作

**Decision**: 使用 Blob API 與 URL.createObjectURL 實現純前端下載

**Rationale**:
- 無需後端支援
- 與現有 Word 文件下載功能一致
- 檔名格式：`{模組名稱}_dbc.dbc`

**Implementation pattern**:
```typescript
function downloadDbc(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

### 7. 設定項目

**Decision**: 提供 author、scriptname、description 三個可自訂欄位

**Rationale**:
- 符合 spec.md FR-007 需求
- 預設值：
  - author: "MaximoExpert" (可從 localStorage 記憶)
  - scriptname: `{MBO名稱}_SETUP`
  - description: 自動根據 MBO 生成

## 研究結論

所有技術細節已釐清，無需進一步研究。可進入 Phase 1 設計階段。
