'use client';

import * as React from 'react';
import { BookOpen, Check, CodeXml, EllipsisVertical, Layers, PencilLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Command, CommandGroup, CommandItem } from '@/components/ui/command';
import { EditorView } from '@uiw/react-codemirror';
import { sourceModeField, toggleSourceMode } from '@/features/editor/plugins';
import { Separator } from '@/components/ui/separator';

export function EditorOptions({
  editorViewRef,
  isReadOnly,
  setIsReadOnly,
  isChunkActive,
  setIsChunkActive,
  canEditChunk,
}: {
  editorViewRef: React.RefObject<EditorView | null>;
  isReadOnly: boolean;
  setIsReadOnly: (val: boolean | ((prev: boolean) => boolean)) => void;
  isChunkActive: boolean;
  setIsChunkActive: (val: boolean | ((prev: boolean) => boolean)) => void;
  canEditChunk: boolean;
}) {
  const [open, setOpen] = React.useState(false);

  const getSnapshot = React.useCallback(() => {
    const view = editorViewRef.current;
    if (!view) return false;
    return view.state.field(sourceModeField, false);
  }, [editorViewRef]);

  const subscribe = React.useCallback((callback: () => void) => {
    window.addEventListener('cm-state-refresh', callback);
    return () => window.removeEventListener('cm-state-refresh', callback);
  }, []);

  const isSourceMode = React.useSyncExternalStore(subscribe, getSnapshot, () => false);

  const toggleSource = () => {
    const view = editorViewRef.current;
    if (view) {
      view.dispatch({ effects: toggleSourceMode.of(!isSourceMode) });
      window.dispatchEvent(new CustomEvent('cm-state-refresh'));
    }
  };

  const toggleViewMode = () => {
    setIsReadOnly(prev => {
      const nextState = !prev;
      const view = editorViewRef.current;
      if (view) {
        if (nextState) {
          view.scrollDOM.classList.add('cm-readonly');
          view.contentDOM.blur();
        } else {
          view.scrollDOM.classList.remove('cm-readonly');
          view.focus();
        }
      }
      return nextState;
    });
  };

  const toggleChunk = () => {
    setIsChunkActive(prev => !prev);
  };

  return (
    <div className="flex gap-2 items-center">
      <Button variant="ghost" onClick={toggleViewMode} tabIndex={-1} className="w-8 h-8 flex items-center text-foreground">
        {isReadOnly ? <PencilLine className="w-5! h-5! opacity-50" /> : <BookOpen className="w-5! h-5! opacity-50" />}
      </Button>

      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger tabIndex={-1} asChild>
          <Button variant="ghost" className="w-8 h-8 flex items-center text-foreground">
            <EllipsisVertical className="w-6 h-6 opacity-50" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-[200px] p-0">
          <Command>
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  toggleViewMode();
                  setOpen(false);
                }}
                className="flex justify-between items-center cursor-pointer"
              >
                <div className="flex items-center">
                  <BookOpen className="mr-2 h-5 w-5" />
                  <span>Reading View</span>
                </div>
                <Check className={cn('h-5 w-5', isReadOnly ? 'opacity-100' : 'opacity-0')} />
              </CommandItem>

              {!isReadOnly && (
                <CommandItem
                  onSelect={() => {
                    toggleSource();
                    setOpen(false);
                  }}
                  className="flex justify-between items-center cursor-pointer"
                >
                  <div className="flex items-center">
                    <CodeXml className="mr-2 h-5 w-5" />
                    <span>Source Mode</span>
                  </div>
                  <Check className={cn('h-5 w-5', isSourceMode ? 'opacity-100' : 'opacity-0')} />
                </CommandItem>
              )}
              {canEditChunk && (
                <CommandItem
                  onSelect={() => {
                    toggleChunk();
                    setOpen(false);
                  }}
                  className="flex justify-between items-center cursor-pointer py-2"
                >
                  <div className="flex items-center">
                    <Layers className="mr-2 h-4 w-4" />
                    <span className="text-xs font-medium">Chunk Mode (512 chars)</span>
                  </div>
                  <Check className={cn('h-4 w-4 text-blue-400', isChunkActive ? 'opacity-100' : 'opacity-0')} />
                </CommandItem>
              )}

              <Separator />
            </CommandGroup>
          </Command>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
