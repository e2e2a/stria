import { performSearch } from './search-nodes-utils';

self.onmessage = (e: MessageEvent) => {
  const { query, nodes, searchId } = e.data;
  if (!query || !nodes) {
    self.postMessage({ type: 'DONE', searchId });
    return;
  }

  for (let i = 0; i < nodes.length; i++) {
    const nodeResults = performSearch(query, [nodes[i]]);
    if (nodeResults.length === 0) continue;

    const file = nodeResults[0];

    self.postMessage({
      type: 'LINE_MATCH_CHUNK',
      data: {
        nodeId: file.nodeId,
        title: file.title,
        matches: file.matches,
      },
      searchId,
    });
  }

  self.postMessage({ type: 'DONE', searchId });
};
