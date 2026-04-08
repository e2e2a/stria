// 'use server';
import { INode } from '@/types';

export function sortNodeTree(nodes: INode[]): INode[] {
  const sortFn = (a: INode, b: INode) => {
    if (a.type === 'folder' && b.type !== 'folder') return -1;
    if (a.type !== 'folder' && b.type === 'folder') return 1;

    return a.title.localeCompare(b.title, undefined, {
      sensitivity: 'base',
      numeric: true,
    });
  };

  nodes.sort(sortFn);

  for (const node of nodes) {
    if (node.children && node.children.length > 0) {
      sortNodeTree(node.children);
    }
  }

  return nodes;
}
