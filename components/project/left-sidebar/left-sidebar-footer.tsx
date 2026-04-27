import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { CircleQuestionMark, FolderRoot } from 'lucide-react';
import { IProject } from '@/types';
import SettingsFooter from './settings/settings-footer';
import { IconTooltip } from '../icon-tooltip';

export function LeftSidebarFooter({ projectData }: { projectData: IProject }) {
  useSidebar();

  return (
    <SidebarMenu className="p-0!">
      <SidebarMenuItem className="flex p-0! flex-row items-center gap-2">
        <SidebarMenuButton className="h-fit!">
          <FolderRoot className="h-4! w-4!" />
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{projectData?.title || 'Files'}</span>
          </div>
        </SidebarMenuButton>
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
