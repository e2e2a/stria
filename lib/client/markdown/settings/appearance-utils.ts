import { AppearanceSettings } from '@/features/editor/stores/setting';

export function generateAppearanceJson(settings: AppearanceSettings): string {
  return JSON.stringify(
    {
      theme: settings.theme,
      accentColor: settings.accentColor,
      inlineTitle: settings.inlineTitle,
      tabTitleBar: settings.tabTitleBar,
      globalRibbon: settings.globalRibbon,
    },
    null,
    2
  );
}

export function parseAppearanceJson(content: string): Partial<AppearanceSettings> {
  try {
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to parse appearance settings JSON:', error);
    return {};
  }
}
