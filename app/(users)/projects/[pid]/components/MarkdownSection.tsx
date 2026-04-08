'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { drawSelection, dropCursor, EditorView, keymap } from '@codemirror/view';
import CodeMirror, { EditorState } from '@uiw/react-codemirror';
import { yCollab, yUndoManagerKeymap } from 'y-codemirror.next';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { createTheme } from '@uiw/codemirror-themes';
import { INode } from '@/types';
import { tags as t } from '@lezer/highlight';
import {
  chunkModeFacet,
  columnSelectionField,
  createEditorStatsPlugin,
  dragStatusField,
  lineLimitGuard,
  markdownLivePreviewField,
  permissionGuard,
  setupDragTracking,
  sourceModeField,
  tableSelectionHighlighter,
  viewportLinesField,
  viewportLinesPlugin,
} from '@/features/editor/plugins';
import { languages } from '@codemirror/language-data';
import {
  internalLinkClickHandler,
  internalLinkCompletion,
  linkClickHandler,
  selectAllToTop,
  tableBackspace,
  tableKeyboardHandler,
} from '@/features/editor/keymap';
import { HocuspocusProvider } from '@hocuspocus/provider';
import * as Y from 'yjs';
import { useTabStore } from '@/features/editor/stores/tabs';
import { useParams } from 'next/navigation';
import { EditorOptions } from './editor-options';
import { useNodeStore } from '@/features/editor/stores/nodes';
import { useProjectUIStore } from '@/features/editor/stores/project-ui';
import ContextMenuClient from './context-menu/context-menu-client';
import { useSession } from 'next-auth/react';
import FooterLinks from './footer-links';
import { EditorStatusBar } from './editor-status-bar';
import { useEditorEvents } from './use-editor-events';
import { ChunkEditor } from './chunk-editor';
import { cn } from '@/lib/utils';

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
    { tag: [t.typeName], color: '#4ec9b0' },
    { tag: [t.heading], color: '#dcdcaa', fontWeight: 'bold' },
    { tag: [t.atom, t.bool, t.number], color: '#b5cea8' },
  ],
});

function MarkdownSection({ node, isDirty, canEditNode, canEditChunk }: { node: INode; isDirty: boolean; canEditNode: boolean; canEditChunk: boolean }) {
  const { data } = useSession();
  const [synced, setSynced] = useState(false);
  const [instance, setInstance] = useState<{ ydoc: Y.Doc; provider: HocuspocusProvider } | null>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const markDirty = useTabStore(state => state.markDirty);
  const setActiveNode = useNodeStore(state => state.setActiveNode);
  const pid = useParams().pid as string;
  const [editorReady, setEditorReady] = useState(false);
  console.log('running');
  const [contextType, setContextType] = useState<'general' | 'callout'>('general');
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isChunkActive, setIsChunkActive] = useState(false);

  useEditorEvents(node._id, synced, editorViewRef, setIsReadOnly, setIsChunkActive);

  const providerRef = useRef<HocuspocusProvider | null>(null);

  useEffect(() => {
    const userId = data?.user?._id;
    if (!node?._id || !userId) return;

    if (providerRef.current && providerRef.current.configuration.name === node._id) return;

    if (providerRef.current) {
      providerRef.current.destroy();
    }

    const ydoc = new Y.Doc();
    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:1234';
    const provider = new HocuspocusProvider({
      url: WS_URL,
      name: node._id,
      document: ydoc,
      onSynced: () => {
        setSynced(true);
        provider.awareness?.setLocalState({
          user: { id: userId, name: data.user.email, color: '#ffffff' },
        });
      },
    });

    providerRef.current = provider;
    requestAnimationFrame(() => setInstance({ ydoc, provider }));
  }, [node?._id, data?.user?._id, data?.user?.email]);

  useEffect(() => {
    return () => {
      if (providerRef.current) {
        providerRef.current.destroy();
        providerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!canEditNode) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsReadOnly(true);

      const view = editorViewRef.current;
      if (view) {
        view.scrollDOM.classList.add('cm-readonly');
        view.contentDOM.blur();
      }
    }
  }, [canEditNode, setIsReadOnly]);

  const ytext = useMemo(() => instance?.ydoc.getText('codemirror'), [instance]);
  const undoManager = useMemo(() => {
    if (!ytext || !instance) return null;
    return new Y.UndoManager(ytext, {
      trackedOrigins: new Set([instance.provider?.awareness?.clientID]),
      captureTimeout: 200,
    });
  }, [ytext, instance]);

  const onDocChange = useMemo(() => {
    return EditorView.updateListener.of(update => {
      if (update.docChanged && update.transactions.some(tr => tr.isUserEvent('input') || tr.isUserEvent('delete')))
        if (!isDirty) markDirty(pid, node._id, true);
    });
  }, [markDirty, pid, node._id, isDirty]);

  const editorExtensions = useMemo(() => {
    if (!instance || !ytext || !undoManager) return [];

    return [
      EditorView.domEventHandlers({
        mousedown: event => {
          React.startTransition(() => setActiveNode(node._id));
          const target = event.target as HTMLElement;

          if (target.classList.contains('cm-hashtag')) {
            const tag = target.getAttribute('data-tag');
            if (tag) {
              useProjectUIStore.getState().setSearchQuery(`tag:${tag}`);
              useProjectUIStore.getState().setLeftSidebarTab('search');
            }
          }
        },
        focus: () => {
          React.startTransition(() => setActiveNode(node._id));
        },
        contextmenu: (event, view) => {
          const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
          if (pos !== null) {
            const line = view.state.doc.lineAt(pos);
            setContextType(line.text.trim().startsWith('[!') ? 'callout' : 'general');
          }
          return false;
        },
      }),
      internalLinkCompletion,
      internalLinkClickHandler,
      linkClickHandler,
      EditorState.readOnly.of(isReadOnly || isChunkActive),
      isChunkActive ? chunkModeFacet.of(true) : [],
      EditorView.editorAttributes.of({ class: isChunkActive ? 'cm-chunk-mode-active' : '' }),
      lineLimitGuard,
      permissionGuard(canEditNode),
      markdownLivePreviewField,
      onDocChange,
      tableBackspace,
      sourceModeField,
      tableSelectionHighlighter,
      tableKeyboardHandler,
      keymap.of([{ key: 'Mod-a', run: selectAllToTop }, ...yUndoManagerKeymap]),
      myOwnDarkTheme,
      drawSelection(),
      dropCursor(),
      markdown({
        base: markdownLanguage,
        codeLanguages: languages,
        addKeymap: true,
      }),
      yCollab(ytext, instance.provider.awareness, { undoManager }),
      EditorView.lineWrapping,
      dragStatusField,
      columnSelectionField,
      viewportLinesField,
      viewportLinesPlugin,
      createEditorStatsPlugin(node._id),
    ];
  }, [instance, ytext, onDocChange, setActiveNode, node._id, undoManager, isReadOnly, isChunkActive, canEditNode]);

  useEffect(() => {
    if (!ytext) return;

    let timer: NodeJS.Timeout;

    const observer = () => {
      const currentContent = ytext.toString();
      if (currentContent === '' && !synced) return;
      window.dispatchEvent(
        new CustomEvent('editor-content-changed', {
          detail: {
            nodeId: node._id,
            title: node.title,
            content: currentContent,
          },
        })
      );
      clearTimeout(timer);
      timer = setTimeout(() => {
        useNodeStore.getState().updateNode(node._id, { content: currentContent });
      }, 1000);
    };

    ytext.observe(observer);
    return () => {
      ytext.unobserve(observer);
      clearTimeout(timer);
    };
  }, [ytext, node._id, node.title, synced]);

  useEffect(() => {
    if (instance && ytext) {
      const timer = setTimeout(() => setEditorReady(true), 0);
      return () => clearTimeout(timer);
    }
  }, [instance, ytext]);

  const pendingScrollHeading = useNodeStore(state => state.pendingScrollHeading);

  useEffect(() => {
    const view = editorViewRef?.current;
    if (view && pendingScrollHeading && synced && ytext) {
      const rawContent = ytext.toString();
      const target = pendingScrollHeading.trim().toLowerCase();

      if (!rawContent.toLowerCase().includes(target)) return;

      const doc = view.state.doc;

      for (let i = 1; i <= doc.lines; i++) {
        const line = doc.line(i);
        const text = line.text.trim().toLowerCase();

        const isHeadingMatch = text.startsWith('#') && text.includes(target);

        if (isHeadingMatch) {
          setTimeout(() => {
            view.focus();
            view.dispatch({
              selection: { anchor: line.from, head: line.to },
              effects: [EditorView.scrollIntoView(line.from, { y: 'center' })],
              userEvent: 'select',
            });

            useNodeStore.getState().setPendingScrollHeading('');
          }, 100);
          break;
        }
      }
    }
  }, [synced, pendingScrollHeading, ytext, node._id]);

  return (
    <>
      <div className="absolute top-12 left-0 right-0 h-1 z-51 w-full bg-background" />
      <div className="absolute top-13 left-0 right-0 h-14 z-50 flex items-center px-10 border-b border-white/5 bg-sidebar/80 backdrop-blur-sm pointer-events-auto cursor-default drop-shadow-xs shadow-xs">
        <div className="flex justify-between items-center w-full">
          <h1 className="text-5xl font-bold tracking-tighter text-foreground truncate select-text w-fit! cursor-text">
            {(node as INode)?.title || 'Not Found'}
          </h1>
          <EditorOptions
            editorViewRef={editorViewRef}
            isReadOnly={isReadOnly}
            setIsReadOnly={setIsReadOnly}
            isChunkActive={isChunkActive}
            setIsChunkActive={setIsChunkActive}
            canEditChunk={canEditChunk}
          />
        </div>
      </div>

      {isChunkActive && (
        <div
          tabIndex={-1}
          className={cn(
            'absolute inset-0 z-30 bg-background',
            'h-full! grid grid-cols-1 max-h-full w-full px-10 overflow-y-auto overflow-x-hidden relative [&::-webkit-scrollbar-track]:mt-[56px] [&::-webkit-scrollbar-track]:mb-[20px]'
          )}
        >
          <div className="w-full h-auto pb-4 flex flex-col" tabIndex={-1}>
            <ChunkEditor text={ytext?.toString() || ''} splits={[]} ydoc={instance?.ydoc} canEditChunk={canEditChunk} />
          </div>
        </div>
      )}

      <div
        tabIndex={-1}
        className={cn(
          'h-full! grid grid-cols-1 max-h-full w-full px-10 overflow-y-auto overflow-x-hidden relative [&::-webkit-scrollbar-track]:mt-[56px] [&::-webkit-scrollbar-track]:mb-[20px]',
          isChunkActive ? 'hidden' : ''
        )}
      >
        <ContextMenuClient editorViewRef={editorViewRef} contextType={contextType} setContextType={setContextType} synced={synced}>
          <div
            className={cn('w-full h-auto pb-4 flex flex-col', isChunkActive ? 'hidden' : 'w-full h-auto')}
            onMouseDown={e => {
              const target = e.target as HTMLElement;

              if (target.classList.contains('cm-scroller')) {
                e.preventDefault();
                setActiveNode(node._id);
                const view = editorViewRef.current;
                if (!view) return;
                const isEditable = view.state.facet(EditorView.editable);
                if (!isEditable) return;

                view.focus();
                const endPos = view.state.doc.length;

                view.dispatch({
                  selection: { anchor: endPos, head: endPos },
                  scrollIntoView: true,
                  userEvent: 'select',
                });
              }
            }}
          >
            {editorReady ? (
              <CodeMirror
                key={node._id}
                editable={!isReadOnly && canEditNode}
                onCreateEditor={view => {
                  editorViewRef.current = view;

                  setTimeout(() => {
                    setupDragTracking(view);
                  }, 0);
                }}
                theme={myOwnDarkTheme}
                basicSetup={false}
                extensions={editorExtensions}
                className="h-auto!"
              />
            ) : (
              <div className="min-h-[30vh] flex items-center justify-center text-5xl leading-1 w-full">Syncing Document...</div>
            )}
            <div
              onMouseDown={() => {
                setActiveNode(node._id);
                const view = editorViewRef.current;
                if (!view) return;
                setTimeout(() => {
                  view.focus();
                  const endPos = view.state.doc.length;

                  view.dispatch({
                    selection: { anchor: endPos, head: endPos },
                    scrollIntoView: true,
                    userEvent: 'select',
                  });
                }, 0);
              }}
              className="cursor-text flex-1  h-full"
            />
          </div>
        </ContextMenuClient>
        <FooterLinks activeNodeId={node._id} />
      </div>
      <EditorStatusBar nodeId={node._id} />
    </>
  );
}

export default React.memo(MarkdownSection, (prevProps, nextProps) => {
  return prevProps.node._id === nextProps.node._id && prevProps.isDirty === nextProps.isDirty;
});
