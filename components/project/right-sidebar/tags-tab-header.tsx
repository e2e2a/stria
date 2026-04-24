import React from 'react';
import { Search, ChevronsDownUp, ChevronsUpDown, X, FolderTree } from 'lucide-react';
import { TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { IconTooltip } from '../icon-tooltip';

interface TagsTabHeaderProps {
  isSearchingInTags: boolean;
  setIsSearchingInTags: (val: boolean) => void;
  searchQueryInTags: string;
  setSearchQueryInTags: (val: string) => void;
  defaultExpand: boolean;
  setDefaultExpand: (val: boolean) => void;
  handleToggleExpand: (expand: boolean) => void;
  // NEW: Props for nested toggle
  isNestedView: boolean;
  setIsNestedView: (val: boolean) => void;
}

export const TagsTabHeader = ({
  isSearchingInTags,
  setIsSearchingInTags,
  searchQueryInTags,
  setSearchQueryInTags,
  defaultExpand,
  setDefaultExpand,
  handleToggleExpand,
  isNestedView,
  setIsNestedView,
}: TagsTabHeaderProps) => {
  const onSearchChange = (val: string) => {
    setSearchQueryInTags(val);
    if (val.trim().length > 0) {
      setDefaultExpand(true); // Auto-expand when typing
    }
  };

  return (
    <TabsContent className="h-full min-h-0 w-full px-3" value="tags">
      <div className="bg-transparent w-full h-full flex items-center gap-x-1 justify-start">
        {!isSearchingInTags ? (
          <>
            <IconTooltip label={'Search Tags'}>
              <Button onClick={() => setIsSearchingInTags(true)} className="px-2! py-1! border border-transparent" variant="ghost">
                <Search className="h-6! w-6!" />
              </Button>
            </IconTooltip>

            {/* NEW: Nested / Flat View Toggle */}
            <IconTooltip label={isNestedView ? 'Show Flat List' : 'Show Nested Tree'}>
              <Button
                onClick={() => setIsNestedView(!isNestedView)}
                className={`px-2! py-1! border border-transparent transition-colors ${isNestedView ? 'bg-accent/50 text-accent-foreground' : ''}`}
                variant="ghost"
              >
                <FolderTree className="h-6! w-6!" />
              </Button>
            </IconTooltip>

            {/* Only show expand/collapse if we are in nested view */}
            {isNestedView &&
              (defaultExpand ? (
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
              ))}
          </>
        ) : (
          <div className="relative px-1 w-full gap-x-2 animate-in slide-in-from-left-1 duration-800">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              autoFocus
              placeholder="Filter tags..."
              value={searchQueryInTags}
              onChange={e => onSearchChange(e.target.value)}
              className="w-full bg-background/50 border border-border/80 rounded-md py-1.5 pl-9 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
            />
            <button
              onClick={() => {
                setIsSearchingInTags(false);
                setSearchQueryInTags('');
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
