# Research: FMB Word Export

**Feature**: 002-fmb-word-export
**Date**: 2026-02-04

## 1. Word 生成套件選擇

### Decision: 使用 `docx` npm 套件

### Rationale:
- **瀏覽器支援**: `docx` 套件完全支援瀏覽器端生成，使用 `Packer.toBlob()` 可直接生成 Blob 供下載
- **類型安全**: 完整的 TypeScript 支援，與專案技術棧一致
- **文件完善**: 超過 80 個使用範例，100% 測試覆蓋率
- **功能完整**: 支援標題層級、表格（含邊框和樣式）、段落、文字格式化
- **輕量級**: 無需額外的伺服器端處理

### Alternatives Considered:
1. **docx-templates**: 功能更豐富（模板引擎），但對於此需求過於複雜，且套件體積較大
2. **markdown-docx**: 可直接將 Markdown 轉為 Word，但缺乏對表格樣式的精細控制
3. **officegen**: 較舊的套件，TypeScript 支援不佳，維護頻率低

## 2. 瀏覽器端文件下載方式

### Decision: 使用原生 Blob + URL.createObjectURL

### Rationale:
- 現有程式碼已使用此模式下載 Markdown 檔案（見 `spec-panel.tsx` 第 30-38 行）
- 無需額外依賴（如 file-saver）
- 所有現代瀏覽器都支援

### Implementation Pattern:
```typescript
const blob = await Packer.toBlob(document);
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `${formName}_spec.docx`;
a.click();
URL.revokeObjectURL(url);
```

## 3. Word 文件樣式對應

### Decision: 建立結構化的樣式映射

將現有 Markdown 結構對應到 Word 格式：

| Markdown 元素 | Word 元素 | 樣式設定 |
|--------------|-----------|---------|
| `# H1` | Paragraph(heading: HeadingLevel.HEADING_1) | 24pt, 粗體 |
| `## H2` | Paragraph(heading: HeadingLevel.HEADING_2) | 18pt, 粗體 |
| `### H3` | Paragraph(heading: HeadingLevel.HEADING_3) | 14pt, 粗體 |
| 表格 | Table + TableRow + TableCell | 單線邊框，表頭灰底 |
| 代碼區塊 | Paragraph + TextRun(font: Consolas) | 等寬字體，淺灰背景 |
| 普通段落 | Paragraph | 12pt, 正常 |

### Table Header Styling:
- 背景色: `#E0E0E0` (淺灰)
- 文字: 粗體
- 邊框: `BorderStyle.SINGLE`, 1pt

## 4. FormSpec 到 Word 的轉換策略

### Decision: 直接轉換，不經過 Markdown

### Rationale:
- 現有 `FormSpec` 介面已包含所有結構化資料
- 直接轉換可更精確控制 Word 樣式
- 避免中間格式轉換的資訊損失

### Conversion Flow:
```
FmbModule → generateFormSpec() → FormSpec → generateWordDocument() → Document → Packer.toBlob() → Download
```

## 5. 特殊字元處理

### Decision: 依賴 docx 套件的內建處理

### Rationale:
- `docx` 套件會自動處理 XML 特殊字元的轉義
- 現有 `FormSpec` 已經過 HTML 實體解碼（`decodeHtmlEntities`）
- SQL 代碼中的 `<`, `>`, `&` 等字元會被正確處理

## 6. 錯誤處理策略

### Decision: try-catch 包裝 + 使用者友善錯誤訊息

### Implementation:
```typescript
try {
  const blob = await generateWordDocument(spec);
  downloadBlob(blob, fileName);
} catch (error) {
  // 顯示使用者友善的錯誤訊息
  toast.error('Word 文件生成失敗，請稍後再試');
  console.error('Word generation error:', error);
}
```

## 7. docx 套件版本選擇

### Decision: 使用最新穩定版 (^8.x)

### Rationale:
- 最新版本有更好的瀏覽器支援
- TypeScript 類型定義更完整
- 已經過廣泛的社群測試

## 8. 測試策略

### Decision: 單元測試 + 結構驗證

### Approach:
1. **單元測試**: 測試 `generateWordDocument` 函式返回有效的 Document 物件
2. **結構驗證**: 驗證生成的文件包含正確數量的區段、表格
3. **快照測試**: 可選，用於確保輸出一致性

### Test Cases:
- 空 FormSpec 應生成有效但最小的 Word 文件
- 完整 FormSpec 應包含所有區塊、欄位、LOV、觸發器
- 特殊字元應正確顯示
- 長 SQL 代碼應正確換行
