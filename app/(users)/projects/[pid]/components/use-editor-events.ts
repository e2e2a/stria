import React, { useEffect, MutableRefObject } from 'react';
import { EditorView } from '@codemirror/view';
import { sourceModeField, toggleSourceMode } from '@/features/editor/plugins';
import { EditorSelection, Transaction } from '@uiw/react-codemirror';

interface EditorJumpDetail {
  nodeId: string;
  offset: number;
  length: number;
  matchIndices: number[];
}

export const useEditorEvents = (
  nodeId: string,
  synced: boolean,
  editorViewRef: MutableRefObject<EditorView | null>,
  setIsReadOnly: React.Dispatch<React.SetStateAction<boolean>>,
  setIsChunkActive: React.Dispatch<React.SetStateAction<boolean>>
) => {
  useEffect(() => {
    const timers = new Set<ReturnType<typeof setTimeout>>();

    const runWhenReady = (action: () => void) => {
      const view = editorViewRef.current;
      if (!view || view.state.doc.length === 0) {
        const timer = setTimeout(() => {
          action();
          timers.delete(timer);
        }, 50);
        timers.add(timer);
        return false;
      }
      return true;
    };

    const performJump = () => {
      const pending = window.__PENDING_JUMP__ as EditorJumpDetail | undefined;
      if (!pending || pending.nodeId !== nodeId) return;
      if (!runWhenReady(performJump)) return;

      const view = editorViewRef.current!;
      const doc = view.state.doc;

      requestAnimationFrame(() => {
        const ranges = pending.matchIndices.map((relIdx: number) => {
          // Logic: Search Index + Offset inside that line
          const anchor = Math.min(pending.offset + relIdx, doc.length);
          const head = Math.min(anchor + pending.length, doc.length);
          return EditorSelection.range(anchor, head);
        });

        if (ranges.length > 0) {
          view.dispatch({
            selection: EditorSelection.create(ranges),
            effects: [EditorView.scrollIntoView(ranges[0].from, { y: 'center' })],
            annotations: [Transaction.addToHistory.of(false)],
            userEvent: 'select.search',
          });
          setTimeout(() => view.focus(), 0);
        } else {
          view.dispatch({
            selection: {
              anchor: 3,
              head: 3,
            },
            effects: [EditorView.scrollIntoView(3, { y: 'center' })],
            userEvent: 'select.search',
          });
          setTimeout(() => view.focus(), 0);
        }
        window.__PENDING_JUMP__ = null;
      });
    };

    const handleActionEvent = (e: Event) => {
      const { nodeId: eventNodeId, text } = (e as CustomEvent).detail;
      if (eventNodeId?._id !== nodeId || !synced) return;

      if (!runWhenReady(() => handleActionEvent(e))) return;

      const view = editorViewRef.current!;
      const { from, to, head } = view.state.selection.main;
      if (head === 0 && view.state.doc.lineAt(head).length > 0) return;

      view.dispatch({
        changes: { from, to, insert: text },
        selection: { anchor: from + text.length },
        userEvent: 'input.sidebar',
      });
      view.focus();
    };

    const onScrollRequest = (e: Event) => {
      const { text, level } = (e as CustomEvent).detail;
      const view = editorViewRef.current;
      if (!view) return;

      const escapedText = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const match = new RegExp(`^#{${level}}\\s+${escapedText}`, 'm').exec(view.state.doc.toString());

      if (match) {
        const line = view.state.doc.lineAt(match.index);
        requestAnimationFrame(() => {
          view.focus();
          view.dispatch({
            selection: { anchor: line.from, head: line.to },
            effects: [EditorView.scrollIntoView(line.from, { y: 'center' })],
            userEvent: 'select',
          });
        });
      }
    };

    const handleRemoteAction = (e: Event) => {
      const { nodeId: targetId, action } = (e as CustomEvent).detail;
      if (targetId !== nodeId) return;

      const view = editorViewRef.current;
      if (!view) return;

      switch (action) {
        case 'toggle-chunk': {
          setIsChunkActive(prev => !prev);
          break;
        }

        case 'toggle-read-only': {
          setIsReadOnly((prev: boolean) => {
            const nextState = !prev;
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
          break;
        }

        case 'toggle-source': {
          if (view) {
            const isSource = view.state.field(sourceModeField, false);
            view.dispatch({ effects: toggleSourceMode.of(!isSource) });
          }
          break;
        }
      }

      window.dispatchEvent(new CustomEvent('cm-state-refresh'));
    };

    if (synced) performJump();
    window.addEventListener('editor-jump-to', performJump);
    window.addEventListener('editor-action', handleActionEvent);
    window.addEventListener('editor:scroll-to-heading', onScrollRequest);
    window.addEventListener('editor:remote-action', handleRemoteAction);

    return () => {
      window.removeEventListener('editor-jump-to', performJump);
      window.removeEventListener('editor-action', handleActionEvent);
      window.removeEventListener('editor:scroll-to-heading', onScrollRequest);
      window.removeEventListener('editor:remote-action', handleRemoteAction);
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, [nodeId, synced, editorViewRef]);
};
