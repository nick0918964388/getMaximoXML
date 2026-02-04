# Contracts: FMB Word Export

**Feature**: 002-fmb-word-export
**Date**: 2026-02-04

## 概述

本功能為純前端功能，不涉及 API 端點變更。以下記錄模組間的介面契約。

## 模組介面

### word-generator.ts

```typescript
/**
 * 從 FormSpec 生成 Word Document 物件
 * @param spec - FMB 規格資料
 * @param options - 可選的生成配置
 * @returns docx Document 物件
 */
export function generateWordDocument(
  spec: FormSpec,
  options?: WordDocumentOptions
): Document;

/**
 * 生成 Word 文件並下載
 * @param spec - FMB 規格資料
 * @param fileName - 下載檔案名稱 (不含副檔名)
 * @returns Promise<void>
 */
export async function downloadWordDocument(
  spec: FormSpec,
  fileName: string
): Promise<void>;
```

## 依賴關係

```
spec-panel.tsx
    ├── word-generator.ts (新增)
    │   ├── docx (npm 套件)
    │   └── spec-generator.ts (現有 - FormSpec 類型)
    └── spec-generator.ts (現有)
```

## 錯誤處理

### 可能的錯誤情況

| 錯誤類型 | 原因 | 處理方式 |
|---------|------|---------|
| `WordGenerationError` | docx 套件生成失敗 | 顯示錯誤訊息，記錄詳細錯誤 |
| `BlobDownloadError` | 瀏覽器不支援下載 | 提示使用者更新瀏覽器 |

### 錯誤回傳格式

```typescript
class WordGenerationError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'WordGenerationError';
  }
}
```
