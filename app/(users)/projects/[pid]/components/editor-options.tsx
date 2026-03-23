'use client';

import * as React from 'react';
import { BookOpen, Check, CodeXml, EllipsisVertical, Layers, PencilLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Command, CommandGroup, CommandItem } from '@/components/ui/command';
import { EditorState, EditorView } from '@uiw/react-codemirror';
import { chunkModeFacet, sourceModeField, toggleSourceMode } from '@/features/editor/plugins';
import { chunkModeCompartment, editableCompartment } from './MarkdownSection';
import { Separator } from '@/components/ui/separator';

export function EditorOptions({ editorViewRef }: { editorViewRef: React.RefObject<EditorView | null> }) {
  const [open, setOpen] = React.useState(false);

  const getSnapshot = React.useCallback(() => {
    const view = editorViewRef.current;
    if (!view) return 'false-false';

    const isReadOnly = view.state.facet(EditorState.readOnly);
    const isSourceMode = view.state.field(sourceModeField, false);
    const isChunkActive = view.dom.classList.contains('cm-chunk-mode-active');
    return `${isReadOnly}-${isSourceMode}-${isChunkActive}`;
  }, [editorViewRef]);

  const subscribe = React.useCallback((callback: () => void) => {
    window.addEventListener('cm-state-refresh', callback);
    return () => window.removeEventListener('cm-state-refresh', callback);
  }, []);

  const snapshot = React.useSyncExternalStore(subscribe, getSnapshot, () => 'false-false');

  const [isReadOnly, isSourceMode, isChunkActive] = snapshot.split('-').map(v => v === 'true');

  const notifyStateChange = () => {
    window.dispatchEvent(new CustomEvent('cm-state-refresh'));
  };

  const toggleSource = (view: EditorView) => {
    view.dispatch({
      effects: toggleSourceMode.of(!isSourceMode),
    });
    notifyStateChange();
  };

  const toggleViewMode = (view: EditorView) => {
    const nextState = !isReadOnly;
    view.dispatch({
      effects: editableCompartment.reconfigure(EditorState.readOnly.of(nextState)),
    });

    if (nextState) {
      view.scrollDOM.classList.add('cm-readonly');
      view.contentDOM.blur();
    } else {
      view.scrollDOM.classList.remove('cm-readonly');
      view.focus();
    }
    notifyStateChange();
  };

  const toggleChunk = (view: EditorView) => {
    const isCurrentlyActive = view.dom.classList.contains('cm-chunk-mode-active');
    const nextState = !isCurrentlyActive;

    view.dispatch({
      effects: chunkModeCompartment.reconfigure(
        nextState ? chunkModeFacet.of(true) : [] // Plugin turns on/off here
      ),
    });

    view.dom.classList.toggle('cm-chunk-mode-active', nextState);
    notifyStateChange();
  };

  return (
    <div className="flex gap-2 items-center">
      <Button
        variant="ghost"
        onClick={() => {
          if (editorViewRef.current) toggleViewMode(editorViewRef.current);
        }}
        tabIndex={-1}
        className="w-8 h-8 flex items-center text-foreground"
      >
        {isReadOnly ? <PencilLine className="w-6! h-6! opacity-50" /> : <BookOpen className="w-6! h-6! opacity-50" />}
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
                  if (editorViewRef.current) toggleViewMode(editorViewRef.current);
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
                    if (editorViewRef.current) toggleSource(editorViewRef.current);
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
              <CommandItem
                onSelect={() => {
                  if (editorViewRef.current) toggleChunk(editorViewRef.current);
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
              <Separator />
            </CommandGroup>
          </Command>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
