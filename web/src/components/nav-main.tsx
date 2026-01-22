'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getToolByPath, getEnabledTools } from '@/config/menu';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';

export function NavMain() {
  const pathname = usePathname();
  const enabledTools = getEnabledTools();
  const activeTool = getToolByPath(pathname);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>工具</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {enabledTools.map((tool) => {
            const isActive = activeTool?.id === tool.id;
            return (
              <SidebarMenuItem key={tool.id}>
                <SidebarMenuButton asChild tooltip={tool.description} isActive={isActive}>
                  <Link href={tool.path}>
                    <tool.icon />
                    <span>{tool.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
