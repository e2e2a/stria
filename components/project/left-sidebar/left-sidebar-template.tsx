'use client';
import { NavMain } from './nav-main';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu } from '@/components/ui/sidebar';
import { FolderPlus, Bookmark, FolderOpen, Search, ChevronsDownUp, SquarePen, ArrowUpNarrowWide, GalleryVertical, X } from 'lucide-react';
import { SidebarContextMenu } from './sidebar-context-menu';
import { Button } from '../../ui/button';
import { useNodeStore } from '@/features/editor/stores/nodes';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { makeToastError } from '@/lib/toast';
import { useNodeMutations } from '@/hooks/node/useNodeMutations';
import { IProject } from '@/types';
import { LeftSidebarFooter } from './left-sidebar-footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTabStore } from '@/features/editor/stores/tabs';
import { performSearch } from '@/utils/client/search-nodes-utils';
import { flattenNodeTree } from '@/utils/client/node-utils';
import { useProjectUIStore } from '@/features/editor/stores/project-ui';
import { SearchOverlay } from './left-sidebar-search-button-overlay';

export function LeftSidebarTemplate({ projectData }: { projectData: IProject }) {
  const nodes = useNodeStore(state => state.nodes);
  const setCollapseAll = useNodeStore(state => state.setCollapseAll);
  const setActiveNode = useNodeStore(state => state.setActiveNode);
  const selectedNode = useNodeStore(state => state.selectedNode);
  const activeNode = useNodeStore(state => state.activeNode);
  const setIsCreating = useNodeStore(state => state.setIsCreating);
  const undo = useNodeStore(state => state.undo);
  const activeTabs = useTabStore(state => state.activeTabs);
  const openTab = useTabStore(state => state.openTab);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchQuery = useProjectUIStore(state => state.searchQuery);
  const leftSidebarTab = useProjectUIStore(state => state.leftSidebarTab);
  const setSearchQuery = useProjectUIStore(state => state.setSearchQuery);
  const setLeftSidebarTab = useProjectUIStore(state => state.setLeftSidebarTab);
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
  const activeTabId = activeTabs[projectData._id];
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
          console.log('op', op);
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

  let parentId: string | null = null;
  if (activeNode) parentId = activeNode.type === 'folder' ? activeNode._id : activeNode.parentId;
  if (selectedNode) parentId = selectedNode.type === 'folder' ? selectedNode._id : selectedNode.parentId;
  const deferredNodes = useDeferredValue(nodes);
  const flatNodes = useMemo(() => flattenNodeTree(deferredNodes), [deferredNodes]);

  const searchResults = useMemo(() => performSearch(searchQuery, flatNodes), [searchQuery, flatNodes]);

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

  return (
    <Sidebar
      id="sidebar-tree-nodes"
      data-sidebar-node="true"
      tabIndex={-1}
      className="group left-12 w-full border-r bg-none p-0 text-muted-foreground"
      collapsible="none"
      variant="inset"
    >
      <div className="h-screen flex flex-col">
        <SidebarContextMenu node={null}>
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
                    <TabsTrigger className="grow-0" value="nodes">
                      <FolderOpen className="w-6! h-6!" />
                    </TabsTrigger>
                    <TabsTrigger className="grow-0" value="search">
                      <Search className="w-6! h-6!" />
                    </TabsTrigger>
                    <TabsTrigger className="grow-0" value="bookmarks">
                      <Bookmark className="w-6! h-6!" />
                    </TabsTrigger>
                  </TabsList>

                  <div className="absolute top-12 left-0 right-0 h-1 z-51 w-full bg-background" />
                  <div className="absolute top-13 left-0 right-0 h-14 z-50 flex px-3 items-center border-b border-white/5 bg-sidebar/80 backdrop-blur-lg pointer-events-auto cursor-default">
                    <div className="flex w-full">
                      <TabsContent className="h-full min-h-0 w-full" value="nodes">
                        <div className="bg-transparent w-full flex items-start gap-x-1 justify-start">
                          <Button
                            className="px-2! py-1! border border-transparent"
                            variant={'ghost'}
                            title="New Note"
                            onClick={() => {
                              setIsCreating({ type: 'file', parentId });
                              setTimeout(() => {
                                const input = document.querySelector<HTMLInputElement>('#sidebar-creating-file-item input');
                                input?.focus();
                              }, 0);
                            }}
                          >
                            <SquarePen className="h-6! w-6!" />
                          </Button>
                          <Button
                            className="px-2! py-1! w-fit h-fit border border-transparent"
                            variant={'ghost'}
                            title="New Folder"
                            onClick={() => {
                              setIsCreating({ type: 'folder', parentId });
                              setTimeout(() => {
                                const input = document.querySelector<HTMLInputElement>('#sidebar-creating-folder-item input');
                                input?.focus();
                              }, 0);
                            }}
                          >
                            <FolderPlus className="h-6! w-6!" />
                          </Button>
                          <Button
                            className="px-2! py-1! border border-transparent"
                            variant={'ghost'}
                            title="New Note"
                            onClick={() => setCollapseAll(true)}
                          >
                            <ArrowUpNarrowWide className="h-6! w-6!" />
                          </Button>
                          <Button
                            className="px-2! py-1! border border-transparent"
                            variant={'ghost'}
                            title="Auto-reveal current path"
                            onClick={() => {
                              const targetId = activeTabId;

                              // 1. If it's visible, just scroll.
                              const elNode = document.querySelector(`[data-node-id="${targetId}"]`);
                              if (elNode) return elNode.scrollIntoView({ behavior: 'smooth', block: 'center' });

                              // 2. If it's hidden, we need to "Pulse" the state to bypass the lock.
                              // By setting it to null and then immediately back to the ID,
                              // we trigger the [activeNode?._id] reset in the SidebarItem.
                              setActiveNode(null);

                              setTimeout(() => {
                                setActiveNode(targetId);

                                // Give React two frames to render the newly opened folders
                                requestAnimationFrame(() => {
                                  requestAnimationFrame(() => {
                                    const foundNode = document.querySelector(`[data-node-id="${targetId}"]`);
                                    foundNode?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                  });
                                });
                              }, 0);
                            }}
                          >
                            <GalleryVertical className="h-6! w-6!" />
                          </Button>
                          <Button
                            className="px-2! py-1! border border-transparent"
                            variant={'ghost'}
                            title="Collapse All"
                            tabIndex={0}
                            onClick={e => {
                              e.preventDefault();
                              e.stopPropagation();
                              // setActiveNode(null);
                              setCollapseAll(true);
                            }}
                          >
                            <ChevronsDownUp className="h-6! w-6!" />
                          </Button>
                        </div>
                      </TabsContent>
                      <TabsContent className="h-full min-h-0 w-full flex items-center" value="search">
                        <div className="relative w-full px-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <input
                            value={searchQuery}
                            onChange={e => {
                              setSearchQuery(e.target.value);
                              if (!e.target.value)
                                setIsDropdownOpen(true); // Re-open if cleared
                              else setIsDropdownOpen(false); // Close when typing
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
                            className="w-full bg-background/50 border border-white/10 rounded-md py-1.5 pl-9 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
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
                  <TabsContent className="h-full min-h-0 p-0! gap-0! space-x-0 space-y-0! m-0!" value="nodes">
                    <NavMain />
                  </TabsContent>
                  {/* 4. SEARCH RESULTS CONTENT */}
                  <TabsContent value="search" className="h-full min-h-0 p-0! gap-0! space-x-0 space-y-0! m-0! flex">
                    <div className="flex-1 flex px-0 pb-0 flex-col overflow-hidden">
                      {searchQuery.length < 2 ? (
                        <div className="p-4 text-muted-foreground text-center text-sm">Type at least 2 characters to search...</div>
                      ) : (
                        <div className="flex flex-col gap-y-4 px-4 overflow-y-auto pt-16 [&::-webkit-scrollbar-track]:mt-[56px]">
                          <div className="text-[10px] uppercase font-bold text-muted-foreground flex justify-between">
                            <span>{searchResults.length} Files Found</span>
                          </div>
                          {searchResults.map(res => (
                            <div key={res.nodeId} className="space-y-1">
                              <div
                                className="text-sm font-semibold text-foreground truncate cursor-pointer hover:underline"
                                onClick={() => handleSearchResultClick(res.nodeId)}
                              >
                                {res.title}
                              </div>
                              {res.matches.map((m, i) => (
                                <div
                                  key={i}
                                  onClick={() => {
                                    const jumpData = {
                                      nodeId: res.nodeId,
                                      offset: m.index,
                                      length: m.text.length,
                                    };

                                    window.__PENDING_JUMP__ = jumpData;

                                    handleSearchResultClick(res.nodeId);

                                    window.dispatchEvent(new CustomEvent('editor-jump-to', { detail: jumpData }));
                                  }}
                                  className="text-xs text-muted-foreground h-fit bg-white/5 rounded border border-white/5 cursor-default"
                                >
                                  {m.before}
                                  <span className="text-yellow-500 font-bold">{m.text}</span>
                                  {m.after}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="bookmarks" className="text-white pt-16">
                    Bookmarks
                  </TabsContent>
                </SidebarContent>
              </div>
            </Tabs>
          </div>
        </SidebarContextMenu>
        <SidebarFooter className="h-auto mt-1 bg-background/70 py-2">
          <LeftSidebarFooter projectData={projectData} />
        </SidebarFooter>
      </div>
    </Sidebar>
  );
}
