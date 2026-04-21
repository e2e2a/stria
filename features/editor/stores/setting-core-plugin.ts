import { create } from 'zustand';

const DEFAULT_CORE_PLUGINS = {
  'file-explorer': true,
  'global-search': true,
  switcher: true,
  graph: true,
  backlink: true,
  canvas: true,
  'outgoing-link': true,
  'tag-pane': true,
  'page-preview': true,
  templates: true,
  'note-composer': true,
  'slash-command': true,
  'editor-status': true,
  bookmarks: true,
  'markdown-importer': true,
  'zk-prefixer': true,
  'random-note': true,
  outline: true,
  'word-count': true,
  slides: false,
  'audio-recorder': false,
  workspaces: false,
  'file-recovery': true,
  publish: false,
  sync: false,
  properties: true,
  webviewer: false,
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
