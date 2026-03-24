import { searchSingleNode, SearchMatch } from './search-nodes-utils';
import { INode } from '@/types';

interface WorkerResult {
  nodeId: string;
  title: string;
  matches: SearchMatch[];
}

let latestSearchId = 0;

self.onmessage = (e: MessageEvent<{ query: string; nodes: INode[]; searchId: number }>) => {
  const { query, nodes, searchId } = e.data;
  latestSearchId = searchId;

  // If query is empty, tell the main thread we are done immediately
  if (!query || !nodes || query.trim().length === 0) {
    self.postMessage({ type: 'DONE', searchId });
    return;
  }

  const CHUNK_SIZE = 50;
  let buffer: WorkerResult[] = [];

  for (let i = 0; i < nodes.length; i++) {
    // If a new searchId arrived, KILL THIS THREAD'S EXECUTION IMMEDIATELY
    if (searchId !== latestSearchId) return;

    const matches = searchSingleNode(query, nodes[i]);

    if (matches && matches.length > 0) {
      buffer.push({
        nodeId: nodes[i]._id,
        title: nodes[i].title,
        matches: matches,
      });
    }

    if (buffer.length >= CHUNK_SIZE) {
      self.postMessage({ type: 'LINE_MATCH_CHUNK', data: buffer, searchId });
      buffer = [];
    }
  }

  if (buffer.length > 0 && searchId === latestSearchId) {
    self.postMessage({ type: 'LINE_MATCH_CHUNK', data: buffer, searchId });
  }

  self.postMessage({ type: 'DONE', searchId });
};
