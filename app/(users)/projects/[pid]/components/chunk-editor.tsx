'use client';

import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import CodeMirror, { EditorView } from '@uiw/react-codemirror';
import { createTheme } from '@uiw/codemirror-themes';
import { chunkLivePreviewPlugin, chunkSplitsField, setSplitsEffect } from '@/features/editor/plugins';
import { tags as t } from '@lezer/highlight';
import { ContextMenu, ContextMenuTrigger } from '@/components/ui/context-menu';
import ChunkContextMenu from './context-menu/chunk';
import * as Y from 'yjs';

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
  splits: [number, number][];
  ydoc?: Y.Doc;
}

function generateDefaultSplits(docLength: number): [number, number][] {
  const defaults: [number, number][] = [];
  let start = 0;
  while (start < docLength) {
    const end = Math.min(start + 512, docLength);
    defaults.push([start, end]);
    start = end;
  }
  return defaults;
}

export function ChunkEditor({ text, splits, ydoc }: ChunkEditorProps) {
  const editorViewRef = useRef<EditorView | null>(null);
  const [cursorPos, setCursorPos] = useState(0);
  const [selection, setSelection] = useState<{ from: number; to: number } | null>(null);
  const [isReady, setIsReady] = useState(false);

  const draggingInfoRef = useRef<{ index: number; type: 'start' | 'end' } | null>(null);
  const latestSplitsRef = useRef<[number, number][] | null>(null);

  const broadcastToYjs = useCallback(
    (newSplits: [number, number][]) => {
      if (ydoc) {
        const ymap = ydoc.getMap<[number, number][]>('chunk-state');
        ymap.set('splits', newSplits);
      }
    },
    [ydoc]
  );

  useEffect(() => {
    if (!ydoc) return;
    const ymap = ydoc.getMap<[number, number][]>('chunk-state');

    const handleRemoteChange = (event: Y.YMapEvent<[number, number][]>) => {
      if (!event.transaction.local) {
        const remoteSplits = ymap.get('splits');
        if (remoteSplits && editorViewRef.current) {
          editorViewRef.current.dispatch({ effects: setSplitsEffect.of(remoteSplits) });
        }
      }
    };

    ymap.observe(handleRemoteChange);
    return () => ymap.unobserve(handleRemoteChange);
  }, [ydoc]);

  const syncSplitsToEditor = useCallback(
    (view: EditorView, currentSplits: [number, number][]) => {
      const docLength = view.state.doc.length;
      let displaySplits = currentSplits;

      if (ydoc) {
        const ymap = ydoc.getMap<[number, number][]>('chunk-state');
        const savedYjsSplits = ymap.get('splits');

        if (savedYjsSplits && savedYjsSplits.length > 0) {
          displaySplits = savedYjsSplits;
        }
      }

      if (displaySplits.length === 0 && docLength > 0) {
        displaySplits = generateDefaultSplits(docLength);
      }

      view.dispatch({ effects: setSplitsEffect.of(displaySplits) });
    },
    [ydoc]
  );

  useEffect(() => {
    const view = editorViewRef.current;
    if (view && draggingInfoRef.current === null) {
      syncSplitsToEditor(view, splits);
    }
  }, [splits, text, syncSplitsToEditor]);

  useEffect(() => {
    const handleDragStart = (e: Event) => {
      const customEvent = e as CustomEvent;
      draggingInfoRef.current = { index: customEvent.detail.index, type: customEvent.detail.type };
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    };

    const handleMouseMove = (e: MouseEvent) => {
      const view = editorViewRef.current;
      const draggingInfo = draggingInfoRef.current;

      if (!draggingInfo || !view) return;

      const pos = view.posAtCoords({ x: e.clientX, y: e.clientY });
      if (pos === null) return;

      const currentSplits = view.state.field(chunkSplitsField);
      const docLength = view.state.doc.length;
      const { index, type } = draggingInfo;

      let nextSplits = [...currentSplits.map(s => [...s] as [number, number])];
      const [start, end] = nextSplits[index];

      let clampedPos = pos;

      if (type === 'start') {
        const prevEnd = index > 0 ? nextSplits[index - 1][1] : 0;
        const sizeLimit = end - 512;
        const limitPos = Math.max(prevEnd, sizeLimit);
        clampedPos = Math.max(limitPos, Math.min(pos, end));
        nextSplits[index][0] = clampedPos;
      } else {
        const nextStart = index < nextSplits.length - 1 ? nextSplits[index + 1][0] : docLength;
        const sizeLimit = start + 512;
        const limitPos = Math.min(nextStart, sizeLimit);
        clampedPos = Math.max(start, Math.min(pos, limitPos));
        nextSplits[index][1] = clampedPos;
      }

      const draggedChunk = nextSplits[index];
      nextSplits = nextSplits.filter(s => s[0] !== s[1]);

      if (draggedChunk[0] === draggedChunk[1]) {
        draggingInfoRef.current = null;
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
      } else {
        draggingInfoRef.current!.index = nextSplits.indexOf(draggedChunk);
      }

      view.dispatch({ effects: setSplitsEffect.of(nextSplits) });

      latestSplitsRef.current = nextSplits;
    };

    const handleMouseUp = () => {
      draggingInfoRef.current = null;
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';

      if (latestSplitsRef.current) {
        broadcastToYjs(latestSplitsRef.current);
        latestSplitsRef.current = null; // reset
      }
    };

    const handleContextMenuSave = (e: Event) => {
      const customEvent = e as CustomEvent;
      broadcastToYjs(customEvent.detail.splits);
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
  }, [broadcastToYjs]);

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
    <div className="relative w-full h-full">
      {!isReady && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-white/10 border-t-white/80 rounded-full animate-spin" />
            <div className="text-sm tracking-widest text-[#d4d4d4] animate-pulse">MAPPING CHUNKS...</div>
          </div>
        </div>
      )}

      <ContextMenu modal={false}>
        <ContextMenuTrigger className="block h-full w-full">
          <div className="w-full h-full bg-background overflow-y-auto">
            <CodeMirror
              value={text}
              extensions={extensions}
              theme={myOwnDarkTheme}
              basicSetup={false}
              className="w-full h-full text-[#d4d4d4] font-sans tracking-widest text-[11px] leading-6 whitespace-pre-wrap"
              onCreateEditor={view => {
                editorViewRef.current = view;

                syncSplitsToEditor(view, splits);

                requestAnimationFrame(() => {
                  setTimeout(() => setIsReady(true), 100);
                });
              }}
            />
          </div>
        </ContextMenuTrigger>
        <ChunkContextMenu editorViewRef={editorViewRef} cursorPos={cursorPos} selection={selection} />
      </ContextMenu>
    </div>
  );
}
