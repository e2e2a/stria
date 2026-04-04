import React from 'react';
import { EditorView } from '@uiw/react-codemirror';
import { ContextMenuContent, ContextMenuGroup, ContextMenuItem, ContextMenuSeparator } from '@/components/ui/context-menu';
import { chunkSplitsField, setSplitsEffect } from '@/features/editor/plugins';

interface ChunkContextMenuProps {
  editorViewRef: React.RefObject<EditorView | null>;
  cursorPos: number;
  selection: { from: number; to: number } | null;
}

const sliceAndInsert = (existingSplits: [number, number][], from: number, to: number): [number, number][] => {
  const result: [number, number][] = [];
  const newChunks: [number, number][] = [];

  if (from < to) {
    let curr = from;
    while (curr < to) {
      const next = Math.min(curr + 512, to);
      newChunks.push([curr, next]);
      curr = next;
    }
  }

  for (const [A, B] of existingSplits) {
    if (B <= from || A >= to) {
      result.push([A, B]);
    } else {
      if (A < from) result.push([A, from]);
      if (B > to) result.push([to, B]);
    }
  }

  result.push(...newChunks);
  return result;
};

const ChunkContextMenu = ({ editorViewRef, cursorPos, selection }: ChunkContextMenuProps) => {
  const handleUpdateSplits = (newCustomSplits: [number, number][]) => {
    const view = editorViewRef.current;
    if (!view) return;

    const validSplits = newCustomSplits.filter(s => s[0] < s[1]).sort((a, b) => a[0] - b[0]);
    // LOGGING: Specific log including the new state of chunks
    console.log('user update chunk splits and db update', validSplits);
    view.dispatch({ effects: setSplitsEffect.of(validSplits) });

    window.dispatchEvent(new CustomEvent('chunk-splits-changed', { detail: { splits: validSplits } }));
  };

  const handleInsertSplit = () => {
    const view = editorViewRef.current;
    if (!view) return;
    const currentSplits = view.state.field(chunkSplitsField, false) || [];
    const docLength = view.state.doc.length;

    const isInsideChunk = currentSplits.some(([start, end]) => cursorPos > start && cursorPos < end);

    if (isInsideChunk) {
      const newSplits = sliceAndInsert(currentSplits, cursorPos, cursorPos);
      handleUpdateSplits(newSplits);
    } else {
      let nextLimit = docLength;
      for (const [start] of currentSplits) {
        if (start >= cursorPos) nextLimit = Math.min(nextLimit, start);
      }
      const newEnd = Math.min(cursorPos + 512, nextLimit);

      if (cursorPos < newEnd) handleUpdateSplits([...currentSplits, [cursorPos, newEnd]]);
    }
  };

  const handleInsertFromSelection = () => {
    const view = editorViewRef.current;
    if (!view || !selection) return;

    const currentSplits = view.state.field(chunkSplitsField, false) || [];
    const newSplits = sliceAndInsert(currentSplits, selection.from, selection.to);
    handleUpdateSplits(newSplits);
  };

  const handleRemoveChunk = () => {
    const view = editorViewRef.current;
    if (!view) return;
    const currentSplits = view.state.field(chunkSplitsField, false) || [];

    // Simply filter out the chunk that the user right-clicked inside of
    const nextSplits = currentSplits.filter(([start, end]) => !(cursorPos >= start && cursorPos <= end));
    handleUpdateSplits(nextSplits);
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

        {/* Updated label to reflect the new block-based architecture */}
        <ContextMenuItem onSelect={handleRemoveChunk}>Remove Chunk</ContextMenuItem>

        <ContextMenuItem onSelect={handleClearAll} className="text-red-500 focus:bg-red-500/10 focus:text-red-500">
          Clear All Chunks
        </ContextMenuItem>
      </ContextMenuGroup>
    </ContextMenuContent>
  );
};

export default ChunkContextMenu;
