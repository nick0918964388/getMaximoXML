# Implementation Plan: FMB Word Export

**Branch**: `002-fmb-word-export` | **Date**: 2026-02-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-fmb-word-export/spec.md`

## Summary

實作 FMB 規格文檔的 Word (.docx) 匯出功能。使用 `docx` npm 套件在瀏覽器端生成 Word 文件，保持與現有 Markdown 輸出相同的內容結構（標題、表格、代碼區塊）。新增「下載 Word」按鈕到現有的 SpecPanel 元件中。

## Technical Context

**Language/Version**: TypeScript (ES2022) with Next.js 14.2.35
**Primary Dependencies**: React 18, docx (新增), 現有 shadcn/ui 元件
**Storage**: N/A (純瀏覽器端生成)
**Testing**: Vitest 1.6.0, @testing-library/react
**Target Platform**: Web (Browser) - 瀏覽器端生成和下載
**Project Type**: Web application (Next.js full-stack)
**Performance Goals**: Word 生成和下載在 3 秒內完成
**Constraints**: 純 client-side 生成，無伺服器端處理
**Scale/Scope**: 單一功能擴展，不影響現有架構

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Design Check ✅

| Principle | Status | Notes |
|-----------|--------|-------|
| TDD (Test-First) | ✅ PASS | 將為 Word 生成器撰寫單元測試 |
| Library-First | ✅ PASS | Word 生成邏輯為獨立模組 `/lib/fmb/word-generator.ts` |
| Simplicity (YAGNI) | ✅ PASS | 僅實作規格需求，使用成熟的 docx 套件 |

### Post-Design Check ✅

| Principle | Status | Notes |
|-----------|--------|-------|
| TDD (Test-First) | ✅ PASS | 測試計畫：word-generator.test.ts (單元) |
| Library-First | ✅ PASS | `/lib/fmb/word-generator.ts` 為獨立模組，不依賴 UI |
| Simplicity (YAGNI) | ✅ PASS | 使用現有 FormSpec 介面，僅新增 Word 輸出層 |
| 相容性 | ✅ PASS | docx 套件支援所有主流瀏覽器和辦公軟體 |

## Project Structure

### Documentation (this feature)

```text
specs/002-fmb-word-export/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A - no API changes)
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
web/
├── src/
│   ├── lib/
│   │   └── fmb/
│   │       ├── word-generator.ts         # 新增：Word 文件生成器
│   │       └── word-generator.test.ts    # 新增：Word 生成器測試
│   └── components/
│       └── fmb/
│           └── spec-panel.tsx            # 修改：加入「下載 Word」按鈕
└── package.json                          # 修改：加入 docx 依賴
```

**Structure Decision**: 採用與現有 `spec-generator.ts` 相同的模組化結構，新增 `word-generator.ts` 作為獨立的 Word 生成模組。此模組接收 `FormSpec` 物件並輸出 Word 文件，與現有的 `generateMarkdownSpec()` 函式平行。

## Complexity Tracking

> 無違反項目，不需要複雜度追蹤。
