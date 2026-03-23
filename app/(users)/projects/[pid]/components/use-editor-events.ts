import { useEffect, MutableRefObject } from 'react';
import { EditorView } from '@codemirror/view';
import { chunkModeFacet, sourceModeField, toggleSourceMode } from '@/features/editor/plugins';
import { EditorState } from '@uiw/react-codemirror';
import { chunkModeCompartment, editableCompartment } from './MarkdownSection';

interface EditorJumpDetail {
  nodeId: string;
  offset: number;
  length: number;
}

export const useEditorEvents = (nodeId: string, synced: boolean, editorViewRef: MutableRefObject<EditorView | null>) => {
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
      const docLength = view.state.doc.length;
      const offset = Math.min(pending.offset, docLength);

      requestAnimationFrame(() => {
        view.dispatch({
          selection: { anchor: offset, head: Math.min(offset + pending.length, docLength) },
          effects: [EditorView.scrollIntoView(offset, { y: 'center' })],
          userEvent: 'select',
        });
        view.focus();
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
          const isChunk = view.dom.classList.contains('cm-chunk-mode-active');
          const nextState = !isChunk;
          view.dispatch({
            effects: chunkModeCompartment.reconfigure(nextState ? chunkModeFacet.of(true) : []),
          });
          view.dom.classList.toggle('cm-chunk-mode-active', nextState);
          break;
        }

        case 'toggle-read-only': {
          const isRead = view.state.facet(EditorState.readOnly);
          const nextState = !isRead;
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
          break;
        }

        case 'toggle-source': {
          const isSource = view.state.field(sourceModeField, false);
          view.dispatch({
            effects: toggleSourceMode.of(!isSource),
          });
          break;
        }
      }

      // Notify UI components like EditorOptions to re-render
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
