import { ReactNode } from 'react';
import { MinusCircle, ArrowRightToLine, X, BookOpen, CodeXml, Layers } from 'lucide-react';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from '@/components/ui/context-menu';
import { Tab, useTabStore } from '@/features/editor/stores/tabs';
import { tabActions } from '@/features/editor/stores/tabActions';

const TabHeaderContextMenu = ({ children, tab, pid }: { children: ReactNode; tab: Tab; pid: string }) => {
  const dispatchRemote = (action: 'toggle-chunk' | 'toggle-read-only' | 'toggle-source') => {
    window.dispatchEvent(
      new CustomEvent('editor:remote-action', {
        detail: { nodeId: tab.nodeId, action },
      })
    );
  };

  if (tab.nodeId === 'graph-view') return children;

  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>

      <ContextMenuContent className="w-52 z-101">
        {/* Editor Controls */}
        <ContextMenuItem onSelect={() => dispatchRemote('toggle-read-only')}>
          <BookOpen className="mr-2 h-4 w-4 opacity-70" />
          <span>Toggle Reading View</span>
        </ContextMenuItem>

        <ContextMenuItem onSelect={() => dispatchRemote('toggle-source')}>
          <CodeXml className="mr-2 h-4 w-4 opacity-70" />
          <span>Toggle Source Mode</span>
        </ContextMenuItem>

        <ContextMenuItem onSelect={() => dispatchRemote('toggle-chunk')}>
          <Layers className="mr-2 h-4 w-4 opacity-70" />
          <span>Toggle Chunk Mode</span>
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem onSelect={() => tabActions.closeTab(pid, tab.nodeId)}>
          <X className="mr-2 h-4 w-4 opacity-70" />
          <span>Close Tab</span>
        </ContextMenuItem>

        <ContextMenuItem
          onSelect={() => {
            useTabStore.setState(state => ({
              projectTabs: { ...state.projectTabs, [pid]: [tab] },
            }));
          }}
        >
          <MinusCircle className="mr-2 h-4 w-4 opacity-70" />
          <span>Close Others</span>
        </ContextMenuItem>

        <ContextMenuItem
          onSelect={() => {
            const projectTabs = useTabStore.getState().projectTabs[pid] || [];
            const index = projectTabs.findIndex(t => t.nodeId === tab.nodeId);
            useTabStore.setState(state => ({
              projectTabs: { ...state.projectTabs, [pid]: projectTabs.slice(0, index + 1) },
            }));
          }}
        >
          <ArrowRightToLine className="mr-2 h-4 w-4 opacity-70" />
          <span>Close to the Right</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default TabHeaderContextMenu;
