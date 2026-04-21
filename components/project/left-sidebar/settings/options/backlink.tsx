import React from 'react';
import { Switch } from '@/components/ui/switch';
import { useCorePluginStore } from '@/features/editor/stores/setting-core-plugin';
import SettingsCard from './components/settings-card';
import SettingRow from './components/setting-row';

export default function BacklinkTabContent() {
  const updateSetting = useCorePluginStore(state => state.updateSetting);
  const backlink = useCorePluginStore(state => state.settings.backlink);

  return (
    <div className="flex-1 bg-background flex flex-col w-full h-full overflow-y-auto p-6 sm:p-10">
      <div className="w-full space-y-8">
        <div>
          <h2 className="text-2xl font-semibold text-foreground tracking-tight">Backlinks</h2>
          <p className="text-muted-foreground mt-1 text-sm">Configure how incoming connections to your notes are displayed.</p>
        </div>

        <div className="space-y-6">
          <SettingsCard title="Document Integration" description="Seamlessly weave your note connections into your reading experience.">
            <SettingRow
              title="Inline Document Backlinks"
              description="Automatically append a dedicated reference section to the bottom of your notes."
              isLast
            >
              <Switch checked={backlink} onCheckedChange={val => updateSetting('backlink', val)} />
            </SettingRow>
          </SettingsCard>
        </div>
      </div>
    </div>
  );
}
