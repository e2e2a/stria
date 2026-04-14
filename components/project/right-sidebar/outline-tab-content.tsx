import { useNodeOutlinesQuery } from '@/hooks/node/useNodeQuery';
import React from 'react';
import { OutlineTabItem } from './outline-tab-item';

const OutlineTabContent = ({
  activeNodeId,
  refreshKey,
  searchQuery,
  defaultOpen,
}: {
  activeNodeId: string;
  refreshKey: number;
  depth?: number;
  searchQuery: string;
  defaultOpen?: boolean;
}) => {
  const { data: tData } = useNodeOutlinesQuery(activeNodeId);
  return (
    <div className="p-2">
      <div className="space-y-0.5">
        {tData && tData.length > 0 ? (
          tData.map((node, idx) => <OutlineTabItem key={`${idx}-${refreshKey}`} node={node} defaultOpen={defaultOpen} searchQuery={searchQuery} />)
        ) : (
          <p className="text-xs text-zinc-500 italic mt-2 px-2">{searchQuery ? 'No matches' : 'No headings'}</p>
        )}
      </div>
    </div>
  );
};

export default OutlineTabContent;
