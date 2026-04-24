import React from 'react';
import { Search, ChevronsDownUp, ChevronsUpDown, X } from 'lucide-react';
import { TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { IconTooltip } from '../icon-tooltip';

interface OutlineTabHeaderProps {
  isSearchingInOutline: boolean;
  setIsSearchingInOutline: (val: boolean) => void;
  searchQueryInOutline: string;
  setSearchQueryInOutline: (val: string) => void;
  defaultExpand: boolean;
  setDefaultExpand: (val: boolean) => void;
  setRefreshKey: React.Dispatch<React.SetStateAction<number>>;
  handleToggleExpand: (expand: boolean) => void;
}

export const OutlineTabHeader = ({
  isSearchingInOutline,
  setIsSearchingInOutline,
  searchQueryInOutline,
  setSearchQueryInOutline,
  defaultExpand,
  setDefaultExpand,
  setRefreshKey,
  handleToggleExpand,
}: OutlineTabHeaderProps) => {
  // Your exact logic transferred here
  const onSearchChange = (val: string) => {
    setSearchQueryInOutline(val);
    if (val.trim().length > 0) {
      setDefaultExpand(true);
      setRefreshKey(k => k + 1);
    }
  };

  return (
    <TabsContent className="h-full min-h-0 w-full px-3" value="outline">
      <div className="bg-transparent w-full h-full flex items-center gap-x-1 justify-start">
        {!isSearchingInOutline ? (
          <>
            <IconTooltip label={'Search'}>
              <Button onClick={() => setIsSearchingInOutline(true)} className="px-2! py-1! border border-transparent" variant="ghost">
                <Search className="h-6! w-6!" />
              </Button>
            </IconTooltip>
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
          </>
        ) : (
          <div className="relative px-1 w-full gap-x-2 animate-in slide-in-from-left-1 duration-800">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              autoFocus
              placeholder="Filter..."
              value={searchQueryInOutline}
              onChange={e => onSearchChange(e.target.value)}
              className="w-full bg-background/50 border border-border/80 rounded-md py-1.5 pl-9 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
            />
            <button
              onClick={() => {
                setIsSearchingInOutline(false);
                setSearchQueryInOutline('');
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
