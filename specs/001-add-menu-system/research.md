# Research: Add Menu System

**Feature**: 001-add-menu-system
**Date**: 2026-01-22

## Research Tasks

### 1. shadcn/ui Sidebar Integration with Next.js App Router

**Question**: 如何將 shadcn/ui Sidebar 元件整合至現有 Next.js 14 專案？

**Decision**: 使用 shadcn/ui v4 的 Sidebar 元件，搭配 SidebarProvider 包裹整個應用程式

**Rationale**:
- shadcn/ui 已是專案現有的 UI 元件庫，保持一致性
- Sidebar 元件提供完整的響應式支援（桌面/行動裝置）
- 內建 Sheet 元件用於行動裝置的滑出選單
- 支援鍵盤快捷鍵（Ctrl+B 切換側邊欄）
- 提供 cookie 持久化側邊欄狀態

**Alternatives considered**:
1. **自訂側邊欄元件**: 需要更多開發時間，可能缺少無障礙支援
2. **Navigation Menu 元件**: 適合頂部導覽，不適合側邊欄佈局
3. **Drawer/Sheet 元件**: 適合行動裝置，但桌面體驗不佳

**Implementation Notes**:
```typescript
// layout.tsx 結構
<SidebarProvider>
  <AppSidebar />
  <SidebarInset>
    <header>...</header>
    <main>{children}</main>
  </SidebarInset>
</SidebarProvider>
```

### 2. Next.js App Router 路由策略

**Question**: 如何組織路由結構以支援多工具擴展？

**Decision**: 採用 `/tools/[tool-name]` 的路由結構

**Rationale**:
- 清晰的 URL 結構：`/tools/xml-generator`
- 便於未來新增工具：`/tools/new-tool`
- 根路徑 `/` 重導向至預設工具或顯示工具列表
- 符合 Next.js App Router 的檔案系統路由慣例

**Alternatives considered**:
1. **根層級路由** (`/xml-generator`): URL 簡潔但命名空間可能衝突
2. **群組路由** (`/(tools)/xml-generator`): 不在 URL 中顯示，較不直觀
3. **動態路由** (`/[tool]`): 需要額外驗證工具名稱

**Implementation Notes**:
```text
app/
├── page.tsx                    # 重導向至 /tools/xml-generator
└── tools/
    └── xml-generator/
        └── page.tsx            # XML 產生器
```

### 3. 選單配置設計模式

**Question**: 如何設計可擴展的選單配置？

**Decision**: 使用 TypeScript 靜態配置物件，定義於 `/config/menu.ts`

**Rationale**:
- 類型安全：TypeScript 介面定義工具項目結構
- 編譯時檢查：新增工具時自動檢查必要欄位
- 簡單直觀：不需要資料庫或外部配置檔
- 便於測試：純函式和靜態資料

**Alternatives considered**:
1. **JSON 配置檔**: 缺少類型安全，需要執行時驗證
2. **資料庫配置**: 過度設計，增加複雜度
3. **環境變數**: 不適合結構化配置

**Implementation Notes**:
```typescript
// config/menu.ts
export interface ToolConfig {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  path: string;
  enabled: boolean;
}

export const tools: ToolConfig[] = [
  {
    id: 'xml-generator',
    name: 'XML 產生器',
    description: '產生 Maximo 簡報 XML 和 SQL',
    icon: FileCode,
    path: '/tools/xml-generator',
    enabled: true,
  },
];

export function getEnabledTools(): ToolConfig[] {
  return tools.filter(tool => tool.enabled);
}
```

### 4. 行動裝置響應式設計

**Question**: 如何處理行動裝置上的選單互動？

**Decision**: 使用 shadcn/ui Sidebar 內建的 Sheet 元件進行行動裝置支援

**Rationale**:
- Sidebar 元件已內建行動裝置偵測和 Sheet 整合
- 使用 `useIsMobile` hook 判斷裝置類型
- 行動裝置：從左側滑出的 Sheet
- 桌面裝置：固定或可收合的側邊欄

**Alternatives considered**:
1. **自訂響應式邏輯**: 需要額外開發和測試
2. **僅使用 CSS 媒體查詢**: 功能限制，無法處理觸控事件
3. **漢堡選單下拉**: 較不符合現代 UI 慣例

**Implementation Notes**:
```typescript
// hooks/use-mobile.ts
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)');
    const onChange = () => setIsMobile(mql.matches);
    mql.addEventListener('change', onChange);
    setIsMobile(mql.matches);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isMobile;
}
```

### 5. 當前工具標示邏輯

**Question**: 如何在選單中標示當前使用的工具？

**Decision**: 使用 Next.js 的 `usePathname` hook 比對當前路徑

**Rationale**:
- Next.js 內建，無需額外依賴
- 即時反應路由變化
- SidebarMenuButton 的 `isActive` prop 提供視覺標示

**Alternatives considered**:
1. **React Context**: 增加狀態管理複雜度
2. **URL 參數**: 不必要的 URL 複雜化
3. **localStorage**: 可能與實際路徑不同步

**Implementation Notes**:
```typescript
// nav-main.tsx
const pathname = usePathname();
const isActive = pathname === tool.path || pathname.startsWith(tool.path + '/');
```

### 6. shadcn/ui 元件依賴

**Question**: 實作 Sidebar 需要哪些額外的 shadcn/ui 元件？

**Decision**: 新增以下元件：sidebar, sheet, skeleton, tooltip

**Rationale**:
- `sidebar.tsx`: 核心側邊欄元件
- `sheet.tsx`: 行動裝置滑出選單（sidebar 依賴）
- `skeleton.tsx`: 載入狀態顯示（sidebar 可選依賴）
- `tooltip.tsx`: 收合狀態時顯示工具提示（sidebar 依賴）

**Existing components** (已存在):
- `button.tsx` ✅
- `separator.tsx` ✅
- `input.tsx` ✅

## Summary

| Topic | Decision | Key Benefit |
|-------|----------|-------------|
| UI 元件 | shadcn/ui Sidebar | 一致性、響應式、無障礙 |
| 路由結構 | `/tools/[tool-name]` | 清晰、可擴展 |
| 選單配置 | TypeScript 靜態配置 | 類型安全、簡單 |
| 響應式 | 內建 Sheet 整合 | 減少開發時間 |
| 當前標示 | usePathname hook | 即時、可靠 |
| 依賴元件 | +4 個 shadcn/ui 元件 | 完整功能支援 |
