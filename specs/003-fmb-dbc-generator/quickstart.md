# Quickstart: FMB 轉 DBC 檔案產生器

**Feature**: 003-fmb-dbc-generator
**Date**: 2026-02-04

## 快速開始

### 前置需求

- Node.js 18+
- 專案已安裝相依套件 (`npm install` in `/web`)

### 開發環境設定

```bash
# 切換到 web 目錄
cd web

# 啟動開發伺服器
npm run dev

# 開啟瀏覽器
open http://localhost:3000/tools/fmb-converter
```

### 執行測試

```bash
# 在 web 目錄執行
cd web

# 執行所有測試
npm test

# 執行 DBC 相關測試
npm test -- dbc-generator

# 監看模式
npm run test:watch -- dbc-generator
```

## 檔案結構

```
web/src/
├── lib/fmb/
│   ├── types.ts              # 新增 DBC 型別 (DbcScript, DbcTableDefinition 等)
│   ├── dbc-generator.ts      # DBC 產生器核心邏輯
│   └── __tests__/
│       └── dbc-generator.test.ts
│
├── components/fmb/
│   ├── dbc-panel.tsx         # DBC 預覽面板 UI
│   └── __tests__/
│       └── dbc-panel.test.tsx
│
└── app/tools/fmb-converter/
    └── page.tsx              # 整合 DBC 分頁
```

## API 使用範例

### 1. 從欄位定義產生 DBC

```typescript
import { generateDbc } from '@/lib/fmb/dbc-generator';
import type { SAFieldDefinition, ApplicationMetadata } from '@/lib/types';
import type { FmbModule } from '@/lib/fmb/types';

// 準備資料
const fields: SAFieldDefinition[] = [...];
const metadata: ApplicationMetadata = {
  mboName: 'ZZ_CUSTOM_TABLE',
  // ...
};
const fmbModule: FmbModule = {
  name: 'CUSTOM_FORM',
  blocks: [...],
  // ...
};

// 自訂腳本設定
const scriptMetadata = {
  author: 'YourName',
  scriptname: 'ZZ_CUSTOM_TABLE_SETUP',
  description: '建立自訂表格與欄位定義',
};

// 產生 DBC
const result = generateDbc(fields, fmbModule, metadata, scriptMetadata);

console.log(result.content);           // XML 內容
console.log(result.suggestedFilename); // 建議檔名
console.log(result.script.tables);     // 結構化資料
```

### 2. 萃取 MBO 定義

```typescript
import { extractMboDefinitions } from '@/lib/fmb/dbc-generator';

const mboDefinitions = extractMboDefinitions(fmbModule, fields);

// 結果：
// [
//   {
//     object: 'ZZ_CUSTOM_TABLE',
//     description: '自訂表格',
//     type: 'system',
//     primarykey: 'CUSTOM_ID',
//     classname: 'psdi.mbo.custapp.CustomMboSet',
//     service: 'CUSTAPP',
//     attributes: [...]
//   }
// ]
```

### 3. 下載 DBC 檔案

```typescript
import { downloadDbc } from '@/lib/fmb/dbc-generator';

// 在 UI 元件中使用
const handleDownload = () => {
  const result = generateDbc(fields, fmbModule, metadata, scriptMetadata);
  downloadDbc(result.content, result.suggestedFilename);
};
```

## UI 元件使用

### DbcPanel 元件

```tsx
import { DbcPanel } from '@/components/fmb/dbc-panel';

// 在 FmbConverterPage 中使用
<TabsContent value="dbc">
  <DbcPanel
    fmbModule={fmbModule}
    fields={fields}
    metadata={metadata}
  />
</TabsContent>
```

### DbcPanel Props

| Prop | 型別 | 說明 |
|------|------|------|
| fmbModule | `FmbModule \| null` | 已解析的 FMB 模組資料 |
| fields | `SAFieldDefinition[]` | 已轉換的欄位定義清單 |
| metadata | `ApplicationMetadata` | 應用程式元資料 |

## 測試範例

### 單元測試

```typescript
import { describe, it, expect } from 'vitest';
import { generateDbc, extractMboDefinitions } from '@/lib/fmb/dbc-generator';

describe('dbc-generator', () => {
  it('should generate valid DBC XML', () => {
    const result = generateDbc(mockFields, mockFmbModule, mockMetadata, {
      author: 'TestAuthor',
      scriptname: 'TEST_SCRIPT',
      description: 'Test description',
    });

    expect(result.content).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(result.content).toContain('<script author="TestAuthor"');
    expect(result.content).toContain('<define_table');
    expect(result.content).toContain('<attrdef');
  });

  it('should extract MBO definitions from FmbModule', () => {
    const mbos = extractMboDefinitions(mockFmbModule, mockFields);

    expect(mbos).toHaveLength(1);
    expect(mbos[0].object).toBe('ZZ_TEST_TABLE');
    expect(mbos[0].attributes.length).toBeGreaterThan(0);
  });
});
```

### 元件測試

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { DbcPanel } from '@/components/fmb/dbc-panel';

describe('DbcPanel', () => {
  it('should show upload prompt when no fmbModule', () => {
    render(<DbcPanel fmbModule={null} fields={[]} metadata={mockMetadata} />);

    expect(screen.getByText(/請先上傳/)).toBeInTheDocument();
  });

  it('should show DBC preview when fmbModule exists', () => {
    render(
      <DbcPanel
        fmbModule={mockFmbModule}
        fields={mockFields}
        metadata={mockMetadata}
      />
    );

    expect(screen.getByText(/DBC 預覽/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /下載/ })).toBeInTheDocument();
  });
});
```

## 常見問題

### Q: 為什麼預覽沒有顯示任何 MBO？

A: 確認 FMB XML 中的 Block 有定義 `queryDataSource` 屬性，或者已轉換的欄位清單不為空。若 XML 中沒有可識別的 MBO 結構，系統會顯示「無可轉換的 MBO 資料」訊息。

### Q: 如何修改預設的 classname 和 service？

A: 在 DbcPanel 的設定區域可以自訂這些值。預設值為：
- classname: `psdi.mbo.custapp.CustomMboSet`
- service: `CUSTAPP`

### Q: 產生的 DBC 檔案可以直接在 Maximo 執行嗎？

A: 是的，產生的 DBC 檔案遵循 Maximo script.dtd 規範，可直接透過 Maximo 的 Update Database 功能執行。

## 下一步

1. 實作 `dbc-generator.ts` 核心邏輯
2. 新增 DBC 相關型別至 `types.ts`
3. 實作 `DbcPanel` UI 元件
4. 整合至 FmbConverterPage
5. 撰寫完整測試覆蓋
