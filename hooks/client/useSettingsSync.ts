import { useEditorSettings } from '@/features/editor/stores/setting';
import { useFileSync } from './useFileSync';
import { INode } from '@/types';
// import { useFileSync } from './useFileSync';

export function useSettingsSync({ projectId, nData }: { projectId: string; nData: { nodes: INode[] } | undefined }) {
  const settingsStore = useEditorSettings();

  const currentSettings = {
    theme: settingsStore.theme,
    skin: settingsStore.skin,
    accentColor: settingsStore.accentColor,
    inlineTitle: settingsStore.inlineTitle,
    tabTitleBar: settingsStore.tabTitleBar,
    interfaceFont: settingsStore.interfaceFont,
    textFont: settingsStore.textFont,
    monospaceFont: settingsStore.monospaceFont,
    fontSize: settingsStore.fontSize,
  };

  const { isLoading } = useFileSync({
    projectId,
    nData,
    fileName: 'appearance.json',
    fileContent: JSON.stringify(currentSettings, null, 2),
    onInit: content => settingsStore.initSettings(JSON.parse(content)),
  });

  return { isSettingsLoading: isLoading };
}
