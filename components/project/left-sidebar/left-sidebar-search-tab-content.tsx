'use client';

import { useEffect, useState, useRef, useCallback, useMemo, memo } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { SearchMatch, searchSingleNode } from '@/utils/client/search-nodes-utils';
import { INode } from '@/types';

const MAX_VISIBLE_RESULTS = 10000; // limit to render in visual
const BATCH_UPDATE_MS = 150;

type RenderItem =
  | { type: 'header'; nodeId: string; title: string; count: number }
  | { type: 'line'; nodeId: string; match: SearchMatch; queryLen: number };

const SearchRow = ({
  item,
  isCollapsed,
  onToggle,
  onJump,
  onResultClick,
}: {
  item: RenderItem;
  isCollapsed: boolean;
  onToggle: (id: string) => void;
  onJump: (nodeId: string, index: number, len: number) => void;
  onResultClick: (id: string) => void;
}) => {
  if (item.type === 'header') {
    const hasMatches = item.count > 0;
    return (
      <div className="px-3 flex w-full">
        <div className="flex flex-1 items-center gap-2 px-1 cursor-pointer hover:bg-white/5 min-w-0" onClick={() => onToggle(item.nodeId)}>
          <div className="w-4 shrink-0 flex items-center justify-center">
            {hasMatches ? isCollapsed ? <ChevronRight size={10} /> : <ChevronDown size={10} /> : null}
          </div>

          <div
            className="flex-1 min-w-0 h-full"
            onClick={e => {
              e.stopPropagation();
              onResultClick(item.nodeId);
            }}
          >
            <span className="text-[15px] font-bold uppercase truncate block text-foreground">{item.title}</span>
          </div>

          <span className="text-[9px] opacity-40 shrink-0 tabular-nums">{item.count}</span>
        </div>
      </div>
    );
  }

  const { lineContent, matchIndices, text, index } = item.match;
  return (
    <div className="px-3 py-px">
      <div
        onClick={() => onJump(item.nodeId, index, text.length)}
        className="text-[12px] font-mono text-muted-foreground bg-white/2 rounded px-2 py-1 cursor-pointer hover:bg-white/10  overflow-hidden border border-transparent"
      >
        <div className="truncate whitespace-pre">{renderLine(lineContent, matchIndices, text.length)}</div>
      </div>
    </div>
  );
};

function SearchTabContentComponent({
  query,
  flatNodes,
  onResultClick,
}: {
  query: string;
  flatNodes: INode[] | null;
  onResultClick: (id: string) => void;
}) {
  const [items, setItems] = useState<RenderItem[]>([]);
  const [collapsedFiles, setCollapsedFiles] = useState<Set<string>>(new Set());
  const [totalFound, setTotalFound] = useState(0);

  const workerRef = useRef<Worker | null>(null);
  const searchIdRef = useRef(0);
  const bufferRef = useRef<RenderItem[]>([]);
  const batchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastNodesRef = useRef<INode[] | null>(null);

  useEffect(() => {
    lastNodesRef.current = flatNodes;

    const searchId = ++searchIdRef.current;
    if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
    setTotalFound(0);
    setItems([]);
    bufferRef.current = [];
    setCollapsedFiles(new Set());

    if (!query || query.trim().length < 1) return;

    const delayDebounceFn = setTimeout(() => {
      workerRef.current?.postMessage({ query, nodes: lastNodesRef.current, searchId });
    }, 250);

    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    if (!flatNodes || !lastNodesRef.current || !query) {
      lastNodesRef.current = flatNodes;
      return;
    }

    const changedNode = flatNodes.find((node, i) => {
      const prev = lastNodesRef.current?.[i];
      return prev && node._id === prev._id && node.content !== prev.content;
    });

    if (changedNode) {
      const matches = searchSingleNode(query, changedNode);

      const newHighlights = matches.reduce((acc, m) => acc + (m.matchIndices?.length || 0), 0);
      const isTitleMatch = changedNode.title.toLowerCase().includes(query.toLowerCase());
      const newFileTotal = newHighlights === 0 && isTitleMatch ? 1 : newHighlights;

      setItems(prev => {
        const oldHeader = prev.find(it => it.type === 'header' && it.nodeId === changedNode._id) as Extract<RenderItem, { type: 'header' }>;
        const oldFileTotal = oldHeader ? oldHeader.count : 0;
        setTotalFound(current => current + (newFileTotal - oldFileTotal));

        const firstIdx = prev.findIndex(it => it.nodeId === changedNode._id);
        const filtered = prev.filter(it => it.nodeId !== changedNode._id);

        if (matches.length === 0) return filtered;

        const newEntries: RenderItem[] = [
          { type: 'header', nodeId: changedNode._id, title: changedNode.title, count: matches.length },
          ...matches.map(m => ({
            type: 'line' as const,
            nodeId: changedNode._id,
            match: { ...m },
            queryLen: query.length,
          })),
        ];

        if (firstIdx === -1) return [...filtered, ...newEntries];
        const result = [...filtered];
        result.splice(firstIdx, 0, ...newEntries);
        return result;
      });
    }

    lastNodesRef.current = flatNodes;
  }, [flatNodes, query]);

  useEffect(() => {
    workerRef.current = new Worker(new URL('@/utils/client/search.worker.ts', import.meta.url));
    const handleMessage = (e: MessageEvent) => {
      const { type, data, searchId } = e.data;
      if (searchId !== searchIdRef.current) return;
      if (type === 'LINE_MATCH_CHUNK') {
        const { nodeId, title, matches } = data;
        const highlights = matches.reduce((acc: number, m: SearchMatch) => acc + (m.matchIndices?.length || 0), 0);
        const occurrencesInChunk = highlights === 0 ? 1 : highlights;

        setTotalFound(prev => prev + occurrencesInChunk);
        bufferRef.current.push({ type: 'header', nodeId, title, count: matches.length });
        matches.forEach((m: SearchMatch) => {
          if (bufferRef.current.length < MAX_VISIBLE_RESULTS) {
            bufferRef.current.push({ type: 'line', nodeId, match: m, queryLen: query.length });
          }
        });
        if (!batchTimerRef.current) {
          batchTimerRef.current = setTimeout(() => {
            setItems(bufferRef.current.slice(0, MAX_VISIBLE_RESULTS));
            batchTimerRef.current = null;
          }, BATCH_UPDATE_MS);
        }
      }
      // if (type === 'DONE') setIsSearching(false);
    };
    workerRef.current.onmessage = handleMessage;
    return () => workerRef.current?.terminate();
  }, [query.length]);

  const toggleFile = useCallback((id: string) => {
    setCollapsedFiles(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleJump = useCallback(
    (nodeId: string, index: number, length: number) => {
      const jump = { nodeId, offset: index, length };
      window.__PENDING_JUMP__ = jump;
      onResultClick(nodeId);
      window.dispatchEvent(new CustomEvent('editor-jump-to', { detail: jump }));
    },
    [onResultClick]
  );

  const visibleItems = useMemo(() => {
    if (collapsedFiles.size === 0) return items;
    return items.filter(it => it.type === 'header' || !collapsedFiles.has(it.nodeId));
  }, [items, collapsedFiles]);

  return (
    <div className="flex-1 flex px-0 pb-0 flex-col overflow-hidden select-none">
      <div className="pt-16 px-4 text-[9px]">{totalFound} results</div>
      <div className="flex-1 flex px-0  pb-0 flex-col overflow-hidden">
        <Virtuoso
          data={visibleItems}
          className="flex flex-col gap-y-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden overflow-x-hidden"
          itemContent={idx => {
            const item = visibleItems[idx];
            const key = item.type === 'header' ? `h-${item.nodeId}-${item.count}` : `l-${item.nodeId}-${item.match.lineNumber}-${item.match.lineContent}`;

            return (
              <SearchRow
                key={key}
                item={item}
                isCollapsed={collapsedFiles.has(item.nodeId)}
                onToggle={toggleFile}
                onJump={handleJump}
                onResultClick={onResultClick}
              />
            );
          }}
          overscan={20}
          style={{ height: '100%' }}
        />
      </div>
    </div>
  );
}

function renderLine(text: string, indices: number[], len: number) {
  if (!indices?.length) return <span>{text}</span>;
  const parts = [];
  let last = 0;
  indices.forEach((start, i) => {
    parts.push(<span key={`t-${i}`}>{text.substring(last, start)}</span>);
    parts.push(
      <mark key={`m-${i}`} className="bg-yellow-500/25 text-yellow-500 font-bold rounded px-0.5">
        {text.substring(start, start + len)}
      </mark>
    );
    last = start + len;
  });
  parts.push(<span key="last">{text.substring(last)}</span>);
  return parts;
}

export const SearchTabContent = memo(SearchTabContentComponent, (prevProps, nextProps) => {
  return prevProps.query === nextProps.query && prevProps.flatNodes === nextProps.flatNodes && prevProps.onResultClick === nextProps.onResultClick;
});
