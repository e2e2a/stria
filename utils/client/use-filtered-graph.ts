import { useMemo } from 'react';
import { GraphNode, GraphViewResponse } from '@/lib/client/api/projectClient';

export type GraphLink = {
  source: string | GraphNode;
  target: string | GraphNode;
};

export function useFilteredGraph(data: GraphViewResponse | undefined, searchQuery: string, showOrphans: boolean, showTags: boolean) {
  return useMemo(() => {
    if (!data || !data.d3Nodes) return { filteredNodes: [], filteredLinks: [], adjacency: new Map() };

    const query = searchQuery.toLowerCase().trim();
    const cleanTagQuery = query.replace(/^#/, '');
    const fullAdj = new Map<string, Set<string>>();

    data.d3Nodes.forEach(n => fullAdj.set(n._id, new Set<string>()));

    const validLinks = data.d3Links || [];
    validLinks.forEach(l => {
      fullAdj.get(l.source)?.add(l.target);
      fullAdj.get(l.target)?.add(l.source);
    });

    const visibleNodeIds = new Set<string>();

    data.d3Nodes.forEach(n => {
      if (n.type === 'tag' && !showTags) return;

      const isOrphan = fullAdj.get(n._id)?.size === 0;
      if (!showOrphans && isOrphan) return;

      if (!query) {
        visibleNodeIds.add(n._id);
      } else {
        const isMatch = showTags
          ? n.type === 'tag' && n.title.toLowerCase().includes(cleanTagQuery)
          : n.type !== 'tag' && n.title.toLowerCase().includes(query);

        if (isMatch) {
          visibleNodeIds.add(n._id);
          const neighbors = fullAdj.get(n._id);
          if (neighbors) {
            neighbors.forEach(neighborId => visibleNodeIds.add(neighborId));
          }
        }
      }
    });

    const nodesArr = data.d3Nodes
      .filter(n => {
        if (!showTags && n.type === 'tag') return false;
        return visibleNodeIds.has(n._id);
      })
      .map(n => ({ ...n }));

    const nodeMap = new Map<string, GraphNode>();
    nodesArr.forEach(n => nodeMap.set(n._id, n));

    const linksArr: GraphLink[] = [];
    const adj = new Map<string, Set<string>>();
    nodesArr.forEach(n => adj.set(n._id, new Set<string>()));

    validLinks.forEach(l => {
      const sourceNode = nodeMap.get(l.source);
      const targetNode = nodeMap.get(l.target);

      if (sourceNode && targetNode) {
        linksArr.push({ source: sourceNode, target: targetNode });
        adj.get(sourceNode._id)?.add(targetNode._id);
        adj.get(targetNode._id)?.add(sourceNode._id);
      }
    });

    return { filteredNodes: nodesArr, filteredLinks: linksArr, adjacency: adj };
  }, [data, searchQuery, showOrphans, showTags]);
}
