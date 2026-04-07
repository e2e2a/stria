import { useProjectUIStore } from '@/features/editor/stores/project-ui';
import { useMemo } from 'react';
import { useProjectPropertiesQuery } from '@/hooks/project/useProjectQuery';
import { useParams } from 'next/navigation';

const ICON_MAP: Record<string, string> = {
  tags: '🏷',
  aliases: '↪',
  description: '≡',
  cssclasses: '🎨',
  asd: '☑',
};

interface IProps {
  sortMode: 'name-asc' | 'name-desc' | 'freq-high' | 'freq-low';
  searchQuery: string;
}

export const PropertyTabItems = ({ sortMode, searchQuery }: IProps) => {
  const params = useParams();
  const projectId = params.pid as string;

  const { setSearchQuery, setLeftSidebarTab } = useProjectUIStore();
  const { data } = useProjectPropertiesQuery(projectId);

  const handlePropertyClick = (key: string) => {
    setSearchQuery(`["${key}"]`);
    setLeftSidebarTab('search');
  };

  const propertyStats = useMemo(() => {
    let stats = (data && data.length > 0 ? data : []).filter(item => item && typeof item.key === 'string');

    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      stats = stats.filter(item => item.key.toLowerCase().includes(lowerQuery));
    }

    return stats.sort((a, b) => {
      switch (sortMode) {
        case 'name-asc':
          return a.key.localeCompare(b.key);
        case 'name-desc':
          return b.key.localeCompare(a.key);
        case 'freq-high':
          return b.count - a.count;
        case 'freq-low':
          return a.count - b.count;
        default:
          return 0;
      }
    });
  }, [data, sortMode, searchQuery]);

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

      {propertyStats.length === 0 && <div className="px-4 py-10 text-center opacity-30 text-xs italic">No properties found in project</div>}
    </div>
  );
};
