import { Search, ArrowUpNarrowWide, X } from 'lucide-react';
import { TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface IProps {
  isSearchingInProperty: boolean;
  setIsSearchingInProperty: (val: boolean) => void;
  searchQueryInProperty: string;
  setSearchQueryInProperty: (val: string) => void;
  propertySortMode: 'name-asc' | 'name-desc' | 'freq-high' | 'freq-low';
  setPropertySortMode: (mode: 'name-asc' | 'name-desc' | 'freq-high' | 'freq-low') => void;
}
export const PropertyTabHeader = ({
  isSearchingInProperty,
  setIsSearchingInProperty,
  searchQueryInProperty,
  setSearchQueryInProperty,
  propertySortMode,
  setPropertySortMode,
}: IProps) => {
  return (
    <TabsContent className="h-full min-h-0 w-full px-3" value="properties">
      <div className="bg-transparent w-full h-full flex items-center gap-x-1 justify-start">
        {!isSearchingInProperty ? (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="px-2! py-1! border border-transparent" variant="ghost" title="Change sort order">
                  <ArrowUpNarrowWide className="h-6! w-6!" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 bg-[#1e1e20] border-white/10 text-white">
                <DropdownMenuItem onClick={() => setPropertySortMode('name-asc')} className="text-xs flex justify-between">
                  Property name (A to Z) {propertySortMode === 'name-asc' && <span className="text-primary">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPropertySortMode('name-desc')} className="text-xs flex justify-between">
                  Property name (Z to A) {propertySortMode === 'name-desc' && <span className="text-primary">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuItem onClick={() => setPropertySortMode('freq-high')} className="text-xs flex justify-between">
                  Frequency (high to low) {propertySortMode === 'freq-high' && <span className="text-primary">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPropertySortMode('freq-low')} className="text-xs flex justify-between">
                  Frequency (low to high) {propertySortMode === 'freq-low' && <span className="text-primary">✓</span>}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={() => setIsSearchingInProperty(true)} className="px-2! py-1! border border-transparent" variant="ghost">
              <Search className="h-6! w-6!" />
            </Button>
          </>
        ) : (
          <div className="relative px-1 w-full gap-x-2 animate-in slide-in-from-left-1 duration-800">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Filter..."
              value={searchQueryInProperty}
              onChange={e => setSearchQueryInProperty(e.target.value)}
              className="w-full bg-background/50 border border-white/10 rounded-md py-1.5 pl-9 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
            />
            <button
              onClick={() => {
                setIsSearchingInProperty(false);
                setSearchQueryInProperty('');
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
