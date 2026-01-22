# Implementation Plan: Add Menu System

**Branch**: `001-add-menu-system` | **Date**: 2026-01-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-add-menu-system/spec.md`

## Summary

實作一個可擴展的選單系統，讓使用者能夠在不同工具之間切換。目前僅有「Maximo XML 產生器」作為第一個工具，但架構支援未來新增更多工具。採用 shadcn/ui 的 Sidebar 元件實作左側導覽選單，整合 Next.js App Router 進行頁面路由。

## Technical Context

**Language/Version**: TypeScript (ES2022) with Next.js 14.2.35
**Primary Dependencies**: React 18, shadcn/ui (Radix UI + Tailwind CSS), Lucide React
**Storage**: SQLite via sql.js (WASM), Browser localStorage
**Testing**: Vitest 1.6.0, @testing-library/react, @testing-library/user-event
**Target Platform**: Web (Browser), Node.js backend
**Project Type**: Web application (Next.js full-stack)
**Performance Goals**: 選單載入和展開的回應時間使用者感知為即時（<100ms）
**Constraints**: 響應式設計，支援桌面和行動裝置
**Scale/Scope**: 初始 1 個工具，架構支援未來擴展至多個工具

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Design Check ✅

| Principle | Status | Notes |
|-----------|--------|-------|
| TDD (Test-First) | ✅ PASS | 將為選單配置、選單元件、路由整合撰寫測試 |
| Library-First | ✅ PASS | 選單配置為獨立模組，可單獨測試 |
| Simplicity (YAGNI) | ✅ PASS | 僅實作規格需求，不過度設計 |

### Post-Design Check ✅

| Principle | Status | Notes |
|-----------|--------|-------|
| TDD (Test-First) | ✅ PASS | 測試計畫：menu-config.test.ts (單元), sidebar.test.tsx (整合) |
| Library-First | ✅ PASS | `/config/menu.ts` 為獨立模組，不依賴 UI 元件 |
| Simplicity (YAGNI) | ✅ PASS | 使用現有 shadcn/ui 元件，無自訂複雜邏輯 |
| 無障礙 | ✅ PASS | shadcn/ui Sidebar 內建 ARIA 標籤和鍵盤導覽 |
| 響應式 | ✅ PASS | Sidebar + Sheet 組合處理桌面/行動裝置 |

## Project Structure

### Documentation (this feature)

```text
specs/001-add-menu-system/
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
│   ├── app/
│   │   ├── layout.tsx              # 修改：加入 SidebarProvider
│   │   ├── page.tsx                # 修改：移至 tools/xml-generator
│   │   └── tools/
│   │       └── xml-generator/
│   │           └── page.tsx        # 新增：XML 產生器頁面
│   ├── components/
│   │   ├── ui/
│   │   │   ├── sidebar.tsx         # 新增：shadcn/ui sidebar 元件
│   │   │   ├── sheet.tsx           # 新增：行動裝置選單支援
│   │   │   ├── skeleton.tsx        # 新增：sidebar 依賴
│   │   │   └── tooltip.tsx         # 新增：sidebar 依賴
│   │   ├── app-sidebar.tsx         # 新增：應用程式側邊欄
│   │   └── nav-main.tsx            # 新增：主導覽選單
│   ├── config/
│   │   └── menu.ts                 # 新增：選單配置
│   ├── hooks/
│   │   └── use-mobile.ts           # 新增：行動裝置偵測
│   └── lib/
│       └── utils.ts                # 已存在：cn 函式
│
└── tests/
    ├── unit/
    │   └── menu-config.test.ts     # 新增：選單配置測試
    └── integration/
        └── sidebar.test.tsx        # 新增：側邊欄整合測試
```

**Structure Decision**: 採用 Next.js App Router 的檔案系統路由，將現有 XML 產生器移至 `/tools/xml-generator` 路徑，為未來新增工具預留空間。選單配置獨立於 `/config/menu.ts`，便於維護和擴展。

## Complexity Tracking

> 無違反項目，不需要複雜度追蹤。
