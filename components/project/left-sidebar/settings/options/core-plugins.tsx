'use client';
import { useState } from 'react';
import { Search } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import SettingRow from './components/setting-row';
import SettingsCard from './components/settings-card';
import { CorePluginKey, useCorePluginStore } from '@/features/editor/stores/setting-core-plugin';
import { useTabStore } from '@/features/editor/stores/tabs';
import { useParams } from 'react-router-dom';

const CORE_PLUGINS_META: { id: CorePluginKey; title: string; description: string }[] = [
  {
    id: 'show-backlink',
    title: 'Backlinks',
    description: 'Show links from other files to the current file. Backlinks can be shown in a separate view or at the bottom of the note.',
  },
  { id: 'bookmark', title: 'Bookmarks', description: 'Save shortcuts to files, searches, headings, and graphs.' },
  { id: 'editor-status', title: 'Editor status', description: 'Show editor status and toggles in the status bar.' },
  { id: 'file-explorer', title: 'File explorer', description: 'See all files and folders in your vault.' },
  { id: 'global-search', title: 'Search', description: 'Search for keywords in all files.' },
  { id: 'graph', title: 'Graph view', description: 'See the relationship between your notes.' },
  { id: 'markdown-importer', title: 'Markdown importer', description: 'Import markdown files from other apps.' },
  { id: 'outline', title: 'Outline', description: 'Show the heading outline of the current file.' },
  // { id: 'page-preview', title: 'Page preview', description: 'Hover over internal links to preview the content.' },
  { id: 'properties', title: 'Properties view', description: 'Manage file properties and metadata.' },
  { id: 'random-note', title: 'Random note', description: 'Open a random note from your vault.' },
  // { id: 'switcher', title: 'Quick switcher', description: 'Jump to or open files quickly without leaving the keyboard.' },
  { id: 'tags', title: 'Tags view', description: 'See all tags in your vault.' },
  { id: 'word-count', title: 'Word count', description: 'Show word and character counts in the status bar.' },
];

export default function CorePluginsTabContent() {
  const params = useParams();
  const projectId = params.pid as string;
  const settings = useCorePluginStore(state => state.settings);
  const updateSetting = useCorePluginStore(state => state.updateSetting);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPlugins = CORE_PLUGINS_META.filter(
    plugin => plugin.title.toLowerCase().includes(searchQuery.toLowerCase()) || plugin.description.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div className="flex-1 bg-background flex flex-col w-full h-full overflow-y-auto p-6 sm:p-10">
      <div className="w-full space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-foreground tracking-tight mb-4">Core plugins</h2>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search plugins..."
              className="pl-9 bg-background w-full"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Plugin List */}
        <SettingsCard title="Core Plugins" description="">
          {filteredPlugins.length > 0 ? (
            filteredPlugins.map((plugin, index) => (
              <SettingRow key={plugin.id} title={plugin.title} description={plugin.description} isLast={index === filteredPlugins.length - 1}>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={settings[plugin.id]}
                    onCheckedChange={val => {
                      updateSetting(plugin.id, val);
                      if (plugin.id === 'graph') useTabStore.getState().closeTab(projectId, 'graph-view');
                    }}
                    disabled={plugin.id === 'markdown-importer'}
                  />
                </div>
              </SettingRow>
            ))
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">No plugins found matching "{searchQuery}"</div>
          )}
        </SettingsCard>
      </div>
    </div>
  );
}
