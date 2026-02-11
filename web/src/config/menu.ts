import { LucideIcon, FileCode, FileSearch, Database, Server, Download } from 'lucide-react';

/**
 * Tool configuration interface
 * Defines properties for each tool in the menu
 */
export interface ToolConfig {
  /** Unique identifier */
  id: string;

  /** Display name */
  name: string;

  /** Tool description */
  description: string;

  /** Lucide icon component */
  icon: LucideIcon;

  /** Navigation path */
  path: string;

  /** Whether the tool is enabled */
  enabled: boolean;
}

/**
 * Menu configuration interface
 */
export interface MenuConfig {
  /** Application name */
  appName: string;

  /** Application version */
  version: string;

  /** Tool list */
  tools: ToolConfig[];
}

/**
 * Application menu configuration
 */
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
    {
      id: 'fmb-converter',
      name: 'FMB 轉換器',
      description: '解析 Oracle Forms XML 並轉換為 Maximo XML',
      icon: FileSearch,
      path: '/tools/fmb-converter',
      enabled: true,
    },
    {
      id: 'dbc-builder',
      name: 'DBC 建構器',
      description: '互動式建構 Maximo DBC 資料庫配置腳本',
      icon: Database,
      path: '/tools/dbc-builder',
      enabled: true,
    },
    {
      id: 'mas-management',
      name: 'MAS 管理',
      description: '監控與管理 MAS 環境的 Pod 和部署',
      icon: Server,
      path: '/tools/mas-management',
      enabled: true,
    },
    {
      id: 'metadata-extractor',
      name: 'Metadata 擷取器',
      description: '從 MAS 擷取物件定義並轉換為 DBC',
      icon: Download,
      path: '/tools/metadata-extractor',
      enabled: true,
    },
  ],
};

/**
 * Get tool configuration by path
 * Matches exact path or nested paths (e.g., /tools/xml-generator/settings)
 */
export function getToolByPath(path: string): ToolConfig | undefined {
  return menuConfig.tools.find(
    (tool) => path === tool.path || path.startsWith(tool.path + '/')
  );
}

/**
 * Get all enabled tools
 */
export function getEnabledTools(): ToolConfig[] {
  return menuConfig.tools.filter((tool) => tool.enabled);
}

/**
 * Get tool configuration by ID
 */
export function getToolById(id: string): ToolConfig | undefined {
  return menuConfig.tools.find((tool) => tool.id === id);
}
