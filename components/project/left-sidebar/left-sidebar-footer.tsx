'use client';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { ChevronsUpDown, CircleQuestionMark, DoorOpenIcon } from 'lucide-react';
import { IProject } from '@/types';
import { useRouter } from 'next/navigation';
import SettingsFooter from './settings/settings-footer';
import { IconTooltip } from '../icon-tooltip';

export function LeftSidebarFooter({ projectData }: { projectData: IProject }) {
  const { isMobile } = useSidebar();
  const router = useRouter();

  return (
    <SidebarMenu className="p-0!">
      <SidebarMenuItem className="flex p-0! flex-row items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent h-fit! data-[state=open]:text-sidebar-accent-foreground">
              <ChevronsUpDown className="h-4! w-4!" />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{projectData?.title}</span>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg app-font-interface"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => router.push(`/workspaces/${projectData.workspaceId}/projects`)}>
                <DoorOpenIcon />
                Manage projects
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex flex-row gap-x-2">
          <IconTooltip label="Support" className="hover:bg-accent p-1">
            <CircleQuestionMark className="w-5! h-5!" />
          </IconTooltip>
          <SettingsFooter />
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
