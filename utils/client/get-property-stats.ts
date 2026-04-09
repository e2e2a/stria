import { INode } from '@/types';

const isMarkdownFile = (title: string | undefined | null): boolean => {
  if (!title) return false;
  const lower = title.toLowerCase();

  if (lower.endsWith('.md') || lower.endsWith('.mdx') || lower.endsWith('.mdc')) {
    return true;
  }

  return !lower.includes('.');
};

export interface PropertyStat {
  key: string;
  count: number;
}

export function getAllPropertyStats(nodes: INode[]): PropertyStat[] {
  const frequencyMap: Record<string, number> = {};

  nodes.forEach(node => {
    if (!isMarkdownFile(node.title)) return;

    const content = node.content || '';
    if (!content.startsWith('---')) return;

    const endIdx = content.indexOf('---', 3);
    if (endIdx === -1) return;
    const frontmatter = content.substring(3, endIdx);

    const lines = frontmatter.split('\n');
    const seenInThisNode = new Set<string>();

    lines.forEach(line => {
      const match = line.match(/^([a-zA-Z0-9_-]+):/);

      if (match) {
        const key = match[1].trim().toLowerCase();

        if (!seenInThisNode.has(key)) {
          frequencyMap[key] = (frequencyMap[key] || 0) + 1;
          seenInThisNode.add(key);
        }
      }
    });
  });

  return Object.entries(frequencyMap)
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
}
