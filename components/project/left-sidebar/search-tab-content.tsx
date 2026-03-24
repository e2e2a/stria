'use client';

import { useEffect, useState, useRef, useCallback, useMemo, memo, ReactElement } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { SearchMatch, searchSingleNode } from '@/utils/client/search-nodes-utils';
import { INode } from '@/types';

const MAX_VISIBLE_RESULTS = 10000;
const BATCH_UPDATE_MS = 50;

type RenderItem =
  | { type: 'header'; nodeId: string; title: string; count: number }
  | { type: 'line'; nodeId: string; match: SearchMatch; queryLen: number };

interface WorkerResult {
  nodeId: string;
  title: string;
  matches: SearchMatch[];
}

const SearchRow = memo(function SearchRow({
  item,
  isCollapsed,
  onToggle,
  onJump,
  onResultClick,
}: {
  item: RenderItem;
  isCollapsed: boolean;
  onToggle: (id: string) => void;
  onJump: (nodeId: string, index: number, len: number, matchIndices: number[]) => void;
  onResultClick: (id: string) => void;
}) {
  if (item.type === 'header') {
    return (
      <div className="px-3 flex w-full select-none">
        <div className="flex flex-1 items-center gap-2 px-1 cursor-pointer hover:bg-white/5 min-w-0" onClick={() => onToggle(item.nodeId)}>
          <div className="w-4 shrink-0 flex items-center justify-center">
            {item.count > 0 ? isCollapsed ? <ChevronRight size={10} /> : <ChevronDown size={10} /> : null}
          </div>
          <div
            className="flex-1 min-w-0 h-full"
            onClick={e => {
              e.stopPropagation();
              onResultClick(item.nodeId);
            }}
          >
            <span className="text-[14px] font-bold uppercase truncate block text-foreground/90">{item.title}</span>
          </div>
          <span className="text-[10px] opacity-40 shrink-0 tabular-nums">{item.count}</span>
        </div>
      </div>
    );
  }

  const { lineContent, matchIndices, text, index } = item.match;
  return (
    <div className="px-3 py-px">
      <div
        onClick={() => onJump(item.nodeId, index, text.length, matchIndices)}
        className="text-[12px] font-mono text-muted-foreground bg-white/5 rounded px-2 py-1 cursor-pointer hover:bg-white/10 overflow-hidden border border-transparent"
      >
        <div className="truncate whitespace-pre">{renderLine(lineContent, matchIndices, text.length)}</div>
      </div>
    </div>
  );
});

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

  // 1. Initial cleanup on unmount
  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
    };
  }, []);

  // 2. The Main Search Orchestrator
  useEffect(() => {
    const currentId = ++searchIdRef.current;

    // STEP A: KILL EVERYTHING INSTANTLY
    if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
    batchTimerRef.current = null;
    workerRef.current?.terminate();
    workerRef.current = null;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems([]);
    setTotalFound(0);
    bufferRef.current = [];
    setCollapsedFiles(new Set());

    if (!query || query.trim().length < 1) return;

    const delay = setTimeout(() => {
      const worker = new Worker(new URL('@/utils/client/search.worker.ts', import.meta.url));
      workerRef.current = worker;

      worker.onmessage = (e: MessageEvent<{ type: string; data: WorkerResult[]; searchId: number }>) => {
        const { type, data, searchId } = e.data;

        if (searchId !== currentId) return;

        if (type === 'LINE_MATCH_CHUNK') {
          data.forEach(file => {
            const { nodeId, title, matches } = file;
            const highlights = matches.reduce((acc, m) => acc + (m.matchIndices?.length || 0), 0);
            setTotalFound(prev => prev + (highlights || (matches.length > 0 ? matches.length : 1)));

            bufferRef.current.push({ type: 'header', nodeId, title, count: matches.length });
            matches.forEach(m => {
              if (bufferRef.current.length < MAX_VISIBLE_RESULTS) {
                bufferRef.current.push({ type: 'line', nodeId, match: m, queryLen: query.length });
              }
            });
          });

          if (!batchTimerRef.current) {
            batchTimerRef.current = setTimeout(() => {
              setItems([...bufferRef.current]);
              batchTimerRef.current = null;
            }, BATCH_UPDATE_MS);
          }
        }
      };

      worker.postMessage({ query, nodes: flatNodes, searchId: currentId });
    }, 180);

    return () => {
      clearTimeout(delay);
      workerRef.current?.terminate();
    };
  }, [query, flatNodes]);

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
        const firstIdx = prev.findIndex(it => it.nodeId === changedNode._id);
        const oldHeader = prev[firstIdx] as Extract<RenderItem, { type: 'header' }> | undefined;
        const oldFileTotal = oldHeader?.type === 'header' ? oldHeader.count : 0;

        setTotalFound(current => current + (newFileTotal - oldFileTotal));
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

  const toggleFile = useCallback((id: string) => {
    setCollapsedFiles(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleJump = useCallback(
    (nodeId: string, index: number, length: number, matchIndices: number[]) => {
      const jump = { nodeId, offset: index, length, matchIndices };
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
    <div className="flex-1 flex flex-col overflow-hidden select-none bg-background">
      <div className="pt-16 px-4 pb-2 text-[10px] uppercase tracking-wider opacity-50 font-bold">{totalFound} results</div>
      <div className="flex-1">
        <Virtuoso
          data={visibleItems}
          className="[scrollbar-width:none] overflow-x-hidden"
          itemContent={idx => {
            const item = visibleItems[idx];
            const key = item.type === 'header' ? `h-${item.nodeId}` : `l-${item.nodeId}-${item.match.index}-${item.match.lineNumber}`;
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
          overscan={50}
        />
      </div>
    </div>
  );
}

function renderLine(text: string, indices: number[], len: number): ReactElement[] | ReactElement {
  if (!indices?.length) return <span>{text}</span>;
  const parts: ReactElement[] = [];
  let last = 0;
  indices.forEach((start, i) => {
    parts.push(<span key={`t-${i}`}>{text.substring(last, start)}</span>);
    parts.push(
      <mark key={`m-${i}`} className="bg-yellow-500/20 text-yellow-500 font-bold rounded-sm px-0.5">
        {text.substring(start, start + len)}
      </mark>
    );
    last = start + len;
  });
  parts.push(<span key="last">{text.substring(last)}</span>);
  return parts;
}

export const SearchTabContent = memo(SearchTabContentComponent);
