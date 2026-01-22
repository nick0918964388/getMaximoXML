import { describe, it, expect } from 'vitest';
import { menuConfig, ToolConfig, MenuConfig, getToolByPath, getEnabledTools, getToolById } from '@/config/menu';

describe('Menu Configuration', () => {
  describe('menuConfig exports', () => {
    it('should export a valid MenuConfig object', () => {
      expect(menuConfig).toBeDefined();
      expect(menuConfig.appName).toBeDefined();
      expect(menuConfig.version).toBeDefined();
      expect(menuConfig.tools).toBeDefined();
      expect(Array.isArray(menuConfig.tools)).toBe(true);
    });

    it('should have a non-empty appName', () => {
      expect(menuConfig.appName.length).toBeGreaterThan(0);
    });

    it('should have a valid version string', () => {
      expect(menuConfig.version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should have at least one tool configured', () => {
      expect(menuConfig.tools.length).toBeGreaterThan(0);
    });
  });

  describe('ToolConfig structure', () => {
    it('should have all required fields for each tool', () => {
      menuConfig.tools.forEach((tool: ToolConfig) => {
        expect(tool.id).toBeDefined();
        expect(typeof tool.id).toBe('string');

        expect(tool.name).toBeDefined();
        expect(typeof tool.name).toBe('string');

        expect(tool.description).toBeDefined();
        expect(typeof tool.description).toBe('string');

        expect(tool.icon).toBeDefined();
        // LucideIcon can be a ForwardRef object or function component
        expect(['function', 'object'].includes(typeof tool.icon)).toBe(true);

        expect(tool.path).toBeDefined();
        expect(typeof tool.path).toBe('string');

        expect(tool.enabled).toBeDefined();
        expect(typeof tool.enabled).toBe('boolean');
      });
    });

    it('should have paths starting with /tools/', () => {
      menuConfig.tools.forEach((tool: ToolConfig) => {
        expect(tool.path).toMatch(/^\/tools\//);
      });
    });

    it('should have unique tool ids', () => {
      const ids = menuConfig.tools.map(tool => tool.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have unique tool paths', () => {
      const paths = menuConfig.tools.map(tool => tool.path);
      const uniquePaths = new Set(paths);
      expect(uniquePaths.size).toBe(paths.length);
    });
  });

  describe('XML Generator tool', () => {
    it('should include the XML generator tool', () => {
      const xmlTool = menuConfig.tools.find(tool => tool.id === 'xml-generator');
      expect(xmlTool).toBeDefined();
    });

    it('should have XML generator enabled', () => {
      const xmlTool = menuConfig.tools.find(tool => tool.id === 'xml-generator');
      expect(xmlTool?.enabled).toBe(true);
    });

    it('should have XML generator path as /tools/xml-generator', () => {
      const xmlTool = menuConfig.tools.find(tool => tool.id === 'xml-generator');
      expect(xmlTool?.path).toBe('/tools/xml-generator');
    });
  });

  describe('getToolByPath helper (US2)', () => {
    it('should find tool by exact path', () => {
      const tool = getToolByPath('/tools/xml-generator');
      expect(tool).toBeDefined();
      expect(tool?.id).toBe('xml-generator');
    });

    it('should find tool by nested path', () => {
      const tool = getToolByPath('/tools/xml-generator/settings');
      expect(tool).toBeDefined();
      expect(tool?.id).toBe('xml-generator');
    });

    it('should return undefined for non-existent path', () => {
      const tool = getToolByPath('/tools/non-existent');
      expect(tool).toBeUndefined();
    });

    it('should return undefined for root path', () => {
      const tool = getToolByPath('/');
      expect(tool).toBeUndefined();
    });

    it('should not match partial tool names', () => {
      // Should not match '/tools/xml' when the actual path is '/tools/xml-generator'
      const tool = getToolByPath('/tools/xml');
      expect(tool).toBeUndefined();
    });
  });

  describe('getEnabledTools helper (US3)', () => {
    it('should return only enabled tools', () => {
      const enabledTools = getEnabledTools();
      expect(enabledTools.length).toBeGreaterThan(0);
      enabledTools.forEach((tool) => {
        expect(tool.enabled).toBe(true);
      });
    });

    it('should not include disabled tools', () => {
      const enabledTools = getEnabledTools();
      const disabledTool = menuConfig.tools.find((t) => !t.enabled);
      if (disabledTool) {
        expect(enabledTools.find((t) => t.id === disabledTool.id)).toBeUndefined();
      }
    });
  });

  describe('getToolById helper (US3)', () => {
    it('should find tool by id', () => {
      const tool = getToolById('xml-generator');
      expect(tool).toBeDefined();
      expect(tool?.id).toBe('xml-generator');
      expect(tool?.name).toBe('XML 產生器');
    });

    it('should return undefined for non-existent id', () => {
      const tool = getToolById('non-existent');
      expect(tool).toBeUndefined();
    });

    it('should return undefined for empty id', () => {
      const tool = getToolById('');
      expect(tool).toBeUndefined();
    });
  });
});
