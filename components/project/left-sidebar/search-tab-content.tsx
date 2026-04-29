'use client';

import { useEffect, useState, useCallback, useMemo, memo, ReactElement, useDeferredValue } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { INode } from '@/types';
import { SearchMatch, SearchResult, searchSingleNode } from '@/utils/client/search-nodes-utils';
import { useProjectSearchQuery } from '@/hooks/project/useProjectQuery';

const MAX_VISIBLE_RESULTS = 10000;

type RenderItem =
  | { type: 'header'; nodeId: string; title: string; count: number }
  | { type: 'line'; nodeId: string; match: SearchMatch; queryLen: number };

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
        <div className="flex flex-1 items-center gap-2 px-1 cursor-pointer group hover:bg-secondary min-w-0" onClick={() => onToggle(item.nodeId)}>
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
            <span className="text-[16px] font-bold uppercase truncate block text-foreground/90">{item.title}</span>
          </div>
          <span className="text-[10px] opacity-40 shrink-0 tabular-nums text-muted-foreground group-hover:text-foreground">{item.count}</span>
        </div>
      </div>
    );
  }

  const { lineContent, matchIndices, text, index } = item.match;
  return (
    <div className="px-3 py-px">
      <div
        onClick={() => onJump(item.nodeId, index, text.length, matchIndices)}
        className="text-[12px] text-muted-foreground hover:text-foreground bg-secondary/80 rounded px-2 py-1 cursor-pointer hover:bg-secondary overflow-hidden border border-transparent"
      >
        <div className="truncate whitespace-pre">{renderLine(lineContent, matchIndices, text.length)}</div>
      </div>
    </div>
  );
});

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

function SearchTabContentComponent({ query, onResultClick }: { query: string; onResultClick: (id: string) => void }) {
  const params = useParams();
  const projectId = params.pid || '';

  const debouncedQuery = useDeferredValue(query);
  const { data: backendData, isFetching } = useProjectSearchQuery(projectId, debouncedQuery);

  const [realTimeOverrides, setRealTimeOverrides] = useState<Record<string, SearchResult>>({});
  const [collapsedFiles, setCollapsedFiles] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handleActiveEditorChange = (e: Event) => {
      const { nodeId, title, content } = (e as CustomEvent).detail;
      if (!query) return;

      const matches = searchSingleNode(query, { _id: nodeId, title, content } as INode);

      setRealTimeOverrides(prev => ({
        ...prev,
        [nodeId]: { nodeId, title, matches },
      }));
    };

    window.addEventListener('editor-content-changed', handleActiveEditorChange);
    return () => window.removeEventListener('editor-content-changed', handleActiveEditorChange);
  }, [query]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRealTimeOverrides({});
  }, [debouncedQuery]);

  // 5. Merge Data & Calculate Results
  const { visibleItems, totalFound } = useMemo(() => {
    if (!query) return { visibleItems: [], totalFound: 0 };

    const results = backendData || [];
    const mergedResults: SearchResult[] = results.map(res => realTimeOverrides[res.nodeId] || res);

    Object.values(realTimeOverrides).forEach(override => {
      if (!results.find(r => r.nodeId === override.nodeId)) {
        mergedResults.unshift(override);
      }
    });

    let newTotal = 0;
    const items: RenderItem[] = [];

    mergedResults.forEach(file => {
      const { nodeId, title, matches } = file;
      const isTitleMatch = title.toLowerCase().includes(query.toLowerCase());

      let highlights = matches.reduce((acc, m) => acc + (m.matchIndices?.length || 0), 0);
      if (highlights === 0 && matches.length > 0) highlights = matches.length;

      const fileTotal = highlights || (isTitleMatch ? 1 : 0);

      if (fileTotal === 0) return;

      newTotal += fileTotal;

      const isCollapsed = collapsedFiles.has(nodeId);
      const neededSlots = matches.length > 0 ? 2 : 1;

      if (items.length + neededSlots <= MAX_VISIBLE_RESULTS) {
        items.push({ type: 'header', nodeId, title, count: matches.length });

        if (!isCollapsed) {
          for (const m of matches) {
            if (items.length >= MAX_VISIBLE_RESULTS) break;
            items.push({ type: 'line', nodeId, match: m, queryLen: query.length });
          }
        }
      }
    });

    return { visibleItems: items, totalFound: newTotal };
  }, [backendData, realTimeOverrides, collapsedFiles, query]);

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

  return (
    <div className="flex-1 flex flex-col overflow-hidden select-none bg-sidebar">
      <div className="pt-12 px-4 pb-2 text-[10px] uppercase tracking-wider opacity-50 font-bold flex items-center justify-between">
        <span>{totalFound} results</span>
        {isFetching && <div className="w-3 h-3 border-2 border-primary/50 border-t-primary rounded-full animate-spin" />}
      </div>
      <div className="flex-1">
        <Virtuoso
          data={visibleItems}
          className="[scrollbar-width:none] overflow-x-hidden"
          itemContent={idx => {
            const item = visibleItems[idx];
            return (
              <SearchRow
                key={item.type === 'header' ? `h-${item.nodeId}` : `l-${item.nodeId}-${item.match.index}`}
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

export const SearchTabContent = memo(SearchTabContentComponent);
