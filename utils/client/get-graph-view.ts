import { INode } from '@/types';

// 1. THE SAFE REGEX (Prevents Catastrophic Backtracking/Freezing)
const LINK_REGEX = /\[\[([^\]]+)\]\]|\[([^\]]+)\]\(((?:[^()]+|\([^()]*\))+)\)/g;
// 2. THE GATEKEEPER: Checks the TITLE for markdown extensions or empty extensions
const isMarkdownFile = (title: string | undefined | null): boolean => {
  if (!title) return false;
  const lower = title.toLowerCase();

  // Accept standard markdown extensions
  if (lower.endsWith('.md') || lower.endsWith('.mdx') || lower.endsWith('.mdc') || lower.endsWith('.view')) {
    return true;
  }

  // If there is no dot in the title at all, we treat it as an extension-less markdown file
  return !lower.includes('.');
};

export async function generateGraphData(flatNodes: INode[]) {
  console.log(`\n🚀 [Batch Mode] Starting graph generation for ${flatNodes?.length || 0} files...`);

  const normalize = (p: string | undefined | null): string => {
    if (!p) return '';
    let cleanPath = p;
    cleanPath = cleanPath.replace(/[<>]/g, '').replace(/\+/g, ' ');
    try {
      cleanPath = decodeURIComponent(cleanPath);
    } catch {
      cleanPath = cleanPath.replace(/%20/g, ' ').replace(/%28/g, '(').replace(/%29/g, ')');
    }
    // Updated to strip mdx and mdc just in case they sneak in
    return cleanPath
      .replace(/\\/g, '/')
      .replace(/\.(md|mdx|mdc)$/i, '')
      .toLowerCase()
      .trim();
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

  const extractTags = (content: string): string[] => {
    const tags = new Set<string>();

    const addTag = (rawTag: string) => {
      const cleaned = rawTag.replace(/^#/, '').trim();
      if (!cleaned) return;

      const partsLower = cleaned.toLowerCase().split('/');
      let currentPathLower = '';

      partsLower.forEach((part, index) => {
        currentPathLower += (index === 0 ? '' : '/') + part;
        tags.add(currentPathLower);
      });
    };

    const lines = content.replace(/\r/g, '').split('\n');
    let inTagsBlock = false;
    let inFencedCodeBlock = false;

    lines.forEach(line => {
      const trimmed = line.trim();

      if (trimmed.startsWith('```')) {
        inFencedCodeBlock = !inFencedCodeBlock;
        return;
      }

      if (!inFencedCodeBlock) {
        const isHeaderTags = trimmed.startsWith('tags:');
        const isHeaderTag = trimmed.startsWith('tag:');
        const isHeader = isHeaderTags || isHeaderTag;

        if (isHeader) {
          inTagsBlock = true;
          const rest = trimmed.substring(isHeaderTags ? 5 : 4).trim();

          if (rest) {
            rest
              .replace(/[\[\]]/g, '')
              .split(',')
              .forEach(t => addTag(t));
          }
        } else if (inTagsBlock) {
          if (trimmed.includes(':') || trimmed === '---' || trimmed === '') {
            inTagsBlock = false;
          } else {
            if (trimmed.startsWith('-')) {
              addTag(trimmed.substring(1));
            } else {
              trimmed.split(',').forEach(t => addTag(t));
            }
          }
        }

        if (!inTagsBlock) {
          const tagRegex = /(^|\s)#([a-zA-Z0-9_\-\/]+)/g;
          let match;
          while ((match = tagRegex.exec(line)) !== null) {
            const before = line.substring(0, match.index);
            const backticksBefore = (before.match(/`/g) || []).length;
            if (backticksBefore % 2 === 0) {
              addTag(match[2]);
            }
          }
        }
      }
    });

    return Array.from(tags);
  };

  // Map ALL files into the graph (CSS, JSON, etc. will still be dots)
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
  const tagNodesMap = new Map<string, (typeof nodesArr)[0]>();

  console.log(`[Batch Mode] Maps prepared. Starting Regex parsing...`);

  // 🚨 THE CHUNKED LOOP FOR PERFORMANCE 🚨
  for (let i = 0; i < flatNodes.length; i++) {
    const node = flatNodes[i];

    // Yield to the Node.js Event loop every 50 files
    if (i > 0 && i % 50 === 0) {
      await new Promise(resolve => setTimeout(resolve, 10)); // Bumped to 10ms for safer yielding
    }

    // Skip if there's no content
    if (!node.content) continue;

    // 🚨 GATEKEEPER: Check the TITLE. If it's not markdown, skip content parsing!
    if (!isMarkdownFile(node.title)) {
      continue;
    }

    const sourceId = node._id.toString();

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

      if (target && target._id !== sourceId) {
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

    const allTags = extractTags(node.content);

    allTags.forEach(tagName => {
      const tagId = `tag-${tagName}`;

      if (!tagNodesMap.has(tagId)) {
        tagNodesMap.set(tagId, {
          _id: tagId,
          title: '#' + tagName,
          type: 'tag',
          x: (Math.random() - 0.5) * 2000,
          y: (Math.random() - 0.5) * 2000,
          vx: 0,
          vy: 0,
          radius: 10,
        } as (typeof nodesArr)[0]);
      }

      const linkKey = [sourceId, tagId].sort().join('-');
      if (!seenLinks.has(linkKey)) {
        seenLinks.add(linkKey);
        linksArr.push({ source: sourceId, target: tagId });
        adjCounts.set(sourceId, (adjCounts.get(sourceId) || 0) + 1);
        adjCounts.set(tagId, (adjCounts.get(tagId) || 0) + 1);
      }
    });
  }

  console.log(`✅ [Batch Mode] All ${flatNodes.length} files parsed! Finalizing arrays...`);

  nodesArr.push(...Array.from(tagNodesMap.values()));

  nodesArr.forEach(n => {
    const connections = adjCounts.get(n._id) || 0;
    n.radius = connections > 20 ? 25 : connections > 10 ? 18 : connections > 3 ? 14 : 10;
  });

  return { d3Nodes: nodesArr, d3Links: linksArr };
}
