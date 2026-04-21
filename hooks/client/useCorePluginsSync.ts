import { useCorePluginStore } from '@/features/editor/stores/setting-core-plugin';
import { useFileSync, UseFileSyncProps } from './useFileSync';

// Reusing the type to keep things DRY and strictly typed
type SyncHookProps = Pick<UseFileSyncProps, 'projectId' | 'nData'>;

export function useCorePluginsSync({ projectId, nData }: SyncHookProps) {
  const pluginStore = useCorePluginStore();

  const { isLoading } = useFileSync({
    projectId,
    nData,
    fileName: 'core-plugin.json',
    fileContent: JSON.stringify(pluginStore.settings, null, 2),
    onInit: (content: string) => {
      try {
        const parsedData = JSON.parse(content);
        pluginStore.initPlugins(parsedData);
      } catch (e) {
        console.error('Core plugins parse error:', e);
      }
    },
  });

  return { isPluginsLoading: isLoading };
}
