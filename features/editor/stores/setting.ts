import { create } from 'zustand';

export const DEFAULT_APPEARANCE = {
  theme: 'dark',
  accentColor: 'green',
  inlineTitle: false,
  tabTitleBar: false,
  globalRibbon: true,
};

export type AppearanceSettings = typeof DEFAULT_APPEARANCE;

export interface EditorSettingsState extends AppearanceSettings {
  initSettings: (settings: Partial<AppearanceSettings>) => void;
  updateSetting: <K extends keyof AppearanceSettings>(key: K, value: AppearanceSettings[K]) => void;
}

export const useEditorSettings = create<EditorSettingsState>(set => ({
  ...DEFAULT_APPEARANCE,
  initSettings: settings => set(state => ({ ...state, ...settings })),
  updateSetting: (key, value) => set({ [key]: value }),
}));
