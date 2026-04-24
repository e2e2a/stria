'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Settings, PenTool, FileText, Paintbrush, Keyboard, Key, Package, Puzzle, Link, LucideIcon } from 'lucide-react';
import { useIsMobileSM } from '@/hooks/use-mobile';
import { IconTooltip } from '../../icon-tooltip';
import AppearanceTabContent from './options/appearance';
import BacklinkTabContent from './options/backlink';

const OPTIONS_TABS = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'editor', label: 'Editor', icon: PenTool },
  { id: 'files', label: 'Files and links', icon: FileText },
  { id: 'appearance', label: 'Appearance', icon: Paintbrush },
  { id: 'hotkeys', label: 'Hotkeys', icon: Keyboard },
  { id: 'keychain', label: 'Keychain', icon: Key },
  { id: 'core-plugins', label: 'Core plugins', icon: Package },
  { id: 'community-plugins', label: 'Community plugins', icon: Puzzle },
];

const CORE_PLUGINS_TABS = [{ id: 'backlink', label: 'Backlinks', icon: Link }];

interface TabItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

export default function SettingsFooter() {
  const [activeTab, setActiveTab] = useState('general');
  const mobile = useIsMobileSM();
  const renderTabButton = (tab: TabItem) => {
    const Icon = tab.icon;
    const isActive = activeTab === tab.id;

    return (
      <IconTooltip key={tab.id} label={tab.id} side={mobile ? 'bottom' : 'right'} className={'w-fit sm:w-full'}>
        <button
          tabIndex={-1}
          onClick={() => setActiveTab(tab.id)}
          className={`inline-flex items-center w-full gap-2 px-3  py-1.5 text-sm rounded-md transition-colors ${
            isActive ? 'bg-accent text-foreground font-medium' : 'text-zinc-400 hover:bg-accent/50 hover:text-foreground'
          }`}
        >
          <Icon className="w-4 h-4" />

          <span className="sm:flex hidden w-full! line-clamp-1">{tab.label}</span>
        </button>
      </IconTooltip>
    );
  };

  return (
    <Dialog>
      <DialogTrigger>
        <IconTooltip label="settings" className="hover:bg-accent p-1">
          <Settings className="h-6! w-6!" />
        </IconTooltip>
      </DialogTrigger>

      <DialogContent
        tabIndex={-1}
        className="w-[90%]! max-w-[90%]! min-w-[90%] h-[95vh] sm:h-[92vh] p-0 gap-0 bg-sidebar flex flex-col sm:flex-row overflow-hidden z-51 app-font-interface"
      >
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <DialogDescription className="sr-only">Manage application settings and preferences</DialogDescription>
        <div className="w-auto min-h-20! sm:w-56 bg-sidebar sm:border-r sm:border-border flex flex-row sm:flex-col sm:overflow-y-auto overflow-y-hidden pt-5">
          <div className="sm:mb-6">
            <h3 className="px-3 mb-2 text-xs font-semibold text-accent uppercase tracking-wider">Options</h3>
            <div className="flex flex-row sm:flex-col w-full! gap-0.5">{OPTIONS_TABS.map(renderTabButton)}</div>
          </div>

          <div className="mb-2 sm:mb-6">
            <h3 className="px-3 mb-2 text-xs font-semibold text-accent uppercase tracking-wider">Core plugins</h3>
            <div className="flex flex-row sm:flex-col w-full gap-0.5">{CORE_PLUGINS_TABS.map(renderTabButton)}</div>
          </div>
        </div>
        {activeTab === 'appearance' && <AppearanceTabContent />}
        {activeTab === 'backlink' && <BacklinkTabContent />}
      </DialogContent>
    </Dialog>
  );
}
