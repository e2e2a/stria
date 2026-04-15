import { useEditorSettings } from '@/features/editor/stores/setting';
import { INode } from '@/types';
import React from 'react';

const EditorInlineTitle = ({ node }: { node: INode }) => {
  const [title, setTitle] = React.useState(node.title);
  const inlineTitle = useEditorSettings(state => state.inlineTitle);

  return (
    <div className="pt-16">
      {inlineTitle && (
        <textarea
          value={title}
          onChange={e => setTitle(e.target.value)}
          rows={1}
          onBlur={() => {
            console.log('onblur');
          }}
          style={{ fieldSizing: 'content' } as React.CSSProperties}
          className="w-full text-5xl font-bold tracking-tighter text-foreground resize-none bg-transparent border-none outline-none focus:outline-none focus:ring-0 p-0 m-0 overflow-hidden"
        />
      )}
    </div>
  );
};

export default EditorInlineTitle;
