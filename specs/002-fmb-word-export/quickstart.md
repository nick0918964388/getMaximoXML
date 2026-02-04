# Quickstart: FMB Word Export

**Feature**: 002-fmb-word-export
**Date**: 2026-02-04

## 快速開始

### 1. 安裝依賴

```bash
cd web
npm install docx
```

### 2. 建立 Word 生成器模組

建立 `web/src/lib/fmb/word-generator.ts`:

```typescript
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  HeadingLevel,
  BorderStyle,
  WidthType,
  AlignmentType,
  ShadingType,
} from 'docx';
import type { FormSpec, BlockSpec, FieldSpec, LovSpec } from './spec-generator';

export async function generateWordDocument(spec: FormSpec): Promise<Document> {
  const children: (Paragraph | Table)[] = [];

  // Title
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: `${spec.formName} 功能規格說明`, bold: true })],
    })
  );

  children.push(
    new Paragraph({
      children: [new TextRun(`程式名稱: ${spec.formTitle}`)],
    })
  );

  // Add blocks, LOVs, triggers...
  // (完整實作見 tasks.md)

  return new Document({
    sections: [{ children }],
  });
}

export async function downloadWordDocument(spec: FormSpec, fileName: string): Promise<void> {
  const doc = await generateWordDocument(spec);
  const blob = await Packer.toBlob(doc);

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}
```

### 3. 更新 SpecPanel 元件

在 `web/src/components/fmb/spec-panel.tsx` 中加入下載按鈕:

```typescript
import { downloadWordDocument } from '@/lib/fmb/word-generator';

// 在按鈕區域加入
<Button variant="outline" size="sm" onClick={handleDownloadWord}>
  <FileText className="h-4 w-4 mr-1" />
  下載 Word
</Button>
```

### 4. 執行測試

```bash
cd web
npm test -- word-generator
```

## 使用範例

### 基本使用

```typescript
import { generateFormSpec } from '@/lib/fmb/spec-generator';
import { downloadWordDocument } from '@/lib/fmb/word-generator';

// 從 FMB 模組生成規格
const spec = generateFormSpec(fmbModule);

// 下載 Word 文件
await downloadWordDocument(spec, spec.formName);
```

### 錯誤處理

```typescript
try {
  await downloadWordDocument(spec, spec.formName);
} catch (error) {
  console.error('下載失敗:', error);
  // 顯示錯誤訊息給使用者
}
```

## 驗證

1. 上傳 FMB XML 檔案
2. 切換到「規格文檔」標籤
3. 點擊「下載 Word」按鈕
4. 用 Microsoft Word 或 LibreOffice 開啟下載的檔案
5. 確認內容與網頁預覽一致
