import React from 'react';
import { EditorView } from '@uiw/react-codemirror';
import { ContextMenuContent, ContextMenuGroup, ContextMenuItem, ContextMenuSeparator } from '@/components/ui/context-menu';
import { chunkSplitsField, setSplitsEffect } from '@/features/editor/plugins';

interface ChunkContextMenuProps {
  editorViewRef: React.RefObject<EditorView | null>;
  cursorPos: number;
  selection: { from: number; to: number } | null;
}

const ChunkContextMenu = ({ editorViewRef, cursorPos, selection }: ChunkContextMenuProps) => {
  const handleUpdateSplits = (newCustomSplits: number[]) => {
    const view = editorViewRef.current;
    if (!view) return;

    const uniqueSortedSplits = Array.from(new Set(newCustomSplits)).sort((a, b) => a - b);

    view.dispatch({ effects: setSplitsEffect.of(uniqueSortedSplits) });

    window.dispatchEvent(
      new CustomEvent('chunk-splits-changed', {
        detail: { splits: uniqueSortedSplits },
      })
    );
  };

  const handleInsertSplit = () => {
    const view = editorViewRef.current;
    if (!view) return;
    const currentSplits = view.state.field(chunkSplitsField, false) || [];
    handleUpdateSplits([...currentSplits, cursorPos]);
  };

  const handleInsertFromSelection = () => {
    const view = editorViewRef.current;
    if (!view || !selection) return;

    const { from, to } = selection;
    const currentSplits = view.state.field(chunkSplitsField, false) || [];

    const newSplits = [...currentSplits, from, to];

    handleUpdateSplits(newSplits);
  };

  const handleRemoveSplit = () => {
    const view = editorViewRef.current;
    if (!view) return;
    const currentSplits = view.state.field(chunkSplitsField, false) || [];
    if (currentSplits.length === 0) return;

    const nearestSplit = currentSplits.reduce((prev, curr) => (Math.abs(curr - cursorPos) < Math.abs(prev - cursorPos) ? curr : prev));

    handleUpdateSplits(currentSplits.filter(s => s !== nearestSplit));
  };

  const handleClearAll = () => {
    handleUpdateSplits([]);
  };

  return (
    <ContextMenuContent>
      <ContextMenuGroup>
        <ContextMenuItem onSelect={handleInsertSplit}>Insert Boundary Here</ContextMenuItem>

        <ContextMenuItem onSelect={handleInsertFromSelection} disabled={!selection}>
          Create Chunk(s) from Selection
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem onSelect={handleRemoveSplit}>Remove Nearest Custom Boundary</ContextMenuItem>

        <ContextMenuItem onSelect={handleClearAll} className="text-red-500 focus:bg-red-500/10 focus:text-red-500">
          Clear All Custom Boundaries
        </ContextMenuItem>
      </ContextMenuGroup>
    </ContextMenuContent>
  );
};

export default ChunkContextMenu;
