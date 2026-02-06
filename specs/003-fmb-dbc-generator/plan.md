# Implementation Plan: FMB 轉 DBC 檔案產生器

**Branch**: `003-fmb-dbc-generator` | **Date**: 2026-02-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-fmb-dbc-generator/spec.md`

## Summary

實作 FMB XML 轉 DBC 檔案功能，從上傳的 Oracle Forms XML 檔案萃取 MBO 定義與屬性資訊，產生符合 Maximo script.dtd 規範的 DBC 資料庫配置腳本。採用現有的 FMB 解析管線與 SAFieldDefinition 資料結構，新增 DBC 產生器模組並整合至 FMB 轉換器頁面。

## Technical Context

**Language/Version**: TypeScript (ES2022) with Next.js 14.2.35 + React 18
**Primary Dependencies**: 現有 shadcn/ui 元件、FMB parser/converter 管線
**Storage**: N/A（純瀏覽器端生成，複用現有 XML 解析結果）
**Testing**: Vitest (web/vitest.config.ts)
**Target Platform**: 瀏覽器 (Web Application)
**Project Type**: Web application (existing Next.js monorepo)
**Performance Goals**: 預覽載入 < 2 秒（50 欄位以下的 XML）
**Constraints**: 純前端處理，無後端 API
**Scale/Scope**: 單一功能模組，整合至現有 FMB 轉換器分頁

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| TDD (Test-First) | ✅ PASS | 將為 DBC generator 撰寫完整測試 |
| Existing Patterns | ✅ PASS | 遵循現有 parser → converter → generator 模式 |
| Minimal Complexity | ✅ PASS | 複用現有資料結構，僅新增必要模組 |
| Type Safety | ✅ PASS | 定義 DBC 相關 TypeScript 介面 |

## Project Structure

### Documentation (this feature)

```text
specs/003-fmb-dbc-generator/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── contracts/           # Phase 1 output (N/A - no API)
```

### Source Code (repository root)

```text
web/src/
├── lib/
│   └── fmb/
│       ├── types.ts                    # 新增 DBC 相關型別定義
│       ├── dbc-generator.ts            # 新增 DBC 產生器模組
│       └── __tests__/
│           └── dbc-generator.test.ts   # 新增 DBC 產生器測試
├── components/
│   └── fmb/
│       ├── dbc-panel.tsx               # 新增 DBC 預覽面板元件
│       └── __tests__/
│           └── dbc-panel.test.tsx      # 新增 DBC 面板測試
└── app/
    └── tools/
        └── fmb-converter/
            └── page.tsx                # 修改：新增 DBC 分頁

web/tests/
└── unit/
    └── fmb/
        └── dbc-generator.test.ts       # DBC 產生器單元測試
```

**Structure Decision**: 遵循現有 web application 結構，在 `/web/src/lib/fmb/` 新增 DBC 相關模組，元件放置於 `/web/src/components/fmb/`。

## Complexity Tracking

> 無違規項目需要說明。

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |
