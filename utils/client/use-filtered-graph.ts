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

    // STEP 1: Define the base pool of nodes (remove tags immediately if disabled)
    const baseNodes = data.d3Nodes.filter(n => showTags || n.type !== 'tag');
    const baseNodeIds = new Set(baseNodes.map(n => n._id));

    // STEP 2: Define valid links (must connect nodes that are in the base pool)
    const validLinks = (data.d3Links || []).filter(l => baseNodeIds.has(l.source) && baseNodeIds.has(l.target));

    // STEP 3: Build Adjacency Map based ONLY on visible items
    const activeAdj = new Map<string, Set<string>>();
    baseNodes.forEach(n => activeAdj.set(n._id, new Set<string>()));
    validLinks.forEach(l => {
      activeAdj.get(l.source)?.add(l.target);
      activeAdj.get(l.target)?.add(l.source);
    });

    // STEP 4: Apply Orphan and Search logic
    const visibleNodeIds = new Set<string>();

    baseNodes.forEach(n => {
      // If a node has 0 connections in the ACTIVE map, it is a true visual orphan
      const isOrphan = (activeAdj.get(n._id)?.size || 0) === 0;
      if (!showOrphans && isOrphan) return;

      if (!query) {
        visibleNodeIds.add(n._id);
      } else {
        const isMatch = showTags
          ? n.type === 'tag' && n.title.toLowerCase().includes(cleanTagQuery)
          : n.type !== 'tag' && n.title.toLowerCase().includes(query);

        if (isMatch) {
          visibleNodeIds.add(n._id);
          const neighbors = activeAdj.get(n._id);
          if (neighbors) {
            neighbors.forEach(neighborId => visibleNodeIds.add(neighborId));
          }
        }
      }
    });

    // STEP 5: Final D3 Array formatting
    const nodesArr = baseNodes.filter(n => visibleNodeIds.has(n._id)).map(n => ({ ...n }));

    const nodeMap = new Map<string, GraphNode>();
    nodesArr.forEach(n => nodeMap.set(n._id, n));

    const linksArr: GraphLink[] = [];
    const finalAdj = new Map<string, Set<string>>();
    nodesArr.forEach(n => finalAdj.set(n._id, new Set<string>()));

    validLinks.forEach(l => {
      const sourceNode = nodeMap.get(l.source);
      const targetNode = nodeMap.get(l.target);

      if (sourceNode && targetNode) {
        linksArr.push({ source: sourceNode, target: targetNode });
        finalAdj.get(sourceNode._id)?.add(targetNode._id);
        finalAdj.get(targetNode._id)?.add(sourceNode._id);
      }
    });

    return { filteredNodes: nodesArr, filteredLinks: linksArr, adjacency: finalAdj };
  }, [data, searchQuery, showOrphans, showTags]);
}
