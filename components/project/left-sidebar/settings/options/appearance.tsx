import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch'; // Assuming you use shadcn or similar

export default function SettingsDashboard() {
  const [activeTab, setActiveTab] = useState('appearance');

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'editor', label: 'Editor' },
    { id: 'appearance', label: 'Appearance' },
    { id: 'collaboration', label: 'Collaboration' }, // Added web-specific tab
  ];

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-300 p-8 flex justify-center">
      <div className="w-full max-w-4xl">
        {/* Header Area */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-white mb-2">Settings</h1>
          <p className="text-gray-400">Manage your workspace preferences and editor configuration.</p>
        </div>

        {/* Horizontal Navigation (Moves away from Obsidian's vertical sidebar) */}
        <nav className="flex space-x-1 border-b border-gray-800 mb-8 pb-px overflow-x-auto hoverable-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2',
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Content Area */}
        {activeTab === 'appearance' && (
          <div className="space-y-6">
            {/* Card 1: Theme Settings */}
            <SettingsCard title="Theme & Colors" description="Customize the visual appearance of your workspace.">
              <SettingRow title="Base Color Scheme" description="Choose between light, dark, or system default.">
                <select className="bg-[#161b22] border border-gray-700 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option>Dark</option>
                  <option>Light</option>
                  <option>System</option>
                </select>
              </SettingRow>

              <SettingRow title="Accent Color" description="The primary color used for buttons and active states." isLast>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 cursor-pointer ring-2 ring-emerald-500/30" />
                  <div className="w-6 h-6 rounded-full bg-indigo-500 cursor-pointer opacity-50 hover:opacity-100" />
                  <div className="w-6 h-6 rounded-full bg-rose-500 cursor-pointer opacity-50 hover:opacity-100" />
                </div>
              </SettingRow>
            </SettingsCard>

            {/* Card 2: Interface Settings */}
            <SettingsCard title="Interface Layout" description="Toggle structural elements of the application.">
              <SettingRow title="Inline Title" description="Display the filename as an editable title inline with the file contents.">
                <Switch checked={false} onCheckedChange={() => {}} />
              </SettingRow>

              <SettingRow title="Show Tab Title Bar" description="Display the header at the top of every tab.">
                <Switch checked={true} onCheckedChange={() => {}} />
              </SettingRow>

              <SettingRow title="Global Ribbon" description="Display vertical toolbar on the side of the window." isLast>
                <Switch checked={true} onCheckedChange={() => {}} />
              </SettingRow>
            </SettingsCard>
          </div>
        )}
      </div>
    </div>
  );
}

/* --- Reusable Sub-components (KISS) --- */

function SettingsCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#161b22] border border-gray-800 rounded-xl overflow-hidden shadow-sm">
      <div className="px-6 py-5 border-b border-gray-800 bg-[#1c2128]/50">
        <h3 className="text-base font-medium text-gray-100">{title}</h3>
        <p className="text-sm text-gray-400 mt-1">{description}</p>
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
    <div className={cn('py-4 flex items-center justify-between', !isLast && 'border-b border-gray-800/50')}>
      <div className="pr-8">
        <h4 className="text-sm font-medium text-gray-200">{title}</h4>
        <p className="text-sm text-gray-500 mt-0.5">{description}</p>
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}
