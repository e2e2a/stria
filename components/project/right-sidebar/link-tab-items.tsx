'use client';
import { ChevronRight, FileText } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../ui/collapsible';
import { useNodeStore } from '@/features/editor/stores/nodes';
import { useTabStore } from '@/features/editor/stores/tabs';
import { flattenNodeTree } from '@/utils/client/node-utils';

interface LinkMention {
  excerpt: string;
  line: number;
  index: number;
  alias?: string;
}

interface LinkFile {
  _id: string;
  title: string;
  path: string;
  type: 'file' | 'folder';
  mentions: LinkMention[];
}

const HighlightedLink = ({ text }: { text: string }) => {
  const parts = text.split(/(\[\[.*?\]\]|\[.*?\]\(.*?\))/g);
  return (
    <span className="text-[12px] leading-relaxed text-zinc-400 group-hover/mention:text-zinc-200 transition-colors">
      {parts.map((part, i) => {
        const isLink = part.startsWith('[[') || (part.startsWith('[') && part.includes(']('));
        return isLink ? (
          <mark key={i} className="bg-primary/20 text-primary-foreground rounded-sm px-0.5 border border-primary/20">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        );
      })}
    </span>
  );
};

export const LinkTabItems = ({ file }: { file: LinkFile }) => {
  const setActiveNode = useNodeStore(state => state.setActiveNode);
  const nodes = useNodeStore(state => state.nodes);
  const openTab = useTabStore(state => state.openTab);

  const onMentionClick = (mention: LinkMention) => {
    const flatNodes = flattenNodeTree(nodes);
    const targetNode = flatNodes.find(n => n._id === file._id);
    if (!targetNode) return;

    const linkRegex = /\[\[([^\]]+)\]\]|\[([^\]]+)\]\(([^)]+)\)/g;
    let match;

    while ((match = linkRegex.exec(mention.excerpt)) !== null) {
      const rawLink = match[1] || match[3];
      if (rawLink.includes(file.title) || file.path.includes(rawLink)) {
        break;
      }
    }

    const jumpData = { nodeId: file._id, offset: mention.index, length: mention.excerpt.length - 2 };
    Object.assign(window, { __PENDING_JUMP__: jumpData });

    openTab(targetNode.projectId, targetNode, true);
    setActiveNode(targetNode._id);

    window.dispatchEvent(new CustomEvent('editor-jump-to', { detail: jumpData }));
  };

  const onHeaderClick = () => {
    const flatNodes = flattenNodeTree(nodes);
    const targetNode = flatNodes.find(n => n._id === file._id);
    if (!targetNode) return;

    openTab(targetNode.projectId, targetNode, true);
    setActiveNode(targetNode._id);
  };

  return (
    <Collapsible className="w-full" defaultOpen={true}>
      <div className="group relative flex items-center gap-2 rounded cursor-pointer hover:bg-white/5 transition-colors w-full">
        {/* Chevron Toggle - Matches OutlineTabItem layout */}
        <div className="flex items-center justify-center w-6! h-6! shrink-0 ml-1">
          <CollapsibleTrigger asChild>
            <button className="hover:bg-white/10 p-0.5 rounded transition-transform data-[state=open]:rotate-90">
              <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300" />
            </button>
          </CollapsibleTrigger>
        </div>

        {/* File Header */}
        <div className="flex flex-col w-full h-auto text-start py-1.5 overflow-hidden" onClick={onHeaderClick}>
          <div className="flex items-center gap-2 pr-2">
            <FileText className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <span className="text-[13px] text-zinc-300 group-hover:text-white truncate font-medium tracking-tight">{file.title}</span>
            <span className="ml-auto text-[10px] text-zinc-600 font-mono bg-white/5 px-1 rounded">{file.mentions.length}</span>
          </div>
        </div>
      </div>

      <CollapsibleContent className="relative w-full overflow-hidden">
        {/* Vertical Guide Line - Positioned exactly like Outline */}
        <div className="absolute top-0 bottom-0 w-px bg-white/5 pointer-events-none left-[20px]" />

        <div className="flex flex-col mt-0.5">
          {file.mentions.map((mention, i: number) => (
            <div
              key={`${file._id}-m-${i}`}
              className="group/mention relative flex items-start gap-2 rounded cursor-pointer hover:bg-white/5 transition-colors w-full py-2 pl-[32px] pr-3"
              onClick={() => onMentionClick(mention)}
            >
              {/* Dot indicator matching OutlineItem circle */}
              <div className="flex items-center justify-center w-4 h-4 mt-1 shrink-0">
                <div className="w-1 h-1 rounded-full bg-zinc-600 group-hover/mention:bg-primary transition-colors" />
              </div>

              <div className="flex flex-col gap-0.5 overflow-hidden">
                <span className="text-[9px] font-mono text-zinc-600 uppercase">Line {mention.line}</span>
                <div className="line-clamp-2">
                  <HighlightedLink text={mention.excerpt} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default LinkTabItems;
