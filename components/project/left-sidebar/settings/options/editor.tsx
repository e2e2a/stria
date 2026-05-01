'use client';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { useEditorSettings } from '@/features/editor/stores/setting';
import SettingRow from './components/setting-row';
import SettingsCard from './components/settings-card';

export default function EditorTabContent() {
  const updateSetting = useEditorSettings(state => state.updateSetting);

  const defaultView = useEditorSettings(state => state.defaultView ?? 'editing');
  const defaultEditingMode = useEditorSettings(state => state.defaultEditingMode ?? 'live');
  const readableLineLength = useEditorSettings(state => state.readableLineLength ?? false);
  const lineNumbers = useEditorSettings(state => state.lineNumbers ?? false);
  const spellcheck = useEditorSettings(state => state.spellcheck ?? true);

  return (
    <div className="flex-1 bg-background flex flex-col w-full h-full overflow-y-auto p-6 sm:p-10">
      <div className="w-full space-y-8">
        <div>
          <h2 className="text-2xl font-semibold text-foreground tracking-tight">Editor</h2>
          <p className="text-muted-foreground mt-1 text-sm">Control how your editor behaves.</p>
        </div>

        <div className="space-y-6">
          {/* General/Top Group - Added title and description to satisfy TS requirement */}
          <SettingsCard title="General" description="">
            <SettingRow title="Default view for new tabs" description="Choose whether new tabs open in editing or reading view.">
              <Select value={defaultView} onValueChange={(val: string) => updateSetting('defaultView', val as 'editing' | 'reading')}>
                <SelectTrigger className="w-full max-w-40 z-52">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-52">
                  <SelectGroup>
                    <SelectItem value="editing">Editing view</SelectItem>
                    <SelectItem value="reading">Reading view</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </SettingRow>

            <SettingRow title="Default editing mode" description="Choose whether new tabs start in Live Preview or Source mode.">
              <Select value={defaultEditingMode} onValueChange={(val: string) => updateSetting('defaultEditingMode', val as 'live' | 'source')}>
                <SelectTrigger className="w-full max-w-40 z-52">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-52">
                  <SelectGroup>
                    <SelectItem value="live">Live Preview</SelectItem>
                    <SelectItem value="source">Source mode</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </SettingRow>
          </SettingsCard>

          {/* Display Group */}
          <SettingsCard title="Display" description="">
            <SettingRow title="Readable line length" description="Constrain line width to improve readability for long-form writing.">
              <Switch checked={readableLineLength} onCheckedChange={(val: boolean) => updateSetting('readableLineLength', val)} />
            </SettingRow>

            <SettingRow title="Line numbers" description="Display line numbers alongside your content in the editor gutter.">
              <Switch checked={lineNumbers} onCheckedChange={(val: boolean) => updateSetting('lineNumbers', val)} />
            </SettingRow>
          </SettingsCard>

          {/* Behavior Group */}
          <SettingsCard title="Behavior" description="">
            <SettingRow title="Spellcheck" description="Highlight misspelled words as you type.">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <Settings className="w-4 h-4" />
                </Button>
                <Switch checked={spellcheck} onCheckedChange={(val: boolean) => updateSetting('spellcheck', val)} />
              </div>
            </SettingRow>

            <SettingRow title="Spellcheck languages" description="Select which languages the spellchecker should recognize.">
              <Select defaultValue="soon" disabled>
                <SelectTrigger className="w-full max-w-56 z-52 font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-52">
                  <SelectGroup>
                    <SelectItem value="soon">Coming Soon!</SelectItem>
                    <SelectItem value="en-us">English (United States)</SelectItem>
                    <SelectItem value="en-gb">English (United Kingdom)</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </SettingRow>
          </SettingsCard>
        </div>
      </div>
    </div>
  );
}
