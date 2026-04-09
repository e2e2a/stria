import { INode } from '@/types';

export function generateGraphData(flatNodes: INode[]) {
  const LINK_REGEX = /\[\[([^\]]+)\]\]|\[([^\]]+)\]\(((?:[^()]+|\([^()]*\))+)\)/g;

  const normalize = (p: string | undefined | null): string => {
    if (!p) return '';
    let cleanPath = p;

    cleanPath = cleanPath.replace(/[<>]/g, '').replace(/\+/g, ' ');

    try {
      cleanPath = decodeURIComponent(cleanPath);
    } catch {
      cleanPath = cleanPath.replace(/%20/g, ' ').replace(/%28/g, '(').replace(/%29/g, ')');
    }

    return cleanPath.replace(/\\/g, '/').replace(/\.md$/i, '').toLowerCase().trim();
  };

  const getBasename = (p: string) => p.split('/').pop() || '';

  const resolveRelative = (basePath: string, linkPath: string) => {
    const parts = basePath.replace(/\\/g, '/').split('/');
    parts.pop();
    const linkParts = linkPath.replace(/\\/g, '/').split('/');
    for (const part of linkParts) {
      if (part === '.') continue;
      if (part === '..') parts.pop();
      else parts.push(part);
    }
    return normalize(parts.join('/'));
  };

  const nodesArr = flatNodes.map(n => {
    const { content, ...rest } = n;
    return {
      ...rest,
      _id: n._id.toString(),
      type: 'file',
      x: (Math.random() - 0.5) * 2000,
      y: (Math.random() - 0.5) * 2000,
      vx: 0,
      vy: 0,
      radius: 10,
    };
  });

  const fullPathMap = new Map();
  const nameMap = new Map<string, (typeof nodesArr)[0][]>();

  nodesArr.forEach(n => {
    const full = normalize(n.path);
    const name = getBasename(full);
    fullPathMap.set(full, n);
    if (!nameMap.has(name)) nameMap.set(name, []);
    nameMap.get(name)!.push(n);
  });

  const linksArr: { source: string; target: string }[] = [];
  const adjCounts = new Map<string, number>();
  const seenLinks = new Set<string>();

  flatNodes.forEach(node => {
    if (!node.content) return;

    let match;
    LINK_REGEX.lastIndex = 0;

    const normalizedNodePath = normalize(node.path);
    const currentDir = normalizedNodePath.split('/').slice(0, -1).join('/');

    while ((match = LINK_REGEX.exec(node.content)) !== null) {
      let rawLink = (match[1] || match[3] || '').split('|')[0].split('#')[0];
      rawLink = rawLink.replace(/\s+["'].*?["']$/, '').trim();

      const linkName = normalize(rawLink);

      let target;

      const siblingPath = currentDir ? `${currentDir}/${linkName}` : linkName;
      target = fullPathMap.get(siblingPath);

      if (!target && rawLink.startsWith('.')) {
        const resolvedPath = resolveRelative(node.path || '', linkName);
        target = fullPathMap.get(resolvedPath);
      }

      if (!target) {
        const potentials = nameMap.get(linkName);
        if (potentials) target = potentials[0];
      }

      if (target && target._id !== node._id.toString()) {
        const sourceId = node._id.toString();
        const targetId = target._id.toString();
        const linkKey = [sourceId, targetId].sort().join('-');

        if (!seenLinks.has(linkKey)) {
          seenLinks.add(linkKey);
          linksArr.push({ source: sourceId, target: targetId });
          adjCounts.set(sourceId, (adjCounts.get(sourceId) || 0) + 1);
          adjCounts.set(targetId, (adjCounts.get(targetId) || 0) + 1);
        }
      }
    }
  });

  nodesArr.forEach(n => {
    const connections = adjCounts.get(n._id) || 0;
    n.radius = connections > 20 ? 25 : connections > 10 ? 18 : connections > 3 ? 14 : 10;
  });

  return { d3Nodes: nodesArr, d3Links: linksArr };
}
