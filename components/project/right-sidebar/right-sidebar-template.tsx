'use client';

import { memo, useMemo, useState } from 'react';
import { Sidebar, SidebarContent, SidebarHeader } from '@/components/ui/sidebar';
import { useProjectPresence } from '@/features/editor/stores/project-pressence';
import { useSession } from 'next-auth/react';
import { NavUser } from '../../nav-user';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { List, Users, Link, ArrowDownLeft, Archive } from 'lucide-react';
import { useProjectUIStore } from '@/features/editor/stores/project-ui';
import { IconTrident } from '@tabler/icons-react';
import { OutlineTabItem } from './outline-tab-item';
import { PropertyTabItems } from './property-tab-items';
import { PropertyTabHeader } from './property-tab-header';
import { OutlineTabHeader } from './outline-tab-header';
import { LinkTabHeader } from './link-tab-header';
import LinkTabContent from './link-tab-content';
import MermaidTabContent from './mermaid/mermaid-tab-content';
import { IconTooltip } from '../icon-tooltip';
import { useParams } from 'next/navigation';
import { useGetMyProjectMembership } from '@/hooks/projectMember/useQueries';

interface OutlineNode {
  text: string;
  level: number;
  children: OutlineNode[];
}

const InboundLinkIcon = ({ className }: { className?: string }) => (
  <div className="relative inline-flex items-center justify-center">
    <Link className={className} />
    <ArrowDownLeft className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full stroke-[3px]" />
  </div>
);

// const OutboundLinkIcon = ({ className }: { className?: string }) => (
//   <div className="relative inline-flex items-center justify-center">
//     <Link className={className} />
//     <ArrowUpRight className="absolute -bottom-1 -right-1 h-3 w-3 bg-background rounded-full stroke-[3px]" />
//   </div>
// );

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

type ISortMode = 'name-asc' | 'name-desc' | 'freq-high' | 'freq-low';

const RightSidebarTemplate = ({ activeNodeId, activeNodeContent }: { activeNodeId: string; activeNodeType: string; activeNodeContent: string }) => {
  const { data } = useSession();

  const rightSidebarTab = useProjectUIStore(state => state.rightSidebarTab);
  const setRightSidebarTab = useProjectUIStore(state => state.setRightSidebarTab);

  const activeUsers = useProjectPresence(state => state.activeUsers);
  const params = useParams();
  const projectId = params.pid as string;
  const { data: mData } = useGetMyProjectMembership(projectId);

  // --- PROPERTY STATES ---
  const [isSearchingInProperty, setIsSearchingInProperty] = useState(false);
  const [searchQueryInProperty, setSearchQueryInProperty] = useState('');
  const [propertySortMode, setPropertySortMode] = useState<ISortMode>('name-asc');

  // --- BACKLINK STATES ---
  const [isSearchingInLink, setIsSearchingInLink] = useState(false);
  const [searchQueryInLink, setSearchQueryInLink] = useState('');
  const [linkSortMode, setLinkSortMode] = useState<ISortMode>('name-asc');
  const [backlinkExpand, setBacklinkExpand] = useState(true);
  const [linkRefreshKey, setBacklinkRefreshKey] = useState(0);

  const [isSearchingInOutline, setIsSearchingInOutline] = useState(false);
  const [searchQueryInOutline, setSearchQueryInOutline] = useState('');

  // --- OUTLINE STATES ---
  const [defaultExpand, setDefaultExpand] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  // const linkedMentions = bData?.linked || [];
  // const unlinkedMentions = bData?.unlinked || [];

  const tree = useMemo(() => {
    if (!activeNodeContent) return [];
    const headingRegex = /^#{1,6}\s+(.*)/gm;
    const matches = Array.from(activeNodeContent.matchAll(headingRegex)).map(match => ({
      level: match[0].split(' ')[0].length,
      text: match[1],
    }));

    const fullTree = buildOutlineTree(matches);
    if (!searchQueryInOutline.trim()) return fullTree;

    const filterNodes = (nodes: OutlineNode[]): OutlineNode[] => {
      return nodes.reduce((acc: OutlineNode[], node) => {
        const matchesSearch = node.text.toLowerCase().includes(searchQueryInOutline.toLowerCase());
        const filteredChildren = filterNodes(node.children);
        if (matchesSearch || filteredChildren.length > 0) {
          acc.push({ ...node, children: filteredChildren });
        }
        return acc;
      }, []);
    };
    return filterNodes(fullTree);
  }, [activeNodeContent, searchQueryInOutline]);

  const handleToggleExpand = (val: boolean) => {
    setDefaultExpand(val);
    setRefreshKey(k => k + 1);
  };

  const handleTogglelinkExpand = (val: boolean) => {
    setBacklinkExpand(val);
    setBacklinkRefreshKey(k => k + 1);
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
          onValueChange={e => setRightSidebarTab(e as 'pressence' | 'properties' | 'outline' | 'link' | 'outgoing' | 'mermaid')}
          className="flex flex-col h-screen min-h-0 gap-y-0 w-full"
        >
          <SidebarHeader className="h-12 bg-sidebar flex text-xs text-muted-foreground border-b border-white/5 p-0!">
            <div className="flex items-center h-full justify-between w-full overflow-hidden">
              <div className="flex-1 min-w-0 h-full flex items-center overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <TabsList className="bg-transparent flex items-center gap-x-1 w-max">
                  <IconTooltip label={'Backlinks for Tools and Libraries'}>
                    <TabsTrigger className="grow-0 hover:bg-accent/50 data-[state=active]:bg-accent/50! data-[state=active]:border-accent!" value="link">
                      <InboundLinkIcon className="w-6! h-6!" />
                    </TabsTrigger>
                  </IconTooltip>
                  {/* <TabsTrigger className="grow-0" value="outgoing">
                    <OutboundLinkIcon className="w-6! h-6!" />
                  </TabsTrigger> */}
                  <IconTooltip label={'All Properties'}>
                    <TabsTrigger
                      className="grow-0 hover:bg-accent/50 data-[state=active]:bg-accent/50! data-[state=active]:border-accent!"
                      value="properties"
                    >
                      <Archive className="w-6! h-6!" />
                    </TabsTrigger>
                  </IconTooltip>
                  <IconTooltip label={'Outline of backpressure Handling Pattern'}>
                    <TabsTrigger
                      className="grow-0 hover:bg-accent/50 data-[state=active]:bg-accent/50! data-[state=active]:border-accent!"
                      value="outline"
                    >
                      <List className="w-6! h-6!" />
                    </TabsTrigger>
                  </IconTooltip>
                  <IconTooltip label={'Active Users'}>
                    <TabsTrigger
                      className="grow-0 relative hover:bg-accent/50 data-[state=active]:bg-accent/50! data-[state=active]:border-accent!"
                      value="pressence"
                    >
                      <Users className="w-6! h-6!" />
                      {filteredUsers.length > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-3 min-w-[12px] items-center justify-center rounded-full bg-primary text-[8px] font-bold text-white">
                          {filteredUsers.length}
                        </span>
                      )}
                    </TabsTrigger>
                  </IconTooltip>
                  {mData?.permissions.canEditNode && (
                    <IconTooltip label={'Mermaid'}>
                      <TabsTrigger
                        className="grow-0 hover:bg-accent/50 data-[state=active]:bg-accent/50! data-[state=active]:border-accent!"
                        value="mermaid"
                      >
                        <IconTrident className="w-6! h-6! rotate-45 -ml-1 mt-[4px]" />
                      </TabsTrigger>
                    </IconTooltip>
                  )}
                </TabsList>
              </div>

              <div className="shrink-0 ml-2">
                <NavUser />
              </div>
            </div>
          </SidebarHeader>

          <div className="h-1! w-full bg-background" />

          {rightSidebarTab !== 'pressence' && rightSidebarTab !== 'mermaid' && (
            <div className="h-14 flex items-center border-b text-muted-foreground border-white/5 w-full">
              {/* Link Header Content */}
              <LinkTabHeader
                isSearching={isSearchingInLink}
                setIsSearching={setIsSearchingInLink}
                searchQuery={searchQueryInLink}
                setSearchQuery={setSearchQueryInLink}
                defaultExpand={backlinkExpand}
                setDefaultExpand={setBacklinkExpand}
                setRefreshKey={setBacklinkRefreshKey}
                handleToggleExpand={handleTogglelinkExpand}
                sortMode={linkSortMode}
                setSortMode={setLinkSortMode}
              />

              {/* Properties Header Content */}
              <PropertyTabHeader
                isSearchingInProperty={isSearchingInProperty}
                setIsSearchingInProperty={setIsSearchingInProperty}
                searchQueryInProperty={searchQueryInProperty}
                setSearchQueryInProperty={setSearchQueryInProperty}
                propertySortMode={propertySortMode}
                setPropertySortMode={setPropertySortMode}
              />

              {/* Outline Header Content */}
              <OutlineTabHeader
                isSearchingInOutline={isSearchingInOutline}
                setIsSearchingInOutline={setIsSearchingInOutline}
                searchQueryInOutline={searchQueryInOutline}
                setSearchQueryInOutline={setSearchQueryInOutline}
                defaultExpand={defaultExpand}
                setDefaultExpand={setDefaultExpand}
                setRefreshKey={setRefreshKey}
                handleToggleExpand={handleToggleExpand}
              />
            </div>
          )}

          <TabsContent
            value="link"
            className="m-0 flex-1 h-full overflow-y-auto bg-sidebar/80 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden" // no scrollbar to show visually
          >
            <LinkTabContent
              activeNodeId={activeNodeId}
              searchQueryInLink={searchQueryInLink}
              linkSortMode={linkSortMode}
              backlinkExpand={backlinkExpand}
              linkRefreshKey={linkRefreshKey}
            />
          </TabsContent>

          {/* <TabsContent value="outgoing" className="m-0 flex-1 overflow-y-auto bg-sidebar/80">
            outgoing links
          </TabsContent> */}

          <TabsContent
            value="properties"
            className="m-0 flex-1 overflow-y-auto bg-sidebar/80 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            <PropertyTabItems sortMode={propertySortMode} searchQuery={searchQueryInProperty} />
          </TabsContent>

          <TabsContent
            value="outline"
            className="m-0 flex-1 overflow-y-auto bg-sidebar/80 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            <div className="p-2">
              <div className="space-y-0.5">
                {tree.length > 0 ? (
                  tree.map((node, idx) => (
                    <OutlineTabItem key={`${idx}-${refreshKey}`} node={node} defaultOpen={defaultExpand} searchQuery={searchQueryInOutline} />
                  ))
                ) : (
                  <p className="text-xs text-zinc-500 italic mt-2 px-2">{searchQueryInOutline ? 'No matches' : 'No headings'}</p>
                )}
              </div>
            </div>
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
          {mData?.permissions.canEditNode && (
            <TabsContent value="mermaid" className="m-0 flex-1 overflow-y-auto bg-sidebar/80">
              <MermaidTabContent />
            </TabsContent>
          )}
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
