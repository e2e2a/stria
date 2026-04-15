import React from 'react';
import { EditorOptions } from '../../editor-options';
import { EditorView } from '@uiw/react-codemirror';
import { INode } from '@/types';
import { useEditorSettings } from '@/features/editor/stores/setting';

const EditorTabTitleBar = ({
  node,
  editorViewRef,
  isReadOnly,
  setIsReadOnly,
  isChunkActive,
  setIsChunkActive,
  canEditChunk,
}: {
  node: INode;
  editorViewRef: React.RefObject<EditorView | null>;
  isReadOnly: boolean;
  setIsReadOnly: (val: boolean | ((prev: boolean) => boolean)) => void;
  isChunkActive: boolean;
  setIsChunkActive: (val: boolean | ((prev: boolean) => boolean)) => void;
  canEditChunk: boolean;
}) => {
  const tabTitleBar = useEditorSettings(state => state.tabTitleBar);
  if (!tabTitleBar) return null;

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
    </>
  );
};

export default EditorTabTitleBar;
