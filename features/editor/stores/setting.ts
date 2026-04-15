import { create } from 'zustand';

interface EditorSettingsState {
  // Appearance
  inlineTitle: boolean;
  tabTitleBar: boolean;
  setInlineTitle(flag: boolean): void;
  setTabTitleBar(flag: boolean): void;
}

export const useEditorSettings = create<EditorSettingsState>(set => ({
  // Appearance
  inlineTitle: false,
  tabTitleBar: false,
  setInlineTitle: flag => set({ inlineTitle: flag }),
  setTabTitleBar: flag => set({ tabTitleBar: flag }),
}));
