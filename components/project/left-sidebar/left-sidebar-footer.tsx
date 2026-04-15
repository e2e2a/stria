'use client';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { ChevronsUpDown, CircleQuestionMark, DoorOpenIcon } from 'lucide-react';
import { IProject } from '@/types';
import { useRouter } from 'next/navigation';
import SettingsFooter from './settings/settings-footer';

export function LeftSidebarFooter({ projectData }: { projectData: IProject }) {
  const { isMobile } = useSidebar();
  const router = useRouter();

  return (
    <SidebarMenu>
      <SidebarMenuItem className="flex flex-row items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent h-fit! data-[state=open]:text-sidebar-accent-foreground">
              <ChevronsUpDown className="h-6! w-6!" />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{projectData?.title}</span>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
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
          <CircleQuestionMark />
          <SettingsFooter />
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
