'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { drawSelection, dropCursor, EditorView, keymap } from '@codemirror/view';
import CodeMirror, { Compartment, EditorState } from '@uiw/react-codemirror';
import { history, historyKeymap } from '@codemirror/commands';
import { yCollab, yUndoManagerKeymap } from 'y-codemirror.next';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { INode } from '@/types';
import {
  chunkModeFacet,
  createEditorStatsPlugin,
  dragStatusField,
  lineLimitGuard,
  markdownLivePreviewField,
  permissionGuard,
  setupDragTracking,
  sourceModeField,
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
import { useParams } from 'react-router-dom';
import { useNodeStore } from '@/features/editor/stores/nodes';
import { useProjectUIStore } from '@/features/editor/stores/project-ui';
import ContextMenuClient from './context-menu/context-menu-client';
import FooterLinks from './footer-links';
import { EditorStatusBar } from './editor-status-bar';
import { useEditorEvents } from './use-editor-events';
import { ChunkEditor } from './chunk-editor';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import EditorTabTitleBar from './options/appearance/tab-title-bar';
import EditorInlineTitle from './options/appearance/inline-title';
import createTheme from '@uiw/codemirror-themes';
import { tags as t } from '@lezer/highlight';
import { mermaidLivePreviewField, registerView, themeChangedEffect } from '@/features/editor/plugins/mermaid';
import { useEditorSettings } from '@/features/editor/stores/setting';
import { tableLivePreviewField, columnSelectionField, tableSelectionHighlighter } from '@/features/editor/plugins/table';
import { useNodeByIdQuery } from '@/hooks/node/useNodeQuery';
import { nodeClient } from '@/lib/client/api/nodeClient';
import { selectiveWrapPlugin } from '@/features/editor/plugins/no-wrap';
import { fenceLivePreviewField } from '@/features/editor/plugins/fence-code';

const myTheme = createTheme({
  theme: 'dark',
  settings: {
    background: 'transparent',
    foreground: '#d4d4d4',
    // selectionMatch: `${accentColor}40`,
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
    { tag: [t.heading], color: 'var(--foreground)', fontWeight: 'bold' },
    { tag: [t.atom, t.bool, t.number], color: '#b5cea8' },
  ],
});

function MarkdownSection({ node, isDirty, canEditNode, canEditChunk }: { node: INode; isDirty: boolean; canEditNode: boolean; canEditChunk: boolean }) {
  const wsUrl = import.meta.env.VITE_WS_URL;
  const isRealtimeEnabled = Boolean(wsUrl);
  const [synced, setSynced] = useState(!isRealtimeEnabled);
  const [instance, setInstance] = useState<{ ydoc: Y.Doc; provider: HocuspocusProvider } | null>(null);
  const [localContent, setLocalContent] = useState(node.content ?? '');
  const hasLocalEditsRef = useRef(false);
  const editorViewRef = useRef<EditorView | null>(null);
  const markDirty = useTabStore(state => state.markDirty);
  const setActiveNode = useNodeStore(state => state.setActiveNode);
  const pid = useParams().pid || '';
  const [editorReady, setEditorReady] = useState(!isRealtimeEnabled);
  const [contextType, setContextType] = useState<'general' | 'callout'>('general');
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isChunkActive, setIsChunkActive] = useState(false);
  const { data: fullNode } = useNodeByIdQuery(node._id);

  useEditorEvents(node._id, synced, editorViewRef, setIsReadOnly, setIsChunkActive);

  const providerRef = useRef<HocuspocusProvider | null>(null);

  useEffect(() => {
    if (isRealtimeEnabled) return;
    hasLocalEditsRef.current = false;
    setLocalContent(fullNode?.content ?? node.content ?? '');
    setSynced(true);
    setEditorReady(true);
  }, [isRealtimeEnabled, node._id, fullNode?.content, node.content]);

  useEffect(() => {
    if (!isRealtimeEnabled || !wsUrl || !node?._id) return;

    if (providerRef.current && providerRef.current.configuration.name === node._id) return;

    if (providerRef.current) {
      providerRef.current.destroy();
    }

    const ydoc = new Y.Doc();
    const provider = new HocuspocusProvider({
      url: wsUrl,
      name: node._id,
      document: ydoc,
      onSynced: () => {
        const userId = localStorage.getItem('markdown-editor-user-id') || crypto.randomUUID();
        localStorage.setItem('markdown-editor-user-id', userId);
        setSynced(true);
        provider.awareness?.setLocalState({
          user: { id: userId, name: 'Local editor', color: '#000000' },
        });
      },
    });

    providerRef.current = provider;
    requestAnimationFrame(() => setInstance({ ydoc, provider }));
  }, [isRealtimeEnabled, wsUrl, node?._id]);

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

  const ytext = useMemo(() => (isRealtimeEnabled ? instance?.ydoc.getText('codemirror') : null), [instance, isRealtimeEnabled]);
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
    if (isRealtimeEnabled && (!instance || !ytext || !undoManager)) return [];

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
      myTheme,
      internalLinkCompletion,
      internalLinkClickHandler,
      linkClickHandler,
      EditorView.contentAttributes.of({ style: 'line-height: calc(var(--editor-font-size) * 1.5)' }),
      EditorState.readOnly.of(isReadOnly || isChunkActive),
      isChunkActive ? chunkModeFacet.of(true) : [],
      EditorView.editorAttributes.of({ class: isChunkActive ? 'cm-chunk-mode-active' : '' }),
      selectiveWrapPlugin,
      lineLimitGuard,
      permissionGuard(canEditNode),
      markdownLivePreviewField,
      fenceLivePreviewField,
      mermaidLivePreviewField,
      onDocChange,
      tableLivePreviewField,
      tableBackspace,
      sourceModeField,
      tableSelectionHighlighter,
      tableKeyboardHandler,
      keymap.of([{ key: 'Mod-a', run: selectAllToTop }, ...(isRealtimeEnabled ? yUndoManagerKeymap : historyKeymap)]),
      drawSelection(),
      dropCursor(),
      !isRealtimeEnabled ? history() : [],
      markdown({
        base: markdownLanguage,
        codeLanguages: languages,
        addKeymap: true,
      }),
      isRealtimeEnabled && ytext && instance && undoManager ? yCollab(ytext, instance.provider.awareness, { undoManager }) : [],
      dragStatusField,
      columnSelectionField,
      viewportLinesField,
      viewportLinesPlugin,
      createEditorStatsPlugin(node._id),
    ];
  }, [isRealtimeEnabled, instance, ytext, onDocChange, setActiveNode, node._id, undoManager, isReadOnly, isChunkActive, canEditNode]);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isRealtimeEnabled || !hasLocalEditsRef.current) return;

    window.dispatchEvent(
      new CustomEvent('ping-graph-update', {
        detail: {
          nodeId: String(node._id),
          content: localContent,
        },
      })
    );
    window.dispatchEvent(
      new CustomEvent('editor-content-changed', {
        detail: {
          nodeId: node._id,
          title: node.title,
          content: localContent,
        },
      })
    );

    const timer = setTimeout(async () => {
      try {
        await nodeClient.update({ _id: node._id, content: localContent });
        useNodeStore.getState().updateNode(node._id, { content: localContent });
        markDirty(pid, node._id, false);
        queryClient.invalidateQueries({ queryKey: ['projectTags', pid] });
        queryClient.invalidateQueries({ queryKey: ['projectProperties', pid] });
        queryClient.invalidateQueries({ queryKey: ['nodeOutlines', node._id] });
        hasLocalEditsRef.current = false;
      } catch (error) {
        console.error('Failed to save markdown file:', error);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [isRealtimeEnabled, localContent, node._id, node.title, pid, markDirty, queryClient]);

  useEffect(() => {
    if (!ytext) return;

    let timer: NodeJS.Timeout;
    let timer2: NodeJS.Timeout;

    const observer = () => {
      const currentContent = ytext.toString();
      if (currentContent === '' && !synced) return;
      window.dispatchEvent(
        new CustomEvent('ping-graph-update', {
          detail: {
            nodeId: String(node._id),
            content: currentContent,
          },
        })
      );
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
      }, 1200);
      clearTimeout(timer2);
      timer2 = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['projectTags', pid] });
        queryClient.invalidateQueries({ queryKey: ['projectProperties', pid] });
        queryClient.invalidateQueries({ queryKey: ['nodeOutlines', node._id] });
      }, 3000);
    };

    ytext.observe(observer);
    return () => {
      ytext.unobserve(observer);
      clearTimeout(timer);
      clearTimeout(timer2);
    };
  }, [ytext, node._id, node.title, synced, queryClient, pid]);

  useEffect(() => {
    if (!isRealtimeEnabled) return;
    if (instance && ytext) {
      const timer = setTimeout(() => setEditorReady(true), 0);
      return () => clearTimeout(timer);
    }
  }, [isRealtimeEnabled, instance, ytext]);

  const pendingScrollHeading = useNodeStore(state => state.pendingScrollHeading);

  useEffect(() => {
    const view = editorViewRef?.current;
    if (view && pendingScrollHeading && synced) {
      const rawContent = ytext?.toString() ?? localContent;
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
  }, [synced, pendingScrollHeading, ytext, localContent, node._id]);

  useEffect(() => {
    const unsubscribe = useEditorSettings.subscribe((state, prevState) => {
      if (state.theme !== prevState?.theme) {
        if (!editorViewRef.current) return;

        editorViewRef.current.dispatch({
          effects: themeChangedEffect.of(),
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <>
      <EditorTabTitleBar
        node={node}
        editorViewRef={editorViewRef}
        isReadOnly={isReadOnly}
        setIsReadOnly={setIsReadOnly}
        isChunkActive={isChunkActive}
        setIsChunkActive={setIsChunkActive}
        canEditChunk={canEditChunk}
      />

      {isChunkActive && (
        <div
          tabIndex={-1}
          className={cn(
            'absolute inset-0 z-30 bg-background hoverable-scrollbar editor-font-text',
            'h-full! grid grid-cols-1 max-h-full w-full overflow-y-auto overflow-x-hidden relative [&::-webkit-scrollbar-track]:mt-8 [&::-webkit-scrollbar-track]:mb-5'
          )}
        >
          <div className="w-full h-auto pb-4 px-10 flex flex-col pt-9" tabIndex={-1}>
            <ChunkEditor text={isRealtimeEnabled ? ytext?.toString() || '' : localContent} splits={[]} ydoc={instance?.ydoc} canEditChunk={canEditChunk} />
          </div>
        </div>
      )}

      <div
        tabIndex={-1}
        style={{ overflowAnchor: 'none' }}
        className={cn(
          'hoverable-scrollbar editor-font-text',
          'h-full! grid grid-cols-1 max-h-full min-w-0! max-w-full w-full px-10 overflow-y-auto overflow-x-auto relative',
          '[&::-webkit-scrollbar-track]:mt-8 [&::-webkit-scrollbar-track]:mb-5',
          isChunkActive ? 'hidden' : ''
        )}
      >
        <div className="w-full min-w-0">
          <EditorInlineTitle node={node} />

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
                    // scrollIntoView: true,
                    userEvent: 'select',
                  });
                }
              }}
            >
              {editorReady ? (
                <CodeMirror
                  key={node._id}
                  value={isRealtimeEnabled ? undefined : localContent}
                  editable={!isReadOnly && canEditNode && synced}
                  onChange={value => {
                    if (isRealtimeEnabled) return;
                    hasLocalEditsRef.current = true;
                    setLocalContent(value);
                  }}
                  onCreateEditor={view => {
                    registerView(view);
                    editorViewRef.current = view;

                    setTimeout(() => {
                      setupDragTracking(view);
                    }, 0);
                  }}
                  theme="none"
                  basicSetup={false}
                  extensions={editorExtensions}
                  className="h-auto! w-full! min-w-full!"
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
                className="cursor-text flex-1 h-full"
              />
            </div>
          </ContextMenuClient>
        </div>
        <FooterLinks activeNodeId={node._id} />
      </div>
      <EditorStatusBar nodeId={node._id} />
    </>
  );
}

export default React.memo(MarkdownSection, (prevProps, nextProps) => {
  return prevProps.node._id === nextProps.node._id && prevProps.isDirty === nextProps.isDirty && prevProps.node.title === nextProps.node.title;
});
