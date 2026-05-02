'use client';
import { memo, useEffect, useMemo, useState } from 'react';
import { Sidebar, SidebarContent, SidebarHeader } from '@/components/ui/sidebar';
import { useProjectPresence } from '@/features/editor/stores/project-pressence';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { List, Users, Link, ArrowDownLeft, Archive, Tags } from 'lucide-react';
import { useProjectUIStore } from '@/features/editor/stores/project-ui';
import { IconTrident } from '@tabler/icons-react';
import { PropertyTabItems } from './property-tab-items';
import { PropertyTabHeader } from './property-tab-header';
import { OutlineTabHeader } from './outline-tab-header';
import { LinkTabHeader } from './link-tab-header';
import LinkTabContent from './link-tab-content';
import MermaidTabContent from './mermaid/mermaid-tab-content';
import { IconTooltip } from '../icon-tooltip';
import { useParams } from 'react-router-dom';
import { TagsTabHeader } from './tags-tab-header';
import { TagsTabContent } from './tags-tab-content';
import OutlineTabContent from './outline-tab-content';
import { useCorePluginStore } from '@/features/editor/stores/setting-core-plugin';

type RightSidebarTab = 'properties' | 'outline' | 'pressence' | 'tags' | 'link' | 'mermaid';

const tabPriority: RightSidebarTab[] = ['pressence', 'outline', 'properties', 'tags', 'link', 'mermaid'];

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

type ISortMode = 'name-asc' | 'name-desc' | 'freq-high' | 'freq-low';

const RightSidebarTemplate = ({ activeNodeId }: { activeNodeId: string; activeNodeType: string }) => {
  const isShowBacklink = useCorePluginStore(state => state.settings['show-backlink']);
  const isShowProperties = useCorePluginStore(state => state.settings.properties);
  const isShowOutline = useCorePluginStore(state => state.settings.outline);
  const isShowTags = useCorePluginStore(state => state.settings.tags);

  const [showBacklink, setShowBacklink] = useState(isShowBacklink);
  const [showProperties, setShowProperties] = useState(isShowProperties);
  const [showOutline, setShowOutline] = useState(isShowOutline);
  const [showTags, setShowTags] = useState(isShowTags);

  const rightSidebarTab = useProjectUIStore(state => state.rightSidebarTab);
  const setRightSidebarTab = useProjectUIStore(state => state.setRightSidebarTab);

  const activeUsers = useProjectPresence(state => state.activeUsers);
  const params = useParams();
  const projectId = params.pid || '';

  // --- TAG STATES ---
  const [isSearchingInTags, setIsSearchingInTags] = useState(false);
  const [searchQueryInTags, setSearchQueryInTags] = useState('');
  const [tagsExpand, setTagsExpand] = useState(true);
  const [isNestedTagsView, setIsNestedTagsView] = useState(true);

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

  const handleToggleExpand = (val: boolean) => {
    setDefaultExpand(val);
    setRefreshKey(k => k + 1);
  };

  const handleTogglelinkExpand = (val: boolean) => {
    setBacklinkExpand(val);
    setBacklinkRefreshKey(k => k + 1);
  };

  const filteredUsers = useMemo(() => {
    return Array.from(activeUsers.values());
  }, [activeUsers]);

  useEffect(() => {
    const unsubscribe = useCorePluginStore.subscribe((state, prevState) => {
      const { rightSidebarTab, setRightSidebarTab } = useProjectUIStore.getState();

      const settings = state.settings;
      const prevSettings = prevState?.settings || {};

      const changed =
        settings['show-backlink'] !== prevSettings['show-backlink'] ||
        settings['properties'] !== prevSettings['properties'] ||
        settings['tags'] !== prevSettings['tags'] ||
        settings['outline'] !== prevSettings['outline'];

      if (!changed) return;

      setShowBacklink(settings['show-backlink']);
      setShowProperties(settings.properties);
      setShowOutline(settings.outline);
      setShowTags(settings.tags);

      const tabVisibility: Record<RightSidebarTab, boolean> = {
        properties: settings['properties'],
        tags: settings['tags'],
        pressence: true,
        link: settings['show-backlink'],
        outline: settings['outline'],
        mermaid: true,
      };

      if (!tabVisibility[rightSidebarTab]) {
        const fallbackTab = tabPriority.find(tab => tabVisibility[tab]);

        if (fallbackTab) {
          setRightSidebarTab(fallbackTab);
        }
      }
    });

    return unsubscribe;
  }, []);

  return (
    <Sidebar side="right" className="right-0 border-l p-0 w-full app-font-interface" collapsible="none" variant="inset">
      <SidebarContent className="min-h-screen w-full">
        <Tabs
          defaultValue="nodes"
          value={rightSidebarTab}
          onValueChange={e => setRightSidebarTab(e as 'pressence' | 'properties' | 'outline' | 'link' | 'mermaid')}
          className="flex flex-col h-screen min-h-0 gap-y-0 w-full"
        >
          <SidebarHeader className="h-10 bg-sidebar flex text-xs text-muted-foreground border-b border-white/5 p-0!">
            <div className="flex items-center h-full justify-between w-full overflow-hidden">
              <div className="flex-1 min-w-0 h-full flex items-center overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <TabsList className="bg-transparent flex items-center gap-x-1 w-max">
                  {showBacklink && (
                    <IconTooltip label={'Backlinks for Tools and Libraries'}>
                      <TabsTrigger
                        className="grow-0 hover:bg-accent/50 text-muted-foreground hover:text-foreground! data-[state=active]:text-foreground data-[state=active]:bg-accent/50! data-[state=active]:border-accent!"
                        value="link"
                      >
                        <InboundLinkIcon className="w-5! h-5!" />
                      </TabsTrigger>
                    </IconTooltip>
                  )}
                  {showTags && (
                    <IconTooltip label={'Tags'}>
                      <TabsTrigger
                        className="grow-0 hover:bg-accent/50 text-muted-foreground hover:text-foreground! data-[state=active]:text-foreground data-[state=active]:bg-accent/50! data-[state=active]:border-accent!"
                        value="tags"
                      >
                        <Tags className="w-5! h-5!" />
                      </TabsTrigger>
                    </IconTooltip>
                  )}
                  {showProperties && (
                    <IconTooltip label={'All Properties'}>
                      <TabsTrigger
                        className="grow-0 hover:bg-accent/50 text-muted-foreground hover:text-foreground! data-[state=active]:text-foreground data-[state=active]:bg-accent/50! data-[state=active]:border-accent!"
                        value="properties"
                      >
                        <Archive className="w-5! h-5!" />
                      </TabsTrigger>
                    </IconTooltip>
                  )}

                  {showOutline && (
                    <IconTooltip label={'Outline of backpressure Handling Pattern'}>
                      <TabsTrigger
                        className="grow-0 hover:bg-accent/50 text-muted-foreground hover:text-foreground! data-[state=active]:text-foreground data-[state=active]:bg-accent/50! data-[state=active]:border-accent!"
                        value="outline"
                      >
                        <List className="w-5! h-5!" />
                      </TabsTrigger>
                    </IconTooltip>
                  )}
                  <IconTooltip label={'Active Users'}>
                    <TabsTrigger
                      className="grow-0 relative text-muted-foreground hover:text-foreground! data-[state=active]:text-foreground hover:bg-accent/50 data-[state=active]:bg-accent/50! data-[state=active]:border-accent!"
                      value="pressence"
                    >
                      <Users className="w-5! h-5!" />
                      {filteredUsers.length > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-3 min-w-3 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-white">
                          {filteredUsers.length}
                        </span>
                      )}
                    </TabsTrigger>
                  </IconTooltip>
                  <IconTooltip label={'Mermaid'}>
                    <TabsTrigger
                      className="grow-0 hover:bg-accent/50 text-muted-foreground hover:text-foreground! data-[state=active]:text-foreground data-[state=active]:bg-accent/50! data-[state=active]:border-accent!"
                      value="mermaid"
                    >
                      <IconTrident className="w-5! h-5! rotate-45 -ml-1 mt-1" />
                    </TabsTrigger>
                  </IconTooltip>
                </TabsList>
              </div>
            </div>
          </SidebarHeader>

          <div className="h-1! w-full bg-border dark:bg-border/50" />

          {/* Link Header Content */}
          {showBacklink && rightSidebarTab === 'link' && (
            <div className="h-10 flex items-center border-b text-muted-foreground border-border w-full">
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
            </div>
          )}

          {/* Properties Header Content */}
          {showOutline && rightSidebarTab === 'outline' && (
            <div className="h-10 flex items-center border-b text-muted-foreground border-border w-full">
              <PropertyTabHeader
                isSearchingInProperty={isSearchingInProperty}
                setIsSearchingInProperty={setIsSearchingInProperty}
                searchQueryInProperty={searchQueryInProperty}
                setSearchQueryInProperty={setSearchQueryInProperty}
                propertySortMode={propertySortMode}
                setPropertySortMode={setPropertySortMode}
              />
            </div>
          )}

          {/* Outline Header Content */}
          {showProperties && rightSidebarTab === 'properties' && (
            <div className="h-10 flex items-center border-b text-muted-foreground border-border w-full">
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

          {/* Tags Header Content */}
          {showTags && rightSidebarTab === 'tags' && (
            <div className="h-10 flex items-center border-b text-muted-foreground border-border w-full">
              <TagsTabHeader
                isSearchingInTags={isSearchingInTags}
                setIsSearchingInTags={setIsSearchingInTags}
                searchQueryInTags={searchQueryInTags}
                setSearchQueryInTags={setSearchQueryInTags}
                defaultExpand={tagsExpand}
                setDefaultExpand={setTagsExpand}
                handleToggleExpand={setTagsExpand}
                isNestedView={isNestedTagsView}
                setIsNestedView={setIsNestedTagsView}
              />
            </div>
          )}

          {showBacklink && (
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
          )}
          {showTags && (
            <TabsContent
              value="tags"
              className="m-0 flex-1 h-full overflow-y-auto bg-sidebar/80 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              <TagsTabContent searchQuery={searchQueryInTags} defaultExpand={tagsExpand} isNestedView={isNestedTagsView} />
            </TabsContent>
          )}

          {showProperties && (
            <TabsContent
              value="properties"
              className="m-0 flex-1 overflow-y-auto bg-sidebar/80 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              <PropertyTabItems sortMode={propertySortMode} searchQuery={searchQueryInProperty} />
            </TabsContent>
          )}

          {showOutline && (
            <TabsContent
              value="outline"
              className="m-0 flex-1 overflow-y-auto bg-sidebar/80 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              <OutlineTabContent activeNodeId={activeNodeId} refreshKey={refreshKey} defaultOpen={defaultExpand} searchQuery={searchQueryInOutline} />
            </TabsContent>
          )}

          <TabsContent value="pressence" className="m-0 flex-1 overflow-y-auto bg-sidebar/80">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-bold tracking-tight text-foreground">File Presence</h1>
              </div>
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ">Live Active</h3>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full underline decoration-green-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-medium text-green-500 uppercase">{filteredUsers.length} Active</span>
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-secondary p-2">
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

          <TabsContent value="mermaid" className="m-0 flex-1 overflow-y-auto bg-sidebar/80">
            <MermaidTabContent />
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
