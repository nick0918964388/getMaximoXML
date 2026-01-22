# Contracts: Add Menu System

**Feature**: 001-add-menu-system
**Date**: 2026-01-22

## API Changes

此功能**不涉及 API 變更**。選單系統為純前端 UI 功能，不需要新增或修改後端 API。

## Route Changes

### 新增路由

| Route | Method | Description |
|-------|--------|-------------|
| `/tools/xml-generator` | GET | XML 產生器頁面（移自 `/`） |

### 重導向

| From | To | Status |
|------|-----|--------|
| `/` | `/tools/xml-generator` | 307 Temporary Redirect |

## Component Contracts

### AppSidebar Props

```typescript
interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  // 繼承 Sidebar 所有 props
}
```

### NavMain Props

```typescript
interface NavMainProps {
  tools: ToolConfig[];
}
```

## Events

### Sidebar Events

| Event | Trigger | Effect |
|-------|---------|--------|
| Toggle Sidebar | Click trigger / Ctrl+B | 展開或收合側邊欄 |
| Select Tool | Click menu item | 導航至工具頁面 |
| Mobile Open | Click trigger (mobile) | 開啟 Sheet 選單 |
| Mobile Close | Click overlay / Select item | 關閉 Sheet 選單 |
