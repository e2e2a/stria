import { ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../ui/collapsible';

interface OutlineNode {
  text: string;
  level: number;
  children: OutlineNode[];
}

const HighlightedText = ({ text, highlight }: { text: string; highlight: string }) => {
  if (!highlight.trim()) return <span>{text}</span>;
  const parts = text.split(new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <mark key={i} className="bg-primary/60 text-muted-foreground rounded-sm px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
};

export const OutlineTabItem = ({
  node,
  depth = 0,
  searchQuery,
  defaultOpen,
}: {
  node: OutlineNode;
  depth?: number;
  searchQuery: string;
  defaultOpen?: boolean;
}) => {
  const hasChildren = node.children.length > 0;

  const handleNavigate = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.dispatchEvent(
      new CustomEvent('editor:scroll-to-heading', {
        detail: { text: node.text, level: node.level },
      })
    );
  };

  return (
    <Collapsible className="w-full" defaultOpen={defaultOpen}>
      <div
        className="group relative flex items-center gap-2 rounded cursor-pointer hover:bg-secondary transition-colors w-full"
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
      >
        <div className="flex items-center justify-center w-6! h-6! shrink-0">
          {hasChildren ? (
            <CollapsibleTrigger asChild>
              <button className="hover:bg-secondary p-0.5 rounded transition-transform data-[state=open]:rotate-90">
                <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300" />
              </button>
            </CollapsibleTrigger>
          ) : (
            <div className="w-1 h-1 rounded-full bg-zinc-600 group-hover:bg-primary transition-colors" />
          )}
        </div>
        <button onClick={handleNavigate} className="inline-flex w-full h-auto text-start py-1.5 overflow-hidden">
          <span className="text-[13px] text-muted-foreground group-hover:text-foreground truncate flex-1 font-medium tracking-tight">
            <HighlightedText text={node.text} highlight={searchQuery} />
          </span>
        </button>
      </div>

      {hasChildren && (
        <CollapsibleContent className="relative w-full overflow-hidden">
          <div className="absolute top-0 bottom-0 w-px bg-secondary pointer-events-none transition-colors" style={{ left: `${depth * 16 + 24}px` }} />
          <div className="flex flex-col">
            {node.children.map((child, i) => (
              <OutlineTabItem key={`${child.text}-${i}`} node={child} depth={depth + 1} defaultOpen={defaultOpen} searchQuery={searchQuery} />
            ))}
          </div>
        </CollapsibleContent>
      )}
    </Collapsible>
  );
};
