# Quickstart: Add Menu System

**Feature**: 001-add-menu-system
**Date**: 2026-01-22

## Prerequisites

- Node.js 18+
- pnpm 或 npm
- 專案已安裝依賴 (`npm install`)

## 快速開始

### 1. 安裝新增依賴

此功能需要以下 shadcn/ui 元件：

```bash
# 進入 web 目錄
cd web

# 安裝 shadcn/ui 元件（如果尚未安裝）
npx shadcn-ui@latest add sidebar sheet skeleton tooltip
```

### 2. 執行測試

```bash
# 在 web 目錄執行測試
cd web
npm test

# 執行特定測試
npm test -- menu-config
npm test -- sidebar
```

### 3. 啟動開發伺服器

```bash
cd web
npm run dev
```

開啟瀏覽器訪問 http://localhost:3000

### 4. 驗證功能

1. **側邊欄顯示**: 頁面左側應顯示側邊欄
2. **工具選單**: 側邊欄應列出「XML 產生器」
3. **當前標示**: 當前使用的工具應有高亮顯示
4. **收合功能**: 點擊收合按鈕或按 `Ctrl+B` 可收合側邊欄
5. **行動裝置**: 縮小視窗或使用開發者工具模擬行動裝置，選單應變為滑出式

## 新增工具指南

### 步驟 1: 更新選單配置

編輯 `/web/src/config/menu.ts`:

```typescript
import { FileCode, FileBarChart } from 'lucide-react';

export const menuConfig: MenuConfig = {
  appName: 'Maximo 工具箱',
  version: '1.0.0',
  tools: [
    {
      id: 'xml-generator',
      name: 'XML 產生器',
      description: '產生 Maximo 簡報 XML 和 SQL 檔案',
      icon: FileCode,
      path: '/tools/xml-generator',
      enabled: true,
    },
    // 新增工具
    {
      id: 'report-generator',
      name: '報表產生器',
      description: '產生各類 Maximo 報表',
      icon: FileBarChart,
      path: '/tools/report-generator',
      enabled: true,
    },
  ],
};
```

### 步驟 2: 建立路由頁面

建立 `/web/src/app/tools/report-generator/page.tsx`:

```typescript
export default function ReportGeneratorPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold">報表產生器</h1>
      {/* 工具內容 */}
    </div>
  );
}
```

### 步驟 3: 測試新工具

1. 重新啟動開發伺服器
2. 確認新工具出現在側邊欄
3. 點擊新工具確認導航正常
4. 確認當前工具標示正確

## 停用工具

將工具配置的 `enabled` 設為 `false`:

```typescript
{
  id: 'xml-generator',
  // ...
  enabled: false, // 不會顯示在選單中
},
```

## 檔案結構總覽

```text
web/src/
├── app/
│   ├── layout.tsx              # SidebarProvider 包裹
│   ├── page.tsx                # 重導向至 /tools/xml-generator
│   └── tools/
│       └── xml-generator/
│           └── page.tsx        # XML 產生器內容
├── components/
│   ├── ui/
│   │   ├── sidebar.tsx         # 核心側邊欄元件
│   │   ├── sheet.tsx           # 行動裝置選單
│   │   ├── skeleton.tsx        # 載入狀態
│   │   └── tooltip.tsx         # 提示框
│   ├── app-sidebar.tsx         # 應用程式側邊欄
│   └── nav-main.tsx            # 主導覽選單
├── config/
│   └── menu.ts                 # 選單配置
└── hooks/
    └── use-mobile.ts           # 行動裝置偵測
```

## 常見問題

### Q: 側邊欄沒有顯示？

確認 `layout.tsx` 中是否正確包裹 `SidebarProvider`。

### Q: 行動裝置選單無法開啟？

確認 `sheet.tsx` 元件已正確安裝，且 `use-mobile.ts` hook 已建立。

### Q: 新增工具沒有出現？

1. 確認 `enabled: true`
2. 確認路由路徑正確
3. 重新啟動開發伺服器
