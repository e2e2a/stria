'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, ArrowUpNarrowWide, ChevronsDownUp, ChevronsUpDown, X, ChevronRight } from 'lucide-react';
import { useNodeBacklinksQuery } from '@/hooks/node/useNodeQuery';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { LinkItems } from './link-items';
import { cn } from '@/lib/utils';

// Types from your schema
type ISortMode = 'name-asc' | 'name-desc' | 'freq-high' | 'freq-low';

interface BacklinkMention {
  excerpt: string;
  line: number;
  index: number;
  alias?: string;
}

interface IBacklink {
  _id: string;
  title: string;
  path: string;
  type: 'file' | 'folder';
  mentions: BacklinkMention[];
}

interface FooterLinksProps {
  activeNodeId: string;
}

const FooterLinks = ({ activeNodeId }: FooterLinksProps) => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<ISortMode>('name-asc');
  const [backlinkExpand, setBacklinkExpand] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: bData, isLoading } = useNodeBacklinksQuery(activeNodeId ?? '');

  // Stable processing function to satisfy React Compiler
  const processMentions = useCallback(
    (rawItems: IBacklink[] | undefined): IBacklink[] => {
      if (!rawItems) return [];
      let items = [...rawItems];

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        items = items.filter(file => file.title.toLowerCase().includes(q) || file.mentions.some(m => m.excerpt.toLowerCase().includes(q)));
      }

      return items.sort((a, b) => {
        if (sortMode === 'name-asc') return a.title.localeCompare(b.title);
        if (sortMode === 'name-desc') return b.title.localeCompare(a.title);
        if (sortMode === 'freq-high') return (b.mentions?.length || 0) - (a.mentions?.length || 0);
        if (sortMode === 'freq-low') return (a.mentions?.length || 0) - (b.mentions?.length || 0);
        return 0;
      });
    },
    [searchQuery, sortMode]
  );

  const linkedMentions = useMemo(() => processMentions(bData?.linked), [bData?.linked, processMentions]);
  const unlinkedMentions = useMemo(() => processMentions(bData?.unlinked), [bData?.unlinked, processMentions]);

  const handleToggleExpand = (val: boolean) => {
    setBacklinkExpand(val);
    setRefreshKey(k => k + 1);
  };

  return (
    <div className="pb-20 mt-10 w-full max-w-5xl mx-auto">
      <Separator className="w-full bg-white/5 mb-4" />

      <div className={cn('flex items-center  w-full gap-x-1 mb-6 h-9', isSearching ? 'flex-row justify-between' : 'justify-end')}>
        {isSearching && (
          <div className="relative flex items-center flex-1 max-w-full animate-in fade-in slide-in-from-left-2 duration-300">
            <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Filter mentions..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="h-8 bg-background/50 border-white/10 pl-9 pr-8 text-xs focus-visible:ring-1 focus-visible:ring-primary/50"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 h-8 w-8 hover:bg-transparent text-muted-foreground hover:text-foreground"
              onClick={() => {
                setIsSearching(false);
                setSearchQuery('');
              }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
        <div className="">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setIsSearching(!isSearching)}>
            <Search className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => handleToggleExpand(!backlinkExpand)}
          >
            {backlinkExpand ? <ChevronsDownUp className="h-4 w-4" /> : <ChevronsUpDown className="h-4 w-4" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <ArrowUpNarrowWide className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-[#1e1e20] border-white/10 text-white shadow-xl">
              <DropdownMenuItem onClick={() => setSortMode('name-asc')} className="text-xs flex justify-between cursor-pointer focus:bg-primary/20">
                Property name (A to Z) {sortMode === 'name-asc' && <span className="text-primary font-bold">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortMode('name-desc')} className="text-xs flex justify-between cursor-pointer focus:bg-primary/20">
                Property name (Z to A) {sortMode === 'name-desc' && <span className="text-primary font-bold">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/5" />
              <DropdownMenuItem onClick={() => setSortMode('freq-high')} className="text-xs flex justify-between cursor-pointer focus:bg-primary/20">
                Frequency (high to low) {sortMode === 'freq-high' && <span className="text-primary font-bold">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortMode('freq-low')} className="text-xs flex justify-between cursor-pointer focus:bg-primary/20">
                Frequency (low to high) {sortMode === 'freq-low' && <span className="text-primary font-bold">✓</span>}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="space-y-8 select-none">
        {/* Linked */}
        <Collapsible key={`linked-${refreshKey}`} defaultOpen={backlinkExpand} className="group/section">
          <CollapsibleTrigger className="flex items-center gap-2 mb-3 w-fit">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]/section:rotate-90" />
            <span className="text-[13px] font-bold text-foreground/90 uppercase tracking-wide">Linked mentions</span>
            <span className="text-xs text-muted-foreground/50 font-mono">{linkedMentions.length}</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1">
            {isLoading ? (
              <div className="space-y-2 ml-6">
                <div className="h-4 w-48 bg-white/5 animate-pulse rounded" />
                <div className="h-4 w-64 bg-white/5 animate-pulse rounded" />
              </div>
            ) : linkedMentions.length > 0 ? (
              linkedMentions.map(file => <LinkItems key={file._id} file={file} defaultOpen={false} searchQuery={searchQuery} />)
            ) : (
              <p className="text-xs text-muted-foreground/60 italic ml-6">No linked mentions found.</p>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Unlinked */}
        <Collapsible key={`unlinked-${refreshKey}`} defaultOpen={backlinkExpand} className="group/unlinked">
          <CollapsibleTrigger className="flex items-center gap-2 mb-3 w-fit">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]/unlinked:rotate-90" />
            <span className="text-[13px] font-bold text-foreground/90 uppercase tracking-wide">Unlinked mentions</span>
            <span className="text-xs text-muted-foreground/50 font-mono">{unlinkedMentions.length}</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1">
            {!isLoading && unlinkedMentions.length > 0 ? (
              unlinkedMentions.map(file => <LinkItems key={file._id} file={file} defaultOpen={false} searchQuery={searchQuery} />)
            ) : (
              <p className="text-xs text-muted-foreground/60 italic ml-6">No unlinked mentions found.</p>
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};

export default FooterLinks;
