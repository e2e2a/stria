import React, { useEffect, useRef, useState } from 'react';
import { ContextMenu, ContextMenuTrigger } from '@/components/ui/context-menu';
import { EditorView } from '@uiw/react-codemirror';
import GeneralContextMenu from './general';
import CalloutContextMenu from './callout';
interface IProps {
  children: React.ReactNode;
  editorViewRef: React.RefObject<EditorView | null>;
  synced: boolean;
  contextType: 'general' | 'callout';
  setContextType: React.Dispatch<'general' | 'callout'>;
}
const ContextMenuClient = ({ editorViewRef, synced, contextType, setContextType, children }: IProps) => {
  const [currentLineText, setCurrentLineText] = useState('');
  const [cursorPos, setCursorPos] = useState(0);
  const eventPosRef = useRef<number | null>(null);
  useEffect(() => {
    const handleContext = (e: CustomEvent<{ type: 'general' | 'callout'; pos?: number }>) => {
      setContextType(e.detail.type);
      if (e.detail.pos !== undefined) {
        eventPosRef.current = e.detail.pos;
      }
    };
    window.addEventListener('set-editor-context', handleContext as EventListener);
    return () => window.removeEventListener('set-editor-context', handleContext as EventListener);
  }, [setContextType]);

  const handleMenuOpen = (open: boolean) => {
    if (open && editorViewRef.current) {
      const view = editorViewRef.current;
      let pos: number;
      if (eventPosRef.current !== null) {
        pos = eventPosRef.current;
        eventPosRef.current = null; // clear after use
      } else {
        pos = view.state.selection.main.head;
      }
      const line = view.state.doc.lineAt(pos);
      setCurrentLineText(line.text);
      setCursorPos(pos);
    }
  };
  return (
    <ContextMenu onOpenChange={handleMenuOpen} modal={false}>
      <ContextMenuTrigger disabled={!synced} className="block h-full w-full">
        {children}
      </ContextMenuTrigger>

      {contextType === 'callout' && <CalloutContextMenu editorViewRef={editorViewRef} cursorPos={cursorPos} />}
      {contextType === 'general' && <GeneralContextMenu editorViewRef={editorViewRef} currentLineText={currentLineText} cursorPos={cursorPos} />}
    </ContextMenu>
  );
};

export default ContextMenuClient;
