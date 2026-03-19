import { useNodeStore } from '@/features/editor/stores/nodes';
import { useProjectUIStore } from '@/features/editor/stores/project-ui';
import { getAllPropertyStats } from '@/features/helpers/editor/getPropertyStats';
import { flattenNodeTree } from '@/utils/client/node-utils';
import React, { useDeferredValue, useMemo } from 'react';

const ICON_MAP: Record<string, string> = {
  tags: '🏷',
  aliases: '↪',
  description: '≡',
  cssclasses: '🎨',
  asd: '☑',
};

export const PropertiesTabItems = () => {
  const nodes = useNodeStore(state => state.nodes);
  const { setSearchQuery, setLeftSidebarTab } = useProjectUIStore();
  const deferredNodes = useDeferredValue(nodes);
  const flatNodes = useMemo(() => flattenNodeTree(deferredNodes), [deferredNodes]);
  const propertyStats = useMemo(() => getAllPropertyStats(flatNodes || []), [flatNodes]);

  const handlePropertyClick = (key: string) => {
    setSearchQuery(`["${key}"]`);
    setLeftSidebarTab('search');
  };

  return (
    <div className="flex flex-col py-2">
      {propertyStats.map(({ key, count }) => (
        <button
          key={key}
          onClick={() => handlePropertyClick(key)}
          className="group flex items-center justify-between px-4 py-1.5 hover:bg-white/5 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <span className="opacity-50 text-sm">{ICON_MAP[key] || '≡'}</span>
            <span className="text-xs font-medium text-white/70 group-hover:text-white">{key}</span>
          </div>
          <span className="text-[10px] tabular-nums opacity-40">{count}</span>
        </button>
      ))}

      {propertyStats.length === 0 && <div className="px-4 py-10 text-center opacity-30 text-xs italic">No properties found in vault</div>}
    </div>
  );
};
