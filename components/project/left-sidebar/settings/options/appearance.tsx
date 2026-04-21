import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useEditorSettings } from '@/features/editor/stores/setting';
import { RotateCcw } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { FontManageDialog } from './components/font-manage-dialog';
import { Appearance, useThemeContext } from '@/components/provider/editor-theme-provider';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DEFAULT_THEME, THEMES } from '@/lib/client/themes-config';
import SettingRow from './components/setting-row';
import SettingsCard from './components/settings-card';

type FontSettingType = 'interface' | 'text' | 'monospace' | null;

export default function AppearanceTabContent() {
  const tabTitleBar = useEditorSettings(state => state.tabTitleBar);
  const updateSetting = useEditorSettings(state => state.updateSetting);
  const inlineTitle = useEditorSettings(state => state.inlineTitle);
  const accentColor = useEditorSettings(state => state.accentColor);
  const theme = useEditorSettings(state => state.theme);
  const accentColorTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const interfaceFont = useEditorSettings(state => state.interfaceFont);
  const textFont = useEditorSettings(state => state.textFont);
  const monospaceFont = useEditorSettings(state => state.monospaceFont);
  const fontSize = useEditorSettings(state => state.fontSize);

  const [activeDialog, setActiveDialog] = useState<FontSettingType>(null);

  const { skin, isDark, setTheme, setSkin } = useThemeContext();
  const currentSkin = skin || DEFAULT_THEME;
  const selectedThemeName = THEMES.find(t => t.value === currentSkin)?.name || 'Default Theme';

  const getDialogContent = () => {
    switch (activeDialog) {
      case 'interface':
        return {
          title: 'Interface font',
          description: 'The first font from this list that is available on your system will be applied.',
          fonts: interfaceFont,
          onSave: (newFonts: string[]) => updateSetting('interfaceFont', newFonts),
        };
      case 'text':
        return {
          title: 'Text font',
          description: 'The first font from this list that is available on your system will be applied.',
          fonts: textFont,
          onSave: (newFonts: string[]) => updateSetting('textFont', newFonts),
        };
      case 'monospace':
        return {
          title: 'Monospace font',
          description: 'No custom font is applied right now. Add one below.',
          fonts: monospaceFont,
          onSave: (newFonts: string[]) => updateSetting('monospaceFont', newFonts),
        };
      default:
        return null;
    }
  };

  const dialogContent = getDialogContent();

  return (
    <>
      <div className="flex-1 bg-background flex flex-col w-full h-full overflow-y-auto p-6 sm:p-10">
        <div className="w-full space-y-8">
          <div>
            <h2 className="text-2xl font-semibold text-foreground tracking-tight">Appearance</h2>
            <p className="text-muted-foreground mt-1 text-sm">Manage your workspace aesthetics and interface layout.</p>
          </div>

          <div className="space-y-6">
            <SettingsCard title="Theme & Colors" description="Customize the visual appearance of your workspace.">
              <SettingRow title="Appearance" description="Choose between light, dark, or system default.">
                <Select
                  value={theme}
                  onValueChange={val => {
                    updateSetting('theme', val as Appearance);
                    setTheme(val as Appearance);
                  }}
                >
                  <SelectTrigger className="w-full max-w-48">
                    <SelectValue defaultValue={theme} />
                  </SelectTrigger>
                  <SelectContent className="z-52">
                    <SelectGroup>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </SettingRow>

              <SettingRow title="Accent Color" description="Customize the highlight and cursor color used exclusively within the text editor." isLast>
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
                      onChange={e => {
                        const value = e.target.value;

                        if (accentColorTimeoutRef.current) {
                          clearTimeout(accentColorTimeoutRef.current);
                        }

                        accentColorTimeoutRef.current = setTimeout(() => {
                          updateSetting('accentColor', value);
                        }, 150);
                      }}
                      className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] cursor-pointer border-0 p-0 outline-none bg-transparent"
                    />
                  </div>
                </div>
              </SettingRow>
              <SettingRow title="Theme" description="Choose your custom theme.">
                <Select
                  value={currentSkin}
                  onValueChange={val => {
                    updateSetting('skin', val);
                    setSkin(val);
                  }}
                >
                  <SelectTrigger className="w-full max-w-64">
                    <SelectValue>{selectedThemeName}</SelectValue>
                  </SelectTrigger>
                  <SelectContent className="z-52">
                    <SelectGroup>
                      {THEMES.map(t => {
                        const dots = isDark ? t.dots.dark : t.dots.light;

                        return (
                          <SelectItem
                            key={t.value}
                            value={t.value}
                            className={cn(
                              'flex w-full flex-col gap-2 p-3 rounded-lg border text-left transition-colors mb-1 cursor-pointer',
                              'data-[state=checked]:border-primary data-[state=checked]:bg-primary/5', // Shadcn active state
                              skin === t.value ? 'border-2 border-primary' : 'border-transparent hover:border-border'
                            )}
                          >
                            <div className="flex items-center gap-2 min-w-50">
                              <div className="flex gap-1.5 shrink-0">
                                {dots.map((color, i) => (
                                  <span
                                    key={i}
                                    className="w-4 h-4 rounded-full shadow-sm border border-black/10 dark:border-white/10"
                                    style={{ backgroundColor: color }}
                                  />
                                ))}
                              </div>
                              <p className="flex-1 text-right text-sm font-medium leading-none">{t.name}</p>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </SettingRow>
            </SettingsCard>

            <SettingsCard title="Interface Layout" description="Toggle structural elements of the application.">
              <SettingRow title="Inline Title" description="Display the filename as an editable title inline with the file contents.">
                <Switch checked={inlineTitle} onCheckedChange={val => updateSetting('inlineTitle', val)} />
              </SettingRow>

              <SettingRow title="Show Tab Title Bar" description="Display the header at the top of every tab.">
                <Switch checked={tabTitleBar} onCheckedChange={val => updateSetting('tabTitleBar', val)} />
              </SettingRow>
            </SettingsCard>

            <SettingsCard title="Typography" description="Customize the text rendering and styling across your workspace.">
              <SettingRow
                title="Interface typography"
                description="Choose the primary typeface used throughout the editors's menus, sidebars, and panels."
              >
                <Button variant="outline" size="sm" className="bg-secondary/50" onClick={() => setActiveDialog('interface')}>
                  Manage
                </Button>
              </SettingRow>

              <SettingRow title="Document text font" description="Determine the main font family used when reading and editing your notes.">
                <Button variant="outline" size="sm" className="bg-secondary/50" onClick={() => setActiveDialog('text')}>
                  Manage
                </Button>
              </SettingRow>

              <SettingRow title="Monospace typeface" description="Select the font used for code blocks, frontmatter, and raw technical text.">
                <Button variant="outline" size="sm" className="bg-secondary/50" onClick={() => setActiveDialog('monospace')}>
                  Manage
                </Button>
              </SettingRow>

              <SettingRow title="Base font size" description="Adjust the default text scale in pixels to improve reading comfort across your files.">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => updateSetting('fontSize', 16)}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Slider value={[fontSize]} onValueChange={val => updateSetting('fontSize', val[0])} max={32} min={10} step={1} className="w-[120px]" />
                </div>
              </SettingRow>
            </SettingsCard>
          </div>
        </div>
      </div>
      {dialogContent && (
        <FontManageDialog
          isOpen={activeDialog !== null}
          onClose={() => setActiveDialog(null)}
          title={dialogContent.title}
          description={dialogContent.description}
          initialFonts={dialogContent.fonts}
          onSave={dialogContent.onSave}
        />
      )}
    </>
  );
}
