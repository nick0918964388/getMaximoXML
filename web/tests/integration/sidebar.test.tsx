import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { NavMain } from '@/components/nav-main';
import { menuConfig } from '@/config/menu';
import { usePathname } from 'next/navigation';

// Mock usePathname
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/tools/xml-generator'),
}));

const mockUsePathname = vi.mocked(usePathname);

// Mock matchMedia for useIsMobile hook
beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

describe('Sidebar Navigation', () => {
  describe('AppSidebar component', () => {
    it('should render the sidebar', () => {
      render(
        <SidebarProvider>
          <AppSidebar />
        </SidebarProvider>
      );

      // Sidebar should be rendered - check for data-sidebar attribute
      expect(document.querySelector('[data-sidebar="sidebar"]')).toBeInTheDocument();
    });

    it('should display the app name', () => {
      render(
        <SidebarProvider>
          <AppSidebar />
        </SidebarProvider>
      );

      expect(screen.getByText(menuConfig.appName)).toBeInTheDocument();
    });

    it('should display the XML generator tool', () => {
      render(
        <SidebarProvider>
          <AppSidebar />
        </SidebarProvider>
      );

      const xmlTool = menuConfig.tools.find(t => t.id === 'xml-generator');
      expect(xmlTool).toBeDefined();
      expect(screen.getByText(xmlTool!.name)).toBeInTheDocument();
    });
  });

  describe('NavMain component', () => {
    it('should render all enabled tools', () => {
      render(
        <SidebarProvider>
          <NavMain />
        </SidebarProvider>
      );

      const enabledTools = menuConfig.tools.filter(t => t.enabled);
      enabledTools.forEach(tool => {
        expect(screen.getByText(tool.name)).toBeInTheDocument();
      });
    });

    it('should render tool links with correct href', () => {
      render(
        <SidebarProvider>
          <NavMain />
        </SidebarProvider>
      );

      const enabledTools = menuConfig.tools.filter(t => t.enabled);
      enabledTools.forEach(tool => {
        const link = screen.getByRole('link', { name: new RegExp(tool.name) });
        expect(link).toHaveAttribute('href', tool.path);
      });
    });
  });

  describe('Active state highlighting (US2)', () => {
    it('should mark current tool as active', () => {
      mockUsePathname.mockReturnValue('/tools/xml-generator');

      render(
        <SidebarProvider>
          <NavMain />
        </SidebarProvider>
      );

      const xmlToolLink = screen.getByRole('link', { name: /XML 產生器/ });
      expect(xmlToolLink).toHaveAttribute('data-active', 'true');
    });

    it('should not mark tool as active when on different path', () => {
      mockUsePathname.mockReturnValue('/tools/other-tool');

      render(
        <SidebarProvider>
          <NavMain />
        </SidebarProvider>
      );

      const xmlToolLink = screen.getByRole('link', { name: /XML 產生器/ });
      expect(xmlToolLink).toHaveAttribute('data-active', 'false');
    });

    it('should mark tool as active for nested paths', () => {
      mockUsePathname.mockReturnValue('/tools/xml-generator/settings');

      render(
        <SidebarProvider>
          <NavMain />
        </SidebarProvider>
      );

      const xmlToolLink = screen.getByRole('link', { name: /XML 產生器/ });
      expect(xmlToolLink).toHaveAttribute('data-active', 'true');
    });
  });

  describe('Extensible menu (US3)', () => {
    it('should only render enabled tools', () => {
      render(
        <SidebarProvider>
          <NavMain />
        </SidebarProvider>
      );

      // All rendered tools should be from the enabled list
      const enabledTools = menuConfig.tools.filter((t) => t.enabled);
      const disabledTools = menuConfig.tools.filter((t) => !t.enabled);

      // Check enabled tools are present
      enabledTools.forEach((tool) => {
        expect(screen.getByText(tool.name)).toBeInTheDocument();
      });

      // Check disabled tools are not present
      disabledTools.forEach((tool) => {
        expect(screen.queryByText(tool.name)).not.toBeInTheDocument();
      });
    });
  });
});
