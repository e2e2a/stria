'use client';
import { NavMain } from './nav-main';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu } from '@/components/ui/sidebar';
import { Bookmark, FolderOpen, Search, X } from 'lucide-react';
import { SidebarContextMenu } from './sidebar-context-menu';
import { useNodeStore } from '@/features/editor/stores/nodes';
import { memo, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { makeToastError } from '@/lib/toast';
import { useNodeMutations } from '@/hooks/node/useNodeMutations';
import { IProject } from '@/types';
import { LeftSidebarFooter } from './left-sidebar-footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTabStore } from '@/features/editor/stores/tabs';
import { flattenNodeTree } from '@/utils/client/node-utils';
import { useProjectUIStore } from '@/features/editor/stores/project-ui';
import { SearchOverlay } from './search-button-overlay';
import { SearchTabContent } from './search-tab-content';
import { cn } from '@/lib/utils';
import NodeTabHeader from './node-tab-header';
import { IconTooltip } from '../icon-tooltip';
import { useGetMyProjectMembership } from '@/hooks/projectMember/useQueries';

function LeftSidebarTemplate({ projectData }: { projectData: IProject }) {
  const nodes = useNodeStore(state => state.nodes);
  const setActiveNode = useNodeStore(state => state.setActiveNode);
  const undo = useNodeStore(state => state.undo);

  const openTab = useTabStore(state => state.openTab);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchQuery = useProjectUIStore(state => state.searchQuery);
  const leftSidebarTab = useProjectUIStore(state => state.leftSidebarTab);
  const setSearchQuery = useProjectUIStore(state => state.setSearchQuery);
  const setLeftSidebarTab = useProjectUIStore(state => state.setLeftSidebarTab);

  const { data: mData } = useGetMyProjectMembership(projectData._id);

  const [history, setHistory] = useState<string[]>([]);
  const STORAGE_KEY = 'left_sidebar_search_history';

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setHistory(JSON.parse(saved));
      } catch {
        console.error('Failed to parse search history');
      }
    }
  }, []);

  const mutation = useNodeMutations();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      const isUndo = (isMac && e.metaKey && e.key === 'z') || (!isMac && e.ctrlKey && e.key === 'z');

      if (!isUndo) return;

      const target = e.target as HTMLElement | null;
      if (!target) return;
      const sidebarRoot = document.querySelector('[data-sidebar-node="true"]');
      // if (!sidebarRoot || !sidebarRoot.contains(target)) return;
      const active = document.activeElement as HTMLElement | null;
      if (!active || !sidebarRoot || !sidebarRoot.contains(active)) return;
      // ignore inputs
      // if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      if (target.tagName === 'INPUT' || target.isContentEditable) return;

      e.preventDefault();

      // ✅ User intent undo
      // call API to move nodes back to previous state
      // syncNodesToServer(snapshot);

      try {
        const op = undo();
        if (op) {
          // console.log('op', op);
          switch (op.type) {
            case 'create':
              mutation.trash.mutate({ _id: op.node._id as string, pid: op.node.projectId });
              break;
            case 'move':
              mutation.move.mutate({ _id: op.draggedId, pid: projectData?._id, parentId: op.fromParentId });
              break;
            case 'delete':
              mutation.restore.mutate([op.node]);
              break;
            case 'update':
              mutation.update.mutate({ _id: op.nodeId as string, pid: op.prev.projectId, title: op.prev.title });
              break;
          }
        }
      } catch (err) {
        let message = 'Unknown Error';
        if (err instanceof Error) {
          message = err.message;
        } else {
          message = err as string;
        }
        makeToastError(message);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, projectData?._id, mutation]);

  const deferredNodes = useDeferredValue(nodes);
  const flatNodes = useMemo(() => flattenNodeTree(deferredNodes), [deferredNodes]);

  const handleSearchResultClick = (nodeId: string) => {
    const node = flatNodes.find(n => n._id === nodeId);
    if (!node) return;

    if (searchQuery.trim().length >= 2) {
      const updatedHistory = [searchQuery.trim(), ...history.filter(item => item !== searchQuery.trim())].slice(0, 10); // Limit to top 10

      setHistory(updatedHistory);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
    }

    openTab(projectData._id, node, true);
    setActiveNode(node._id);
  };
  if (!mData) return;
  return (
    <Sidebar
      id="sidebar-tree-nodes"
      data-sidebar-node="true"
      tabIndex={-1}
      className="group left-12 w-full bg-none p-0 text-muted-foreground app-font-interface"
      collapsible="none"
      variant="inset"
    >
      <div className="h-screen flex flex-col">
        <div className="h-full overflow-hidden flex flex-col">
          <Tabs
            defaultValue="nodes"
            value={leftSidebarTab}
            onValueChange={e => setLeftSidebarTab(e as 'search' | 'nodes' | 'bookmarks')}
            className="w-full flex flex-col flex-1 min-h-0 gap-y-0"
          >
            <SidebarHeader className="h-12 p-0">
              <SidebarMenu className="h-12 flex w-full flex-row items-center justify-center px-2 relative">
                <TabsList className="bg-transparent w-full flex items-start gap-x-3 justify-start">
                  <IconTooltip label={'Files'}>
                    <TabsTrigger
                      className="grow-0 hover:bg-accent/50 text-muted-foreground hover:text-foreground! data-[state=active]:text-foreground data-[state=active]:bg-accent/50! data-[state=active]:border-accent!"
                      value="nodes"
                    >
                      <FolderOpen className="w-6! h-6!" />
                    </TabsTrigger>
                  </IconTooltip>
                  <IconTooltip label={'Search'}>
                    <TabsTrigger
                      className="grow-0 hover:bg-accent/50 text-muted-foreground hover:text-foreground! data-[state=active]:text-foreground data-[state=active]:bg-accent/50! data-[state=active]:border-accent!"
                      value="search"
                    >
                      <Search className="w-6! h-6!" />
                    </TabsTrigger>
                  </IconTooltip>
                  <IconTooltip label={'Bookmarks'}>
                    <TabsTrigger
                      className="grow-0 hover:bg-accent/50 text-muted-foreground hover:text-foreground! data-[state=active]:text-foreground data-[state=active]:bg-accent/50! data-[state=active]:border-accent!"
                      value="bookmarks"
                    >
                      <Bookmark className="w-6! h-6!" />
                    </TabsTrigger>
                  </IconTooltip>
                </TabsList>

                <div className="absolute top-12 left-0 right-0 h-1 z-12 w-full bg-border dark:bg-border/50" />
                <div className="absolute top-13 left-0 right-0 h-14 z-50 flex px-3 items-center border-b border-border bg-sidebar/80 backdrop-blur-lg pointer-events-auto cursor-default">
                  <div className="flex w-full">
                    <NodeTabHeader projectData={projectData} />

                    <TabsContent className="h-full min-h-0 w-full flex items-center" value="search">
                      <div className="relative w-full px-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                          value={searchQuery}
                          onChange={e => {
                            setSearchQuery(e.target.value);
                            if (!e.target.value) setIsDropdownOpen(true);
                            else setIsDropdownOpen(false);
                          }}
                          onFocus={() => {
                            if (!searchQuery) setIsDropdownOpen(true);
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && searchQuery.trim().length >= 2) {
                              const updatedHistory = [searchQuery.trim(), ...history.filter(item => item !== searchQuery.trim())].slice(0, 10);
                              setHistory(updatedHistory);
                              localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
                              setIsDropdownOpen(false);
                            }
                          }}
                          onBlur={() => {
                            setIsDropdownOpen(false);
                          }}
                          placeholder="Search content..."
                          className="w-full bg-background/50 border border-border/80 rounded-md py-1.5 pl-9 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                        />
                        {searchQuery && (
                          <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-foreground">
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      {isDropdownOpen && (
                        <SearchOverlay
                          query={searchQuery}
                          history={history}
                          setHistory={setHistory}
                          STORAGE_KEY={STORAGE_KEY}
                          onSelect={val => {
                            setSearchQuery(val);
                            setIsDropdownOpen(false);
                          }}
                        />
                      )}
                    </TabsContent>
                  </div>
                </div>
              </SidebarMenu>
            </SidebarHeader>
            <div className="min-h-0 flex-1 overflow-hidden!">
              <SidebarContent className="ml-0 p-0! space-y-0! h-full flex">
                <SidebarContextMenu node={null} mData={mData}>
                  <TabsContent
                    forceMount
                    className={cn('h-full min-h-0 p-0! gap-0! space-x-0 space-y-0! m-0!', leftSidebarTab !== 'nodes' && 'hidden')}
                    value="nodes"
                  >
                    <NavMain canMoveNode={!!mData?.permissions.canMoveNode} mData={mData} />
                  </TabsContent>
                </SidebarContextMenu>

                {/* SEARCH RESULTS CONTENT */}
                <TabsContent
                  forceMount // i force it to not hide so it wont rerender everytime tabs change.
                  value="search"
                  className={cn('h-full min-h-0 p-0! gap-0! space-x-0 space-y-0! flex', leftSidebarTab !== 'search' && 'hidden')}
                >
                  <SearchTabContent query={searchQuery} onResultClick={handleSearchResultClick} />
                </TabsContent>

                <TabsContent value="bookmarks" className="text-foreground text-center pt-16">
                  Bookmarks
                </TabsContent>
              </SidebarContent>
            </div>
          </Tabs>
        </div>

        <SidebarFooter className="h-auto mt-1 bg-background/70 p-1! border-t border-border/80">
          <LeftSidebarFooter projectData={projectData} />
        </SidebarFooter>
      </div>
    </Sidebar>
  );
}

export default memo(LeftSidebarTemplate, (prevProps, nextProps) => {
  return prevProps.projectData?._id === nextProps.projectData?._id;
});
