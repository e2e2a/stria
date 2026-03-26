import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarMenu, SidebarMenuItem } from '@/components/ui/sidebar';
import { MoreVertical, Network, Square } from 'lucide-react';
import { ImperativePanelHandle } from 'react-resizable-panels';
import { PanelLeftCloseIcon, PanelLeftOpenIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { IconTrident } from '@tabler/icons-react';
import { useProjectUIStore } from '@/features/editor/stores/project-ui';
import { useTabStore } from '@/features/editor/stores/tabs';
import { useParams } from 'next/navigation';
import { IconTooltip } from './icon-tooltip';
import { flattenNodeTree } from '@/utils/client/node-utils';
import { useDeferredValue, useMemo, useRef } from 'react';
import { useNodeStore } from '@/features/editor/stores/nodes';

export const CustomDotsIcon = ({ className }: { className?: string }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <Square className="w-7! h-7! stroke-[0.5]" />

      <MoreVertical className="absolute w-6! h-6! -rotate-45 stroke-1" />
    </div>
  );
};

interface IProps {
  LeftSidebarRef: React.RefObject<ImperativePanelHandle | null>;
  isLeftCollapsed: boolean;
  RightSidebarRef: React.RefObject<ImperativePanelHandle | null>;
}
const MiniSidebarTemplate = ({ LeftSidebarRef, isLeftCollapsed, RightSidebarRef }: IProps) => {
  const params = useParams();
  const pid = params.pid as string;
  const nodes = useNodeStore(state => state.nodes);
  const setActiveNode = useNodeStore(state => state.setActiveNode);
  const openTab = useTabStore(state => state.openTab);
  const setRightSidebarTab = useProjectUIStore(state => state.setRightSidebarTab);
  const deferredNodes = useDeferredValue(nodes);
  const flatNodes = useMemo(() => flattenNodeTree(deferredNodes), [deferredNodes]);

  const toggleRightSidebar = () => {
    const panel = LeftSidebarRef.current;
    if (!panel) return;
    if (panel.isCollapsed()) {
      panel.expand();
    } else {
      panel.collapse();
    }
  };
  const isLocked = useRef(false);

  const openRandomNode = (e: React.MouseEvent) => {
    // 1. Stop the click from traveling to other elements
    e.preventDefault();
    e.stopPropagation();

    // 2. The Gate: If locked, stop everything immediately
    if (isLocked.current || !flatNodes?.length) return;

    // 3. Lock the door NOW
    isLocked.current = true;

    // 4. Run the logic (Only happens once per second)
    const randomIndex = Math.floor(Math.random() * flatNodes.length);
    const randomNode = flatNodes[randomIndex];

    openTab(randomNode.projectId, randomNode, true);
    setActiveNode(randomNode._id);

    // 5. Wait 1 second before allowing another click
    setTimeout(() => {
      isLocked.current = false;
    }, 2500);
  };

  return (
    <Sidebar className="w-12 border-r p-0 " collapsible="none" variant="floating">
      <div className="flex min-h-screen flex-col text-muted-foreground rounded-l-none ">
        <SidebarContent className="ml-0 p-0 overflow-x-hidden bg-background/50">
          <SidebarGroup className="gap-0 p-0">
            <SidebarMenu className="gap-y-3">
              <IconTooltip label={'Collapse'} side="right">
                <div className="h-12 flex items-center justify-center w-12">
                  <Button type="button" tabIndex={-1} variant={'ghost'} onClick={toggleRightSidebar} className="w-8 h-8 cursor-pointer ">
                    {isLeftCollapsed ? <PanelLeftOpenIcon className="w-7! h-7!" /> : <PanelLeftCloseIcon className="w-7! h-7!" />}
                  </Button>
                </div>
              </IconTooltip>
              <SidebarMenuItem onClick={() => openTab(pid, 'Graph View', false, 0)}>
                <IconTooltip label={'Open graph view'} side="right">
                  <Button type="button" tabIndex={-1} variant={'ghost'} className="cursor-pointer py-1 hover:bg-transparent!">
                    <Network className="w-6! h-6! stroke-[1px]" />
                  </Button>
                </IconTooltip>
              </SidebarMenuItem>

              <SidebarMenuItem onClick={openRandomNode}>
                <IconTooltip label={'Open random note'} side="right">
                  <Button type="button" tabIndex={-1} variant={'ghost'} className="cursor-pointer px-3 py-1 hover:bg-transparent!">
                    <CustomDotsIcon className="w-6! h-6!" />
                  </Button>
                </IconTooltip>
              </SidebarMenuItem>

              <SidebarMenuItem
                onClick={() => {
                  const panel = RightSidebarRef?.current;
                  if (!panel) return;
                  if (panel.isCollapsed()) panel.expand();
                  requestAnimationFrame(() => {
                    setRightSidebarTab('mermaid');
                  });
                }}
              >
                <IconTooltip label={'Mermaid'} side="right">
                  <Button type="button" tabIndex={-1} variant={'ghost'} className="cursor-pointer py-1 hover:bg-transparent!">
                    <IconTrident className="w-6! h-6! rotate-45 -ml-1 mt-[4px] stroke-[1px]" />
                  </Button>
                </IconTooltip>
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
