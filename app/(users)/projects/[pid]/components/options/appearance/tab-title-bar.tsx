import React, { useEffect, useState } from 'react';
import { EditorOptions } from '../../editor-options';
import { EditorView } from '@uiw/react-codemirror';
import { INode } from '@/types';
import { useEditorSettings } from '@/features/editor/stores/setting';
import { useNodeMutations } from '@/hooks/node/useNodeMutations';
import { useNodeStore } from '@/features/editor/stores/nodes';
import { useTabStore } from '@/features/editor/stores/tabs';
import { makeToastError } from '@/lib/toast';

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
  const [title, setTitle] = useState(node.title);
  const mutation = useNodeMutations();
  const setIsUpdatingNode = useNodeStore(state => state.setIsUpdatingNode);

  useEffect(() => {
    setTitle(node.title);
  }, [node.title]);

  const tabTitleBar = useEditorSettings(state => state.tabTitleBar);
  if (!tabTitleBar) return null;

  const update = () => {
    const trimmed = title.trim();
    if (!trimmed || node.title === trimmed) return setIsUpdatingNode(null);
    try {
      useNodeStore.getState().updateNode(node._id, { title: trimmed });
      useTabStore.getState().updateTabNode(node.projectId, node._id, { title: trimmed });
      setIsUpdatingNode(null);
      const payload = {
        _id: node._id,
        pid: node.projectId,
        title: title as string,
      };
      mutation.update.mutate(payload, {
        onError: err => {
          return makeToastError(err.message);
        },
        onSettled: () => {
          setIsUpdatingNode(null);
        },
      });
    } catch (err) {
      console.log('err', err);
      let message = 'Unknown Error';
      if (err instanceof Error) {
        message = err.message;
        console.log('Error message:', err.message);
      } else {
        message = err as string;
        console.log('Unknown error', err);
      }
      setTitle(node.title);
      makeToastError(message);
    } finally {
      setIsUpdatingNode(null);
    }
  };

  return (
    <>
      <div className="absolute top-13 left-0 right-0 h-14 z-50 flex items-center px-10 border-b border-border bg-sidebar/80 backdrop-blur-sm pointer-events-auto cursor-default drop-shadow-xs shadow-xs">
        <div className="flex justify-between items-center w-full">
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={update}
            disabled={isReadOnly}
            className="flex-1 text-5xl font-bold tracking-tighter text-foreground bg-transparent border-none outline-none focus:outline-none focus:ring-0 p-0 m-0 w-full text-ellipsis overflow-hidden whitespace-nowrap min-w-0"
          />
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
