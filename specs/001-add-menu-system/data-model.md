# Data Model: Add Menu System

**Feature**: 001-add-menu-system
**Date**: 2026-01-22

## Entities

### ToolConfig

代表選單中的一個工具項目。

```typescript
// /web/src/config/menu.ts

import { LucideIcon } from 'lucide-react';

/**
 * 工具配置介面
 * 定義選單中每個工具的屬性
 */
export interface ToolConfig {
  /** 唯一識別碼 */
  id: string;

  /** 顯示名稱 */
  name: string;

  /** 工具描述 */
  description: string;

  /** Lucide 圖示元件 */
  icon: LucideIcon;

  /** 導航路徑 */
  path: string;

  /** 是否啟用 */
  enabled: boolean;
}
```

**Fields**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | 唯一識別碼，用於內部識別 |
| name | string | Yes | 選單顯示名稱 |
| description | string | Yes | 工具簡短描述 |
| icon | LucideIcon | Yes | 選單圖示 |
| path | string | Yes | Next.js 路由路徑 |
| enabled | boolean | Yes | 啟用/停用狀態 |

**Validation Rules**:
- `id`: 非空字串，僅允許小寫字母、數字、連字號
- `name`: 非空字串，最大長度 50 字元
- `description`: 非空字串，最大長度 200 字元
- `path`: 必須以 `/tools/` 開頭
- `enabled`: 布林值

### MenuConfig

選單配置的根物件。

```typescript
/**
 * 選單配置
 */
export interface MenuConfig {
  /** 應用程式名稱 */
  appName: string;

  /** 應用程式版本 */
  version: string;

  /** 工具列表 */
  tools: ToolConfig[];
}
```

**Fields**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| appName | string | Yes | 側邊欄標題 |
| version | string | Yes | 版本號顯示 |
| tools | ToolConfig[] | Yes | 工具配置陣列 |

## Default Configuration

```typescript
// /web/src/config/menu.ts

import { FileCode } from 'lucide-react';

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
  ],
};
```

## Helper Functions

```typescript
/**
 * 取得所有啟用的工具
 */
export function getEnabledTools(): ToolConfig[] {
  return menuConfig.tools.filter(tool => tool.enabled);
}

/**
 * 根據路徑取得工具配置
 */
export function getToolByPath(path: string): ToolConfig | undefined {
  return menuConfig.tools.find(tool =>
    path === tool.path || path.startsWith(tool.path + '/')
  );
}

/**
 * 根據 ID 取得工具配置
 */
export function getToolById(id: string): ToolConfig | undefined {
  return menuConfig.tools.find(tool => tool.id === id);
}
```

## State Transitions

此功能不涉及複雜的狀態轉換。側邊欄的展開/收合狀態由 shadcn/ui SidebarProvider 內部管理。

**Sidebar States**:
- `expanded`: 側邊欄完全展開，顯示圖示和文字
- `collapsed`: 側邊欄收合，僅顯示圖示

**Mobile States**:
- `open`: 行動裝置上 Sheet 開啟
- `closed`: 行動裝置上 Sheet 關閉

## Relationships

```
MenuConfig
    │
    └── tools[] ─────────────────► ToolConfig
                                       │
                                       ├── id
                                       ├── name
                                       ├── description
                                       ├── icon ──────► LucideIcon
                                       ├── path ──────► Next.js Route
                                       └── enabled
```

## Extensibility

新增工具只需在 `menuConfig.tools` 陣列中加入新項目：

```typescript
// 範例：新增「報表工具」
{
  id: 'report-generator',
  name: '報表產生器',
  description: '產生各類 Maximo 報表',
  icon: FileBarChart,
  path: '/tools/report-generator',
  enabled: true,
},
```

並建立對應的路由檔案：
```text
app/tools/report-generator/page.tsx
```
