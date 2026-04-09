import { INode } from '@/types';
import { getMarkdownNodes } from './markdown-nodes';

const isMarkdownFile = (title: string | undefined | null): boolean => {
  if (!title) return false;
  const lower = title.toLowerCase();

  if (lower.endsWith('.md') || lower.endsWith('.mdx') || lower.endsWith('.mdc')) {
    return true;
  }

  return !lower.includes('.');
};

/**
 * Helper to count tags while preserving their original casing for the UI.
 */
const addTagToRecord = (tag: string, tagCounts: Record<string, number>, tagDisplayNames: Record<string, string>) => {
  const rawTag = tag.replace(/^#/, '').trim();
  if (!rawTag) return;

  const lowerTag = rawTag.toLowerCase();
  const partsLower = lowerTag.split('/');
  const partsOriginal = rawTag.split('/');

  let currentPathLower = '';
  let currentPathOriginal = '';

  partsLower.forEach((part, index) => {
    currentPathLower += (index === 0 ? '' : '/') + part;
    currentPathOriginal += (index === 0 ? '' : '/') + partsOriginal[index];

    tagCounts[currentPathLower] = (tagCounts[currentPathLower] || 0) + 1;

    if (!tagDisplayNames[currentPathLower]) {
      tagDisplayNames[currentPathLower] = currentPathOriginal;
    }
  });
};

export const getProjectTagsCount = async (flatNodes: INode[]) => {
  const tagCounts: Record<string, number> = {};
  const tagDisplayNames: Record<string, string> = {};

  const markdownNodes = getMarkdownNodes(flatNodes);

  markdownNodes.forEach(node => {
    if (!isMarkdownFile(node.title)) return;

    const content = (node.content || '').replace(/\r/g, '');
    const lines = content.split('\n');

    let inTagsBlock = false;
    let inFencedCodeBlock = false;

    lines.forEach(line => {
      const trimmed = line.trim();

      if (trimmed.startsWith('```')) return (inFencedCodeBlock = !inFencedCodeBlock);

      if (!inFencedCodeBlock) {
        const isHeaderTags = trimmed.startsWith('tags:');
        const isHeaderTag = trimmed.startsWith('tag:');
        const isHeader = isHeaderTags || isHeaderTag;

        if (isHeader) {
          inTagsBlock = true;
          // Dynamically slice based on whether it's 'tag:' (4) or 'tags:' (5)
          const rest = trimmed.substring(isHeaderTags ? 5 : 4).trim();

          if (rest) {
            rest
              .replace(/[\[\]]/g, '')
              .split(',')
              .forEach(t => addTagToRecord(t, tagCounts, tagDisplayNames));
          }
        } else if (inTagsBlock) {
          if (trimmed.includes(':') || trimmed === '---' || trimmed === '') {
            inTagsBlock = false;
          } else {
            if (trimmed.startsWith('-')) {
              addTagToRecord(trimmed.substring(1), tagCounts, tagDisplayNames);
            } else {
              trimmed.split(',').forEach(t => addTagToRecord(t, tagCounts, tagDisplayNames));
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
              addTagToRecord(match[2], tagCounts, tagDisplayNames);
            }
          }
        }
      }
    });
  });

  const tagsList = Object.entries(tagCounts)
    .map(([lowerName, count]) => ({
      name: tagDisplayNames[lowerName],
      count,
    }))
    .sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return a.name.localeCompare(b.name);
    });

  return tagsList;
};
