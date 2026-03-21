import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Blocks, Bot, Calendar, FileBox, Files, GitBranch, Terminal } from 'lucide-react';
import Link from 'next/link';
import { ImperativePanelHandle } from 'react-resizable-panels';
import { PanelLeftCloseIcon, PanelLeftOpenIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { IconTrident } from '@tabler/icons-react';
import { useProjectUIStore } from '@/features/editor/stores/project-ui';

const MiniSidebarIconItems = [
  {
    title: 'Documentation',
    href: '#',
    icon: FileBox,
  },
  {
    title: 'Repository',
    href: '#',
    icon: GitBranch,
  },
  {
    title: 'Repository',
    href: '#',
    icon: Blocks,
  },
  {
    title: 'Repository',
    href: '#',
    icon: Calendar,
  },
  {
    title: 'Repository',
    href: '#',
    icon: Files,
  },
  {
    title: 'Repository',
    href: '#',
    icon: Terminal,
  },
  {
    title: 'Bot',
    href: '#',
    icon: Bot,
  },
];
interface IProps {
  LeftSidebarRef: React.RefObject<ImperativePanelHandle | null>;
  isLeftCollapsed: boolean;
  RightSidebarRef: React.RefObject<ImperativePanelHandle | null>;
}
const MiniSidebarTemplate = ({ LeftSidebarRef, isLeftCollapsed, RightSidebarRef }: IProps) => {
  const setRightSidebarTab = useProjectUIStore(state => state.setRightSidebarTab);

  const toggleRightSidebar = () => {
    const panel = LeftSidebarRef.current;
    if (!panel) return;
    if (panel.isCollapsed()) {
      panel.expand();
    } else {
      panel.collapse();
    }
  };

  return (
    <Sidebar className="w-12 border-r p-0 " collapsible="none" variant="floating">
      <div className="flex min-h-screen flex-col text-muted-foreground rounded-l-none ">
        <SidebarHeader className="hidden p-0">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild></SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent className="ml-0 p-0">
          <SidebarGroup className="gap-0 p-0">
            <SidebarMenu className="gap-y-3">
              <div className="h-12 flex items-center justify-center w-full">
                <Button type="button" tabIndex={-1} variant={'ghost'} onClick={toggleRightSidebar} className="w-8 h-8 cursor-pointer ">
                  {isLeftCollapsed ? <PanelLeftOpenIcon className="w-7! h-7!" /> : <PanelLeftCloseIcon className="w-7! h-7!" />}
                </Button>
              </div>
              {MiniSidebarIconItems &&
                MiniSidebarIconItems.map((item, index) => {
                  /**
                   * note
                   * const { url, component } = usePage()
                   * className={url === '/users' ? 'active' : ''
                   * note if i set the active
                   * */
                  return (
                    <SidebarMenuItem className="" key={index}>
                      <Link
                        href={item.href || '#'}
                        className="flex w-full items-center justify-center hover:brightness-120 dark:hover:text-white"
                        prefetch
                      >
                        <item.icon className="h-6! w-6! stroke-[1px]" />
                      </Link>
                    </SidebarMenuItem>
                  );
                })}
              <SidebarMenuItem
                className=""
                onClick={() => {
                  const panel = RightSidebarRef?.current;
                  if (!panel) return;
                  if (panel.isCollapsed()) panel.expand();
                  requestAnimationFrame(() => {
                    setRightSidebarTab('mermaid');
                  });
                }}
              >
                <Button type="button" tabIndex={-1} variant={'ghost'} className="cursor-pointer py-1 hover:bg-transparent!">
                  <IconTrident className="w-6! h-6! rotate-45 -ml-1 mt-[4px] stroke-[1px]" />
                </Button>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="p-0">{/* <NavUser /> */}</SidebarFooter>
      </div>
    </Sidebar>
  );
};

export default MiniSidebarTemplate;
