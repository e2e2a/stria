import React from 'react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useEditorSettings } from '@/features/editor/stores/setting';
import { RotateCcw } from 'lucide-react';

export default function AppearanceTabContent() {
  const tabTitleBar = useEditorSettings(state => state.tabTitleBar);
  const updateSetting = useEditorSettings(state => state.updateSetting);
  const inlineTitle = useEditorSettings(state => state.inlineTitle);
  const accentColor = useEditorSettings(state => state.accentColor);

  return (
    <div className="flex-1 bg-background flex flex-col w-full h-full overflow-y-auto hoverable-scrollbar p-6 sm:p-10">
      <div className="w-full space-y-8">
        <div>
          <h2 className="text-2xl font-semibold text-foreground tracking-tight">Appearance</h2>
          <p className="text-muted-foreground mt-1 text-sm">Manage your workspace aesthetics and interface layout.</p>
        </div>

        <div className="space-y-6">
          <SettingsCard title="Theme & Colors" description="Customize the visual appearance of your workspace.">
            <SettingRow title="Base Color Scheme" description="Choose between light, dark, or system default.">
              <select className="bg-background border border-border rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-ring outline-none text-foreground">
                <option>Dark</option>
                <option>Light</option>
                <option>System</option>
              </select>
            </SettingRow>

            <SettingRow title="Accent Color" description="The primary color used for buttons and active states." isLast>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateSetting('accentColor', '#8b59fa')}
                  className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                  title="Reset color"
                >
                  <RotateCcw className="w-5! h-5!" />
                </button>

                <div className="relative w-6 h-6 shrink-0 rounded-full overflow-hidden ring-2 ring-border/50 hover:ring-border transition-colors">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={e => updateSetting('accentColor', e.target.value)}
                    className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] cursor-pointer border-0 p-0 outline-none bg-transparent"
                  />
                </div>
              </div>
            </SettingRow>
          </SettingsCard>

          <SettingsCard title="Interface Layout" description="Toggle structural elements of the application.">
            <SettingRow title="Inline Title" description="Display the filename as an editable title inline with the file contents.">
              <Switch checked={inlineTitle} onCheckedChange={val => updateSetting('inlineTitle', val)} />
            </SettingRow>

            <SettingRow title="Show Tab Title Bar" description="Display the header at the top of every tab.">
              <Switch checked={tabTitleBar} onCheckedChange={val => updateSetting('tabTitleBar', val)} />
            </SettingRow>

            <SettingRow title="Global Ribbon" description="Display vertical toolbar on the side of the window." isLast>
              <Switch checked={true} onCheckedChange={() => {}} />
            </SettingRow>
          </SettingsCard>
        </div>
      </div>
    </div>
  );
}

function SettingsCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="bg-sidebar border border-border rounded-xl overflow-hidden shadow-sm">
      <div className="px-6 py-5 border-b border-border bg-accent/20">
        <h3 className="text-base font-medium text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
      <div className="px-6 py-2">{children}</div>
    </div>
  );
}

function SettingRow({
  title,
  description,
  children,
  isLast = false,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  isLast?: boolean;
}) {
  return (
    <div className={cn('py-4 flex items-center justify-between', !isLast && 'border-b border-border/50')}>
      <div className="pr-8">
        <h4 className="text-sm font-medium text-foreground">{title}</h4>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
