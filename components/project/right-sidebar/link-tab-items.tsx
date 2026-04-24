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
  length: number;
  alias?: string;
}

interface LinkFile {
  _id: string;
  title: string;
  path: string;
  type: 'file' | 'folder';
  mentions: LinkMention[];
}

interface IProps {
  file: LinkFile;
  defaultOpen?: boolean;
  searchQuery?: string;
}

const HighlightedLink = ({ text, searchQuery }: { text: string; searchQuery?: string }) => {
  // First split by WikiLinks/Markdown links
  const parts = text.split(/(\[\[.*?\]\]|\[.*?\]\(.*?\))/g);

  return (
    <span className="text-[14px] leading-relaxed text-muted-foreground group-hover/mention:text-foreground transition-colors">
      {parts.map((part, i) => {
        const isLink = part.startsWith('[[') || (part.startsWith('[') && part.includes(']('));

        if (isLink) {
          return (
            <mark key={i} className="bg-primary/60 text-primary-foreground/90 rounded-sm px-0.5 border border-primary/20">
              {part}
            </mark>
          );
        }

        if (searchQuery && searchQuery.trim() && part.toLowerCase().includes(searchQuery.toLowerCase())) {
          const searchParts = part.split(new RegExp(`(${searchQuery})`, 'gi'));
          return (
            <span key={i}>
              {searchParts.map((sPart, j) =>
                sPart.toLowerCase() === searchQuery.toLowerCase() ? (
                  <mark key={j} className="bg-yellow-500/30 text-yellow-200 rounded-sm px-0.5">
                    {sPart}
                  </mark>
                ) : (
                  <span key={j}>{sPart}</span>
                )
              )}
            </span>
          );
        }

        return <span key={i}>{part}</span>;
      })}
    </span>
  );
};

export const LinkTabItems = ({ file, defaultOpen = false, searchQuery }: IProps) => {
  const setActiveNode = useNodeStore(state => state.setActiveNode);
  const nodes = useNodeStore(state => state.nodes);
  const openTab = useTabStore(state => state.openTab);

  const onMentionClick = (mention: LinkMention) => {
    const flatNodes = flattenNodeTree(nodes);
    const targetNode = flatNodes.find(n => n._id === file._id);
    if (!targetNode) return;

    // Use a jump offset logic similar to Obsidian/VSCode
    const jumpData = {
      nodeId: file._id,
      offset: mention.index,
      length: mention.length,
      matchIndices: [0],
    };

    Object.assign(window, { __PENDING_JUMP__: jumpData });

    openTab(targetNode.projectId, targetNode, true);
    setActiveNode(targetNode._id);

    window.dispatchEvent(new CustomEvent('editor-jump-to', { detail: jumpData }));
  };

  const onHeaderClick = (e: React.MouseEvent) => {
    // Prevent navigation if clicking the toggle button specifically
    if ((e.target as HTMLElement).closest('button')) return;

    const flatNodes = flattenNodeTree(nodes);
    const targetNode = flatNodes.find(n => n._id === file._id);
    if (!targetNode) return;

    openTab(targetNode.projectId, targetNode, true);
    setActiveNode(targetNode._id);
  };

  return (
    <Collapsible className="w-full" defaultOpen={defaultOpen}>
      <div
        className="group relative flex items-center gap-2 rounded cursor-pointer text-foreground hover:bg-secondary transition-colors w-full"
        onClick={onHeaderClick}
      >
        <div className="flex items-center justify-center w-5! h-5! shrink-0 ml-1">
          <CollapsibleTrigger asChild>
            <button className="hover:bg-secondary p-0.5 rounded transition-transform data-[state=open]:rotate-90">
              <ChevronRight className="w-3.5 h-3.5 text-foreground" />
            </button>
          </CollapsibleTrigger>
        </div>

        <div className="flex flex-col w-full h-auto text-start py-1.5 overflow-hidden">
          <div className="flex items-center gap-2 pr-2">
            <FileText className="w-3.5 h-3.5 text-foreground shrink-0" />
            <span className="text-sm text-muted-foreground truncate font-medium tracking-tight">{file.title}</span>
            <span className="ml-auto text-[10px] text-foreground font-mono bg-secondary px-1 rounded">{file.mentions.length}</span>
          </div>
        </div>
      </div>

      <CollapsibleContent className="relative w-full overflow-hidden text-foreground">
        <div className="absolute top-0 bottom-0 w-px bg-secondary pointer-events-none left-5" />

        <div className="flex flex-col mt-0.5">
          {file.mentions.map((mention, i: number) => (
            <div
              key={`${file._id}-m-${i}`}
              className="group/mention relative flex items-start gap-2 rounded cursor-pointer hover:bg-secondary transition-colors w-full py-2 pl-8 pr-3"
              onClick={() => onMentionClick(mention)}
            >
              <div className="flex items-center justify-center w-4 h-4 mt-1 shrink-0">
                <div className="w-1 h-1 rounded-full bg-secondary group-hover/mention:bg-primary transition-colors" />
              </div>

              <div className="flex flex-col gap-0.5 overflow-hidden">
                <span className="text-[9px] font-mono uppercase">Line {mention.line}</span>
                <div className="line-clamp-2">
                  <HighlightedLink text={mention.excerpt} searchQuery={searchQuery} />
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
