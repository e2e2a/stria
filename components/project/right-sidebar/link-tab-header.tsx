import React from 'react';
import { Search, ArrowUpNarrowWide, ChevronsDownUp, ChevronsUpDown, X } from 'lucide-react';
import { TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { IconTooltip } from '../icon-tooltip';

export type LinkSortMode = 'name-asc' | 'name-desc' | 'freq-high' | 'freq-low';

interface LinkTabHeaderProps {
  isSearching: boolean;
  setIsSearching: (val: boolean) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  defaultExpand: boolean;
  setDefaultExpand: (val: boolean) => void;
  setRefreshKey: React.Dispatch<React.SetStateAction<number>>;
  handleToggleExpand: (expand: boolean) => void;
  sortMode: LinkSortMode;
  setSortMode: (mode: LinkSortMode) => void;
}

export const LinkTabHeader = ({
  isSearching,
  setIsSearching,
  searchQuery,
  setSearchQuery,
  defaultExpand,
  setDefaultExpand,
  setRefreshKey,
  handleToggleExpand,
  sortMode,
  setSortMode,
}: LinkTabHeaderProps) => {
  const onSearchChange = (val: string) => {
    setSearchQuery(val);
    if (val.trim().length > 0) {
      setDefaultExpand(true);
      setRefreshKey(k => k + 1);
    }
  };

  return (
    <TabsContent className="h-full min-h-0 w-full px-3" value="link">
      <div className="bg-transparent w-full h-full flex items-center gap-x-1 justify-start">
        {!isSearching ? (
          <>
            <DropdownMenu>
              <IconTooltip label={'Change sort order'}>
                <DropdownMenuTrigger asChild>
                  <Button className="px-2! py-1! border border-transparent" variant="ghost">
                    <ArrowUpNarrowWide className="h-6! w-6!" />
                  </Button>
                </DropdownMenuTrigger>
              </IconTooltip>
              <DropdownMenuContent align="start" className="w-56 bg-[#1e1e20] border-white/10 text-white">
                <DropdownMenuItem onClick={() => setSortMode('name-asc')} className="text-xs flex justify-between">
                  File name (A to Z) {sortMode === 'name-asc' && <span className="text-primary">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortMode('name-desc')} className="text-xs flex justify-between">
                  File name (Z to A) {sortMode === 'name-desc' && <span className="text-primary">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuItem onClick={() => setSortMode('freq-high')} className="text-xs flex justify-between">
                  Mentions (most first) {sortMode === 'freq-high' && <span className="text-primary">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortMode('freq-low')} className="text-xs flex justify-between">
                  Mentions (least first) {sortMode === 'freq-low' && <span className="text-primary">✓</span>}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {defaultExpand ? (
              <IconTooltip label={'Collapse All'}>
                <Button onClick={() => handleToggleExpand(false)} className="px-2! py-1! border border-transparent" variant="ghost">
                  <ChevronsDownUp className="h-6! w-6!" />
                </Button>
              </IconTooltip>
            ) : (
              <IconTooltip label={'Expand All'}>
                <Button onClick={() => handleToggleExpand(true)} className="px-2! py-1! border border-transparent" variant="ghost">
                  <ChevronsUpDown className="h-6! w-6!" />
                </Button>
              </IconTooltip>
            )}

            <IconTooltip label={'Search'}>
              <Button onClick={() => setIsSearching(true)} className="px-2! py-1! border border-transparent" variant="ghost">
                <Search className="h-6! w-6!" />
              </Button>
            </IconTooltip>
          </>
        ) : (
          <div className="relative px-1 w-full gap-x-2 animate-in slide-in-from-left-1 duration-800">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              autoFocus
              placeholder="Filter files..."
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              className="w-full bg-background/50 border border-border/80 rounded-md py-1.5 pl-9 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
            />
            <button
              onClick={() => {
                setIsSearching(false);
                setSearchQuery('');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-foreground"
            >
              <X className="h-4 w-4 cursor-pointer" />
            </button>
          </div>
        )}
      </div>
    </TabsContent>
  );
};
