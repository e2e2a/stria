'use client';
import React, { useMemo, useRef, useEffect, useState } from 'react';
import CodeMirror, { EditorView } from '@uiw/react-codemirror';
import { createTheme } from '@uiw/codemirror-themes';
import { chunkLivePreviewPlugin, chunkSplitsField, setSplitsEffect } from '@/features/editor/plugins';
import { tags as t } from '@lezer/highlight';
import { ContextMenu, ContextMenuTrigger } from '@/components/ui/context-menu';
import ChunkContextMenu from './context-menu/chunk';
import { getFullSplits } from '@/features/editor/decorations';

const myOwnDarkTheme = createTheme({
  theme: 'dark',
  settings: {
    background: '#191d24',
    foreground: '#d4d4d4',
    caret: '#ffffff',
    selectionMatch: '#3a3a3a',
    gutterBackground: '#191d24',
    lineHighlight: '#ffffff0f',
  },
  styles: [
    { tag: [t.keyword], color: '#569cd6' },
    { tag: [t.string], color: '#ce9178' },
    { tag: [t.comment], color: '#6a9955', fontStyle: 'italic' },
    { tag: [t.variableName], color: '#9cdcfe' },
    { tag: [t.function(t.variableName), t.propertyName], color: '#dcdcaa' },
    { tag: [t.typeName, t.className], color: '#4ec9b0' },
    { tag: [t.number, t.bool, t.null, t.atom], color: '#b5cea8' },
    { tag: t.operator, color: '#d4d4d4' },
    { tag: [t.heading], color: '#dcdcaa', fontWeight: 'bold' },
  ],
});

interface ChunkEditorProps {
  text: string;
  splits: number[];
  onSplitsChange: (newSplits: number[]) => void;
}

export function ChunkEditor({ text, splits, onSplitsChange }: ChunkEditorProps) {
  const editorViewRef = useRef<EditorView | null>(null);
  const draggingIndexRef = useRef<number | null>(null);
  const [cursorPos, setCursorPos] = useState(0);
  const [selection, setSelection] = useState<{ from: number; to: number } | null>(null);

  const onSplitsChangeRef = useRef(onSplitsChange);
  useEffect(() => {
    onSplitsChangeRef.current = onSplitsChange;
  }, [onSplitsChange]);

  useEffect(() => {
    const view = editorViewRef.current;
    if (view && draggingIndexRef.current === null) {
      view.dispatch({ effects: setSplitsEffect.of(splits) });
    }
  }, [splits]);

  useEffect(() => {
    const handleDragStart = (e: Event) => {
      const customEvent = e as CustomEvent;
      draggingIndexRef.current = customEvent.detail.index;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    };
    const handleMouseMove = (e: MouseEvent) => {
      const view = editorViewRef.current;
      const draggingIndex = draggingIndexRef.current;

      if (draggingIndex === null || !view) return;

      const pos = view.posAtCoords({ x: e.clientX, y: e.clientY });
      if (pos === null) return;

      // 1. Read ONLY the custom splits saved in DB
      const currentCustomSplits = view.state.field(chunkSplitsField);
      const docLength = view.state.doc.length;

      // 2. Calculate visual splits dynamically for the UI
      const allSplits = getFullSplits(currentCustomSplits, docLength);

      const prevSplit = draggingIndex > 0 ? allSplits[draggingIndex - 1] : 0;
      const nextSplit = draggingIndex < allSplits.length - 1 ? allSplits[draggingIndex + 1] : docLength;

      // FREE ROAM: Mouse moves freely between adjacent boundaries
      const clampedPos = Math.max(prevSplit, Math.min(pos, nextSplit));
      const oldPos = allSplits[draggingIndex];

      if (oldPos !== clampedPos) {
        let nextCustomSplits = [...currentCustomSplits];

        // 3. 0-CHARACTER REMOVAL
        if (clampedPos === prevSplit || clampedPos === nextSplit) {
          // Filter out the old custom split
          nextCustomSplits = nextCustomSplits.filter(s => s !== oldPos);

          view.dispatch({ effects: setSplitsEffect.of(nextCustomSplits) });
          onSplitsChangeRef.current(nextCustomSplits); // Save clean array

          draggingIndexRef.current = null;
          document.body.style.cursor = 'default';
          document.body.style.userSelect = 'auto';
        } else {
          // 4. NORMAL DRAG
          if (nextCustomSplits.includes(oldPos)) {
            // Updating an existing custom split
            nextCustomSplits = nextCustomSplits.map(s => (s === oldPos ? clampedPos : s));
          } else {
            // User grabbed an auto-split! It now becomes a Custom split.
            nextCustomSplits.push(clampedPos);
          }

          nextCustomSplits.sort((a, b) => a - b);

          view.dispatch({ effects: setSplitsEffect.of(nextCustomSplits) });
          onSplitsChangeRef.current(nextCustomSplits); // Save clean array

          // Keep handle attached to mouse dynamically on the visual layer
          const newAllSplits = getFullSplits(nextCustomSplits, docLength);
          draggingIndexRef.current = newAllSplits.indexOf(clampedPos);
        }
      }
    };
    const handleMouseUp = () => {
      draggingIndexRef.current = null;
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    const handleContextMenuSave = (e: Event) => {
      const customEvent = e as CustomEvent;
      onSplitsChangeRef.current(customEvent.detail.splits);
    };

    window.addEventListener('chunk-drag-start', handleDragStart);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('chunk-splits-changed', handleContextMenuSave);

    return () => {
      window.removeEventListener('chunk-drag-start', handleDragStart);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('chunk-splits-changed', handleContextMenuSave);
    };
  }, []);

  const extensions = useMemo(() => {
    return [
      myOwnDarkTheme,
      EditorView.lineWrapping,
      EditorView.editable.of(false),
      chunkSplitsField,
      chunkLivePreviewPlugin,
      EditorView.domEventHandlers({
        contextmenu: (event, view) => {
          const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
          const { from, to, empty } = view.state.selection.main;
          if (pos !== null) {
            setCursorPos(pos);
            setSelection(empty ? null : { from, to });
          }
          return false;
        },
      }),
    ];
  }, []);

  return (
    <ContextMenu modal={false}>
      <ContextMenuTrigger className="block h-full w-full">
        <div className="w-full h-full bg-background">
          <CodeMirror
            value={text}
            extensions={extensions}
            theme={myOwnDarkTheme}
            basicSetup={false}
            className="w-full h-full text-[#d4d4d4] font-sans tracking-widest text-[11px] leading-6 whitespace-pre-wrap"
            onCreateEditor={view => {
              editorViewRef.current = view;
              view.dispatch({ effects: setSplitsEffect.of(splits) });
            }}
          />
        </div>
      </ContextMenuTrigger>
      <ChunkContextMenu editorViewRef={editorViewRef} cursorPos={cursorPos} selection={selection} />
    </ContextMenu>
  );
}
