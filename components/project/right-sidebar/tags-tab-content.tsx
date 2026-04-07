import React, { useMemo, useState, useEffect } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { ChevronRight, Hash, Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useProjectTagsQuery } from '@/hooks/project/useProjectQuery';

// Import your query hook

export interface ResponseFlatTag {
  name: string;
  count: number;
}

export interface TagNode {
  name: string;
  fullName: string;
  count: number;
  children: TagNode[];
}

interface FlatTagNode {
  node: TagNode;
  depth: number;
  isExpanded: boolean;
  hasChildren: boolean;
}

const EMPTY_DATA: ResponseFlatTag[] = [];

const buildTagTree = (flatTags: ResponseFlatTag[]): TagNode[] => {
  const rootNodes: TagNode[] = [];
  const nodeMap: Record<string, TagNode> = {};

  const sortedTags = [...flatTags].sort((a, b) => a.name.localeCompare(b.name));

  sortedTags.forEach(tag => {
    const parts = tag.name.split('/');
    const localName = parts[parts.length - 1];
    const fullName = tag.name;

    const node: TagNode = {
      name: localName,
      fullName: fullName,
      count: tag.count,
      children: [],
    };

    nodeMap[fullName.toLowerCase()] = node;

    if (parts.length === 1) {
      rootNodes.push(node);
    } else {
      const parentPath = parts.slice(0, -1).join('/').toLowerCase();
      if (nodeMap[parentPath]) {
        nodeMap[parentPath].children.push(node);
      } else {
        rootNodes.push(node);
      }
    }
  });

  const sortTree = (nodes: TagNode[]) => {
    nodes.sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach(n => sortTree(n.children));
  };

  sortTree(rootNodes);
  return rootNodes;
};

const HighlightedText = ({ text, highlight }: { text: string; highlight: string }) => {
  if (!highlight.trim()) return <span>{text}</span>;
  const parts = text.split(new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <mark key={i} className="bg-primary/40 text-white rounded-sm px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
};

export const TagsTabContent = ({ searchQuery, defaultExpand, isNestedView }: { searchQuery: string; defaultExpand: boolean; isNestedView: boolean }) => {
  const params = useParams();
  const projectId = params.pid as string;

  const { data, isLoading, isError } = useProjectTagsQuery(projectId);
  const rawFlatData: ResponseFlatTag[] = data || EMPTY_DATA;

  const tree = useMemo(() => buildTagTree(rawFlatData), [rawFlatData]);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (defaultExpand && isNestedView) {
      const allPaths = new Set<string>();
      const collectPaths = (nodes: TagNode[]) => {
        nodes.forEach(n => {
          allPaths.add(n.fullName);
          collectPaths(n.children);
        });
      };
      collectPaths(tree);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExpandedPaths(prev => (prev.size === allPaths.size ? prev : allPaths));
    } else {
      setExpandedPaths(prev => (prev.size === 0 ? prev : new Set()));
    }
  }, [defaultExpand, tree, isNestedView]);

  const filteredTree = useMemo(() => {
    if (!searchQuery.trim()) return tree;

    const filterNodes = (nodes: TagNode[]): TagNode[] => {
      return nodes.reduce((acc: TagNode[], node) => {
        const matchesSearch = node.name.toLowerCase().includes(searchQuery.toLowerCase());
        const filteredChildren = filterNodes(node.children);

        if (matchesSearch || filteredChildren.length > 0) {
          acc.push({ ...node, children: filteredChildren });
        }
        return acc;
      }, []);
    };
    return filterNodes(tree);
  }, [tree, searchQuery]);

  const flatVisibleTreeNodes = useMemo(() => {
    const result: FlatTagNode[] = [];
    const traverse = (nodes: TagNode[], depth: number) => {
      for (const node of nodes) {
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = searchQuery.trim() ? true : expandedPaths.has(node.fullName);

        result.push({ node, depth, isExpanded, hasChildren });

        if (isExpanded && hasChildren) {
          traverse(node.children, depth + 1);
        }
      }
    };
    traverse(filteredTree, 0);
    return result;
  }, [filteredTree, expandedPaths, searchQuery]);

  const flatListViewNodes = useMemo(() => {
    let filtered = rawFlatData;
    if (searchQuery.trim()) {
      filtered = rawFlatData.filter(tag => tag.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    return filtered.map(tag => ({
      node: {
        name: tag.name,
        fullName: tag.name,
        count: tag.count,
        children: [],
      },
      depth: 0,
      isExpanded: false,
      hasChildren: false,
    }));
  }, [rawFlatData, searchQuery]);

  const displayData = isNestedView ? flatVisibleTreeNodes : flatListViewNodes;

  const toggleExpand = (fullName: string) => {
    setExpandedPaths(prev => {
      const next = new Set(prev);
      if (next.has(fullName)) next.delete(fullName);
      else next.add(fullName);
      return next;
    });
  };

  const handleNavigate = (tagFullName: string) => {
    window.dispatchEvent(
      new CustomEvent('editor:search-tag', {
        detail: { tag: tagFullName },
      })
    );
  };

  if (isLoading)
    return (
      <div className="flex items-center justify-center p-8 text-zinc-500">
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        <span className="text-xs">Loading tags...</span>
      </div>
    );

  if (isError) return <div className="p-4 text-xs text-red-400 italic">Failed to load tags.</div>;

  if (displayData.length === 0)
    return <div className="p-4 text-xs text-zinc-500 italic">{searchQuery ? 'No tags match your search' : 'No tags found in this project'}</div>;

  return (
    <Virtuoso
      style={{ height: '100%', width: '100%' }}
      data={displayData}
      itemContent={(index, { node, depth, isExpanded, hasChildren }) => (
        <div
          className="group flex items-center justify-between gap-2 px-2 py-1.5 hover:bg-white/5 cursor-pointer transition-colors w-full"
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => handleNavigate(node.fullName)}
        >
          <div className="flex items-center gap-1.5 overflow-hidden">
            <div
              className="flex items-center justify-center w-5 h-5 shrink-0"
              onClick={e => {
                if (hasChildren && isNestedView) {
                  e.stopPropagation();
                  toggleExpand(node.fullName);
                }
              }}
            >
              {hasChildren && isNestedView ? (
                <button
                  className="hover:bg-white/10 p-0.5 rounded transition-transform"
                  style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                >
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300" />
                </button>
              ) : (
                <Hash className="w-3 h-3 text-zinc-600 group-hover:text-primary transition-colors ml-1" />
              )}
            </div>
            <span className="text-[13px] text-zinc-400 group-hover:text-zinc-100 truncate font-medium tracking-tight">
              <HighlightedText text={isNestedView ? node.name : node.fullName} highlight={searchQuery} />
            </span>
          </div>

          <span className="text-[10px] text-zinc-500 font-mono group-hover:text-zinc-400 shrink-0 pr-2">{node.count}</span>
        </div>
      )}
    />
  );
};
