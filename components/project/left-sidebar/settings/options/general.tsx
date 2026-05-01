'use client';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import SettingRow from './components/setting-row';
import SettingsCard from './components/settings-card';

export default function GeneralTabContent() {
  return (
    <div className="flex-1 bg-background flex flex-col w-full h-full overflow-y-auto p-6 sm:p-10">
      <div className="w-full space-y-8">
        <div>
          <h2 className="text-2xl font-semibold text-foreground tracking-tight">General</h2>
          <p className="text-muted-foreground mt-1 text-sm">Manage core application settings and account details.</p>
        </div>

        <div className="space-y-6">
          {/* App Settings Group */}
          <SettingsCard title="General" description="Manage core application settings and account details.">
            <SettingRow title="Help" description="Learn how to use the editor and get help from the community." isLast>
              {/* Using standard window.open for external link behavior */}
              <Button variant="outline" className="bg-secondary/50" onClick={() => window.open('#', '_blank', 'noopener,noreferrer')} disabled>
                Open <ExternalLink className="ml-2 w-4 h-4" />
              </Button>
            </SettingRow>
          </SettingsCard>

          {/* Account Group */}
          <SettingsCard title="Account" description="">
            <SettingRow title="Your account" description="Manage your profile, cloud storage, and application access." isLast>
              <Button variant="outline" className="bg-secondary/50" onClick={() => (window.location.href = '#')} disabled>
                Manage Profile
              </Button>
            </SettingRow>
          </SettingsCard>
        </div>
      </div>
    </div>
  );
}
