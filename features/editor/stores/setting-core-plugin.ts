import { create } from 'zustand';

const DEFAULT_CORE_PLUGINS = {
  backlink: true,
  'show-backlink': true,
  bookmark: true,
  'file-explorer': true,
  'editor-status': true,
  'global-search': true,

  properties: true,
  outline: true,
  tags: true,

  graph: true,
  'word-count': true,

  // switcher: true,

  'markdown-importer': true,
  'random-note': true,
};

// Automatically extracts the exact keys so TypeScript catches typos
export type CorePluginsList = typeof DEFAULT_CORE_PLUGINS;
export type CorePluginId = keyof CorePluginsList;
export type CorePluginKey = keyof CorePluginsList;

export interface CorePluginState {
  settings: CorePluginsList;
  initPlugins: (data: Partial<CorePluginsList>) => void;
  updateSetting: (key: CorePluginKey, value: boolean) => void;
}

export const useCorePluginStore = create<CorePluginState>(set => ({
  settings: DEFAULT_CORE_PLUGINS,

  // Merges saved data from your sync hook with the defaults
  initPlugins: data =>
    set(state => ({
      settings: {
        ...state.settings,
        ...data,
      },
    })),

  // One simple function to handle BOTH turning a plugin on/off and updating a setting
  updateSetting: (key, value) =>
    set(state => ({
      settings: {
        ...state.settings,
        [key]: value,
      },
    })),
}));
