'use client';

import React, { useMemo } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronRight } from 'lucide-react';
import { useNodeBacklinksQuery } from '@/hooks/node/useNodeQuery';
import LinkTabItems from './link-tab-items';

// Match the sort mode type used in your template
type ISortMode = 'name-asc' | 'name-desc' | 'freq-high' | 'freq-low';

interface IProps {
  activeNodeId: string;
  searchQueryInLink: string;
  linkSortMode: ISortMode;
  backlinkExpand: boolean;
  linkRefreshKey: number;
}

const LinkTabContent = ({ activeNodeId, searchQueryInLink, linkSortMode, backlinkExpand, linkRefreshKey }: IProps) => {
  const { data: bData, isLoading } = useNodeBacklinksQuery(activeNodeId ?? '');

  const linkedMentions = useMemo(() => {
    let items = [...(bData?.linked || [])];

    // 1. Apply Search Filter
    if (searchQueryInLink.trim()) {
      const q = searchQueryInLink.toLowerCase();
      items = items.filter(file => file.title.toLowerCase().includes(q) || file.mentions.some(m => m.excerpt.toLowerCase().includes(q)));
    }

    // 2. Apply Sort
    return items.sort((a, b) => {
      if (linkSortMode === 'name-asc') return a.title.localeCompare(b.title);
      if (linkSortMode === 'name-desc') return b.title.localeCompare(a.title);
      if (linkSortMode === 'freq-high') return (b.mentions?.length || 0) - (a.mentions?.length || 0);
      if (linkSortMode === 'freq-low') return (a.mentions?.length || 0) - (b.mentions?.length || 0);
      return 0;
    });
  }, [bData?.linked, searchQueryInLink, linkSortMode]);

  const unlinkedMentions = useMemo(() => {
    let items = [...(bData?.unlinked || [])];

    // 1. Apply Search Filter
    if (searchQueryInLink.trim()) {
      const q = searchQueryInLink.toLowerCase();
      items = items.filter(file => file.title.toLowerCase().includes(q) || file.mentions.some(m => m.excerpt.toLowerCase().includes(q)));
    }

    // 2. Apply Sort
    return items.sort((a, b) => {
      if (linkSortMode === 'name-asc') return a.title.localeCompare(b.title);
      if (linkSortMode === 'name-desc') return b.title.localeCompare(a.title);
      if (linkSortMode === 'freq-high') return (b.mentions?.length || 0) - (a.mentions?.length || 0);
      if (linkSortMode === 'freq-low') return (a.mentions?.length || 0) - (b.mentions?.length || 0);
      return 0;
    });
  }, [bData?.unlinked, searchQueryInLink, linkSortMode]);

  return (
    <div className="p-2 space-y-4">
      {/* Linked Mentions Section */}
      <Collapsible className="group/linked" key={`linked-${linkRefreshKey}`} defaultOpen={backlinkExpand}>
        <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1 hover:bg-white/5 rounded transition-colors">
          <div className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3 text-muted-foreground transition-transform duration-200 group-data-[state=open]/linked:rotate-90" />
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Linked mentions</h3>
          </div>
          <span className="text-[10px] text-muted-foreground">{linkedMentions.length}</span>
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-0.5 mt-1">
          {isLoading ? (
            <p className="text-xs text-zinc-500 italic mt-2 px-2 animate-pulse">Loading...</p>
          ) : linkedMentions.length > 0 ? (
            linkedMentions.map(file => <LinkTabItems key={file._id} file={file} defaultOpen={false} searchQuery={searchQueryInLink} />)
          ) : (
            <p className="text-xs text-zinc-500 italic mt-2 px-6">No linked mentions found</p>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Unlinked Mentions Section */}
      <Collapsible className="group/unlinked pt-2 border-t border-white/5" key={`unlinked-${linkRefreshKey}`} defaultOpen={backlinkExpand}>
        <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1 hover:bg-white/5 rounded transition-colors">
          <div className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3 text-muted-foreground transition-transform duration-200 group-data-[state=open]/unlinked:rotate-90" />
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Unlinked mentions</h3>
          </div>
          <span className="text-[10px] text-muted-foreground">{unlinkedMentions.length}</span>
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-0.5 mt-1">
          {isLoading ? (
            <p className="text-xs text-zinc-500 italic mt-2 px-2 animate-pulse">Loading...</p>
          ) : unlinkedMentions.length > 0 ? (
            unlinkedMentions.map(file => <LinkTabItems key={file._id} file={file} defaultOpen={false} searchQuery={searchQueryInLink} />)
          ) : (
            <p className="text-xs text-zinc-500 italic mt-2 px-6">No unlinked mentions found</p>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default LinkTabContent;
