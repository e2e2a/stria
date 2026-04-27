import { EditorView } from '@uiw/react-codemirror';
import React, { useState } from 'react';
import {
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from '@/components/ui/context-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { editCalloutType, handleEdit, removeCallout } from '@/lib/client/markdown/editor-context-menu/callout';

const calloutTypes = [
  'info',
  'Important',
  'Tip',
  'Success',
  'Question',
  'Warning',
  'Example',
  'Qoute',
  'abstract',
  'summary',
  'tldr',
  'todo',
  'hint',
  'check',
  'done',
  'faq',
  'help',
  'caution',
  'attention',
  'failure',
  'fail',
  'missing',
  'danger',
  'error',
  'bug',
  'cite',
];
const CalloutContextMenu = ({ cursorPos, editorViewRef }: { cursorPos: number; editorViewRef: React.RefObject<EditorView | null> }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <ContextMenuContent>
        <ContextMenuGroup>
          <ContextMenuItem onClick={() => handleEdit({ editorViewRef, cursorPos })}>Edit</ContextMenuItem>

          <ContextMenuSeparator />

          <ContextMenuSub>
            <ContextMenuSubTrigger className="gap-x-2">Callout type</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuGroup>
                {calloutTypes.slice(0, 8).map(type => (
                  <ContextMenuItem onSelect={() => editCalloutType({ editorViewRef, cursorPos, newType: type })} key={type}>
                    {type}
                  </ContextMenuItem>
                ))}
                <ContextMenuItem onSelect={() => setOpen(true)}>Other...</ContextMenuItem>

                <ContextMenuItem onSelect={() => removeCallout({ editorViewRef, cursorPos })}>None</ContextMenuItem>
              </ContextMenuGroup>
            </ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuGroup>
      </ContextMenuContent>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-[525px] top-[10%] translate-y-0 rounded-md">
          <Command>
            <DialogHeader className="p-0!">
              <DialogTitle className="flex gap-2 items-center">
                <CommandInput placeholder="Callout type..." className="h-9 flex-1" />
                <X className="cursor-pointer" onClick={() => setOpen(false)} />
              </DialogTitle>
            </DialogHeader>

            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {calloutTypes.map(type => (
                  <CommandItem
                    key={type}
                    value={type}
                    onSelect={() => {
                      editCalloutType({ editorViewRef, cursorPos, newType: type });
                      setOpen(false);
                    }}
                    className="capitalize"
                  >
                    {type}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CalloutContextMenu;
