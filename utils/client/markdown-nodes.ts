import { INode } from '@/types';

export const getMarkdownNodes = (nodes: INode[]): INode[] => {
  return nodes.filter(node => {
    if (!node.title) return false;
    const lowerTitle = node.title.toLowerCase();
    return lowerTitle.endsWith('.md') || lowerTitle.endsWith('.mdx');
  });
};
