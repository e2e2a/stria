'use client';

import { memo, useMemo, useState } from 'react';
import { Sidebar, SidebarContent, SidebarHeader } from '@/components/ui/sidebar';
import { useProjectPresence } from '@/features/editor/stores/project-pressence';
import { useSession } from 'next-auth/react';
import { NavUser } from '../../nav-user';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { List, Users, Search, ChevronsDownUp, ChevronsUpDown, X, ArrowUpRight, Link, ArrowDownLeft, ChevronRight } from 'lucide-react';
import { useProjectUIStore } from '@/features/editor/stores/project-ui';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { IconTrident } from '@tabler/icons-react';
import { OutlineTabItem } from './outline-tab-item';
import LinkTabItems from './link-tab-items';
import { useNodeBacklinksQuery } from '@/hooks/node/useNodeQuery';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface OutlineNode {
  text: string;
  level: number;
  children: OutlineNode[];
}

const InboundLinkIcon = ({ className }: { className?: string }) => (
  <div className="relative inline-flex items-center justify-center">
    <Link className={className} />
    <ArrowDownLeft className="absolute -bottom-1 -right-1 h-3 w-3 bg-background rounded-full stroke-[3px]" />
  </div>
);

const OutboundLinkIcon = ({ className }: { className?: string }) => (
  <div className="relative inline-flex items-center justify-center">
    <Link className={className} />
    <ArrowUpRight className="absolute -bottom-1 -right-1 h-3 w-3 bg-background rounded-full stroke-[3px]" />
  </div>
);

const buildOutlineTree = (headings: { level: number; text: string }[]): OutlineNode[] => {
  const root: OutlineNode[] = [];
  const stack: OutlineNode[] = [];

  headings.forEach(heading => {
    const node: OutlineNode = { ...heading, children: [] };
    while (stack.length > 0 && stack[stack.length - 1].level >= node.level) {
      stack.pop();
    }
    if (stack.length === 0) {
      root.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }
    stack.push(node);
  });
  return root;
};

const RightSidebarTemplate = ({ activeNodeId, activeNodeContent }: { activeNodeId: string; activeNodeType: string; activeNodeContent: string }) => {
  const { data } = useSession();
  const { data: bData, isLoading: nLoading } = useNodeBacklinksQuery(activeNodeId ?? '');

  const rightSidebarTab = useProjectUIStore(state => state.rightSidebarTab);
  const setRightSidebarTab = useProjectUIStore(state => state.setRightSidebarTab);

  const activeUsers = useProjectPresence(state => state.activeUsers);

  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [defaultExpand, setDefaultExpand] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const linkedMentions = bData?.linked || [];
  const unlinkedMentions = bData?.unlinked || [];
  const tree = useMemo(() => {
    if (!activeNodeContent) return [];
    const headingRegex = /^#{1,6}\s+(.*)/gm;
    const matches = Array.from(activeNodeContent.matchAll(headingRegex)).map(match => ({
      level: match[0].split(' ')[0].length,
      text: match[1],
    }));

    const fullTree = buildOutlineTree(matches);
    if (!searchQuery.trim()) return fullTree;

    const filterNodes = (nodes: OutlineNode[]): OutlineNode[] => {
      return nodes.reduce((acc: OutlineNode[], node) => {
        const matchesSearch = node.text.toLowerCase().includes(searchQuery.toLowerCase());
        const filteredChildren = filterNodes(node.children);
        if (matchesSearch || filteredChildren.length > 0) {
          acc.push({ ...node, children: filteredChildren });
        }
        return acc;
      }, []);
    };
    return filterNodes(fullTree);
  }, [activeNodeContent, searchQuery]);

  const handleToggleExpand = (val: boolean) => {
    setDefaultExpand(val);
    setRefreshKey(k => k + 1);
  };

  const onSearchChange = (val: string) => {
    setSearchQuery(val);
    if (val.trim().length > 0) {
      setDefaultExpand(true);
      setRefreshKey(k => k + 1);
    }
  };

  const filteredUsers = useMemo(() => {
    return Array.from(activeUsers.values()).filter(user => user.id !== data?.user?._id);
  }, [activeUsers, data?.user?._id]);

  return (
    <Sidebar side="right" className="right-0 border-l p-0 w-full" collapsible="none" variant="inset">
      <SidebarContent className="min-h-screen w-full">
        <Tabs
          defaultValue="nodes"
          value={rightSidebarTab}
          onValueChange={e => setRightSidebarTab(e as 'pressence' | 'outline' | 'backlink' | 'outgoing' | 'mermaid')}
          className="flex flex-col h-screen min-h-0 gap-y-0 w-full"
        >
          <SidebarHeader className="h-12 bg-sidebar flex text-xs text-muted-foreground border-b border-white/5">
            <div className="flex flex-row items-center justify-between w-full">
              <TabsList className="bg-transparent flex items-center gap-x-1">
                <TabsTrigger className="grow-0" value="backlink">
                  <InboundLinkIcon className="w-6! h-6!" />
                </TabsTrigger>
                <TabsTrigger className="grow-0" value="outgoing">
                  <OutboundLinkIcon className="w-6! h-6!" />
                </TabsTrigger>
                <TabsTrigger className="grow-0" value="outline">
                  <List className="w-6! h-6!" />
                </TabsTrigger>
                <TabsTrigger className="grow-0 relative" value="pressence">
                  <Users className="w-6! h-6!" />
                  {filteredUsers.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-3 min-w-[12px] items-center justify-center rounded-full bg-primary text-[8px] font-bold text-white">
                      {filteredUsers.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger className="grow-0" value="mermaid">
                  <IconTrident className="w-6! h-6! rotate-45 -ml-1 mt-[4px]" />
                </TabsTrigger>
              </TabsList>
              <NavUser />
            </div>
          </SidebarHeader>

          <div className="h-1! w-full bg-background" />

          <div className="h-14 flex items-center border-b text-muted-foreground border-white/5 w-full">
            <TabsContent className="h-full min-h-0 w-full px-3" value="outline">
              <div className="bg-transparent w-full h-full flex items-center gap-x-1 justify-start">
                {!isSearching ? (
                  <>
                    <Button onClick={() => setIsSearching(true)} className="px-2! py-1! border border-transparent" variant="ghost">
                      <Search className="h-6! w-6!" />
                    </Button>
                    {defaultExpand ? (
                      <Button
                        onClick={() => handleToggleExpand(false)}
                        className="px-2! py-1! border border-transparent"
                        variant="ghost"
                        title="Collapse All"
                      >
                        <ChevronsDownUp className="h-6! w-6!" />
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleToggleExpand(true)}
                        className="px-2! py-1! border border-transparent"
                        variant="ghost"
                        title="Expand All"
                      >
                        <ChevronsUpDown className="h-6! w-6!" />
                      </Button>
                    )}
                  </>
                ) : (
                  <div className="flex items-center w-full gap-x-2 animate-in slide-in-from-left-1 duration-200">
                    <Search className="h-4 w-4 text-zinc-500" />
                    <Input
                      autoFocus
                      placeholder="Filter..."
                      value={searchQuery}
                      onChange={e => onSearchChange(e.target.value)}
                      className="h-8 bg-transparent border-none focus-visible:ring-0 px-0 text-sm"
                    />
                    <X
                      className="h-4 w-4 cursor-pointer"
                      onClick={() => {
                        setIsSearching(false);
                        setSearchQuery('');
                      }}
                    />
                  </div>
                )}
              </div>
            </TabsContent>
          </div>

          <TabsContent value="outline" className="m-0 flex-1 overflow-y-auto bg-sidebar/80">
            <div className="p-2">
              <div className="space-y-0.5">
                {tree.length > 0 ? (
                  tree.map((node, idx) => (
                    <OutlineTabItem key={`${idx}-${refreshKey}`} node={node} defaultOpen={defaultExpand} searchQuery={searchQuery} />
                  ))
                ) : (
                  <p className="text-xs text-zinc-500 italic mt-2 px-2">{searchQuery ? 'No matches' : 'No headings'}</p>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent
            value="backlink"
            className="m-0 flex-1 h-full overflow-y-auto bg-sidebar/80 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden" // no scrollbar to show visually
          >
            <div className="p-2 space-y-4">
              <Collapsible defaultOpen className="group/linked">
                <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1 hover:bg-white/5 rounded transition-colors">
                  <div className="flex items-center gap-1">
                    <ChevronRight className="h-3 w-3 text-muted-foreground transition-transform duration-200 group-data-[state=open]/linked:rotate-90" />
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Linked mentions</h3>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{linkedMentions.length}</span>
                </CollapsibleTrigger>

                <CollapsibleContent className="space-y-0.5 mt-1">
                  {nLoading ? (
                    <p className="text-xs text-zinc-500 italic mt-2 px-2 animate-pulse">Loading...</p>
                  ) : linkedMentions.length > 0 ? (
                    linkedMentions.map(file => <LinkTabItems key={file._id} file={file} />)
                  ) : (
                    <p className="text-xs text-zinc-500 italic mt-2 px-2">No linked mentions found</p>
                  )}
                </CollapsibleContent>
              </Collapsible>

              <Collapsible className="group/unlinked pt-2 border-t border-white/5">
                <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1 hover:bg-white/5 rounded transition-colors">
                  <div className="flex items-center gap-1">
                    <ChevronRight className="h-3 w-3 text-muted-foreground transition-transform duration-200 group-data-[state=open]/unlinked:rotate-90" />
                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Unlinked mentions</h3>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{unlinkedMentions.length}</span>
                </CollapsibleTrigger>

                <CollapsibleContent className="space-y-0.5 mt-1">
                  {!nLoading && unlinkedMentions.length > 0 ? (
                    unlinkedMentions.map(file => <LinkTabItems key={file._id} file={file} />)
                  ) : (
                    <p className="text-xs text-zinc-500 italic mt-2 px-2">No unlinked mentions found</p>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </div>
          </TabsContent>
          <TabsContent value="outgoing" className="m-0 flex-1 overflow-y-auto bg-sidebar/80">
            outgoing links
          </TabsContent>
          <TabsContent value="mermaid" className="m-0 flex-1 overflow-y-auto bg-sidebar/80">
            mermaid
          </TabsContent>
          <TabsContent value="pressence" className="m-0 flex-1 overflow-y-auto bg-sidebar/80">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-bold tracking-tight text-white">Project Presence</h1>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-medium text-green-500 uppercase">{filteredUsers.length} Active</span>
                </div>
              </div>
              <section>
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Live Active</h3>
                <div className="rounded-lg border border-white/5 bg-white/2 p-2">
                  <ul className="flex flex-col gap-1 font-mono text-sm">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map(user => (
                        <li key={user.id} className="group flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-white/5">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: user.color }} />
                          <span className="text-zinc-400 truncate">{user.name}</span>
                          <span className="ml-auto text-[10px] text-zinc-600">{user.id.slice(-4)}</span>
                        </li>
                      ))
                    ) : (
                      <div className="text-center py-4 text-[10px] font-bold text-muted-foreground uppercase">No Active Users</div>
                    )}
                  </ul>
                </div>
              </section>
            </div>
          </TabsContent>
        </Tabs>
      </SidebarContent>
    </Sidebar>
  );
};

export default memo(RightSidebarTemplate, (prevProps, nextProps) => {
  if (!nextProps.activeNodeType || nextProps.activeNodeType === 'folder') return true;
  if (prevProps.activeNodeId === nextProps.activeNodeId) return true;

  return false;
});
