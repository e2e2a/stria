import { useNodeStore } from '@/features/editor/stores/nodes';
import { useEditorSettings } from '@/features/editor/stores/setting';
import { useTabStore } from '@/features/editor/stores/tabs';
import { useNodeMutations } from '@/hooks/node/useNodeMutations';
import { makeToastError } from '@/lib/toast';
import { INode } from '@/types';
import React from 'react';

const EditorInlineTitle = ({ node }: { node: INode }) => {
  const [title, setTitle] = React.useState(node.title);
  const inlineTitle = useEditorSettings(state => state.inlineTitle);
  const setIsUpdatingNode = useNodeStore(state => state.setIsUpdatingNode);
  const mutation = useNodeMutations();

  const update = () => {
    const trimmed = title.trim();
    console.log('Updating title to:', trimmed);
    console.log('node.title:', node.title);
    if (!trimmed || node.title === trimmed) {
      setIsUpdatingNode(null);
      return;
    }
    try {
      useNodeStore.getState().updateNode(node._id, { title: trimmed });
      useTabStore.getState().updateTabNode(node.projectId, node._id, { title: trimmed });
      setIsUpdatingNode(null);
      const payload = {
        _id: node._id,
        pid: node.projectId,
        title: title as string,
      };
      // mutation.update.mutate(payload, {
      //   onError: err => {
      //     makeToastError(err.message);
      //     return;
      //   },
      //   onSettled: () => {
      //     setIsUpdatingNode(null);
      //   },
      // });
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
      makeToastError(message);
    } finally {
      setIsUpdatingNode(null);
    }
  };
  return (
    <div className="pt-16">
      {inlineTitle && (
        <textarea
          value={title}
          onChange={e => setTitle(e.target.value)}
          rows={1}
          onBlur={() => update()}
          style={{ fieldSizing: 'content' } as React.CSSProperties}
          className="w-full text-5xl font-bold tracking-tighter text-foreground resize-none bg-transparent border-none outline-none focus:outline-none focus:ring-0 p-0 m-0 overflow-hidden"
        />
      )}
    </div>
  );
};

export default EditorInlineTitle;
