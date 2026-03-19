'use client';
import React, { useDeferredValue, useMemo, useRef, useState, useCallback } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { useNodesProjectIdQuery } from '@/hooks/node/useNodeQuery';
import { flattenNodeTree } from '@/utils/client/node-utils';

interface CompactMatch {
  line: string;
  start: number;
  text: string;
}

interface FlattenedMatch {
  fileId: string;
  fileTitle: string;
  match: CompactMatch;
}

const MAX_MATCHES = 10000;

const Page = () => {
  const { data: nData } = useNodesProjectIdQuery('69b4ec984cf97ba6e906aef7');
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [totalMatches, setTotalMatches] = useState(0);
  const [fileCount, setFileCount] = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const searchIdRef = useRef(0);
  const debounceTimerRef = useRef<NodeJS.Timeout>(null);

  const deferredNodes = useDeferredValue(nData?.nodes);
  const flatNodes = useMemo(() => flattenNodeTree(deferredNodes), [deferredNodes]);

  // Refs to store data without causing re-renders
  const filesRef = useRef<Map<string, { title: string; matches: CompactMatch[] }>>(new Map());
  const flattenedMatchesRef = useRef<FlattenedMatch[]>([]);

  // Worker message handler
  const handleWorkerMessage = useCallback((e: MessageEvent) => {
    const { type, data, searchId } = e.data;
    if (searchId !== searchIdRef.current) return;

    if (type === 'FILE_INFO') {
      filesRef.current.set(data.nodeId, { title: data.title, matches: [] });
      setFileCount(filesRef.current.size);
    }

    if (type === 'MATCH_CHUNK') {
      const file = filesRef.current.get(data.nodeId);
      if (!file) return;

      // Stop processing if limit already reached
      if (flattenedMatchesRef.current.length >= MAX_MATCHES) {
        // Terminate worker to free resources
        if (workerRef.current) {
          workerRef.current.terminate();
          workerRef.current = null;
        }
        setIsSearching(false);
        return;
      }

      const remaining = MAX_MATCHES - flattenedMatchesRef.current.length;
      const matchesToAdd = data.matches.slice(0, remaining);

      if (matchesToAdd.length > 0) {
        file.matches.push(...matchesToAdd);
        const newFlattened: FlattenedMatch[] = matchesToAdd.map((match: CompactMatch) => ({
          fileId: data.nodeId,
          fileTitle: file.title,
          match,
        }));
        flattenedMatchesRef.current.push(...newFlattened);
        setTotalMatches(flattenedMatchesRef.current.length);
      }

      if (flattenedMatchesRef.current.length >= MAX_MATCHES) {
        setLimitReached(true);
        if (workerRef.current) {
          workerRef.current.terminate();
          workerRef.current = null;
        }
        setIsSearching(false);
      }
    }

    if (type === 'DONE') {
      setIsSearching(false);
    }
  }, []);

  const debouncedSearch = useCallback(
    (searchQuery: string) => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

      if (!searchQuery) {
        searchIdRef.current++;
        filesRef.current.clear();
        flattenedMatchesRef.current = [];
        setTotalMatches(0);
        setFileCount(0);
        setIsSearching(false);
        setLimitReached(false);
        return;
      }

      debounceTimerRef.current = setTimeout(() => {
        const searchId = ++searchIdRef.current;
        filesRef.current.clear();
        flattenedMatchesRef.current = [];
        setTotalMatches(0);
        setFileCount(0);
        setIsSearching(true);
        setLimitReached(false);

        if (workerRef.current) workerRef.current.terminate();
        const newWorker = new Worker(new URL('@/utils/client/search.worker.ts', import.meta.url));
        newWorker.onmessage = handleWorkerMessage;
        newWorker.onerror = err => {
          console.error('Worker error:', err);
          setIsSearching(false);
        };
        workerRef.current = newWorker;

        newWorker.postMessage({
          query: searchQuery,
          nodes: flatNodes,
          searchId,
        });
      }, 300);
    },
    [flatNodes, handleWorkerMessage]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    debouncedSearch(e.target.value);
  };

  // Row component – reconstructs display from compact match
  const Row = (index: number) => {
    const item = flattenedMatchesRef.current[index];
    if (!item) return null;
    const { fileTitle, match } = item;
    const before = match.line.substring(0, match.start);
    const after = match.line.substring(match.start + match.text.length);
    return (
      <div className="border-b border-gray-200 p-2 hover:bg-gray-50">
        <div className="text-xs text-gray-500 mb-1">{fileTitle}</div>
        <div className="text-sm">
          <span>{before}</span>
          <mark className="bg-yellow-200 px-0.5 rounded mx-0.5">{match.text}</mark>
          <span>{after}</span>
        </div>
      </div>
    );
  };

  const deferredTotalMatches = useDeferredValue(totalMatches);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">Batch Search Test Page</h1>

      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Type to search... (debounced)"
          className="border px-2 py-1 rounded flex-1"
          autoFocus
        />
      </div>

      {limitReached && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded">
          <p className="font-bold">Search truncated</p>
          <p>Only the first {MAX_MATCHES.toLocaleString()} matches are shown. Please refine your search.</p>
        </div>
      )}

      {isSearching && (
        <div className="space-y-2 bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between text-blue-700">
            <div className="font-medium">
              Found {deferredTotalMatches.toLocaleString()} match{deferredTotalMatches !== 1 ? 'es' : ''} in {fileCount.toLocaleString()} file
              {fileCount !== 1 ? 's' : ''}
            </div>
            <div className="text-sm bg-white px-3 py-1 rounded-full shadow-sm">{deferredTotalMatches.toLocaleString()} total</div>
          </div>
        </div>
      )}

      {totalMatches > 0 ? (
        <div className="border rounded-lg" style={{ height: '600px', width: '100%' }}>
          <Virtuoso
            style={{ height: '100%', width: '100%' }}
            totalCount={totalMatches}
            itemContent={Row}
            overscan={200}
            components={{
              Footer: () => <div className="text-center text-gray-500 text-sm py-4">{totalMatches.toLocaleString()} total matches</div>,
            }}
          />
        </div>
      ) : (
        <div className="text-gray-500 text-center py-8">
          {!isSearching && query && 'No matches found'}
          {!isSearching && !query && 'Start typing to search...'}
        </div>
      )}
    </div>
  );
};

export default Page;
