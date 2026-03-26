'use client';
import { SidebarInset } from '@/components/ui/sidebar';
import { notFound, useParams } from 'next/navigation';
import Link from 'next/link';
import { useGetMyWorkspaceMembership } from '@/hooks/workspasceMember/useQueries';
import { Copy, ExternalLink } from 'lucide-react';
import { SettingCard } from './setting-card';
import { Switch } from '@/components/ui/switch';
import { makeToastSucess } from '@/lib/toast';
import { EditWorkspace } from './edit-workspace';
import { useGetWorkspace } from '@/hooks/workspace/useQuery';
import { dateFormatted } from '@/hooks/use-date-format';
import TrashWorkspace from './trash-workspace';
import { useSession } from 'next-auth/react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function GeneralClient() {
  const { data: session } = useSession();
  const params = useParams();
  const workspaceId = params.id as string;
  const { data: wData, isLoading: wLoading, isError: wError } = useGetWorkspace(workspaceId);
  const { data: mData, isLoading: mLoading } = useGetMyWorkspaceMembership(workspaceId);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(workspaceId);
      makeToastSucess('Workspace ID copied to clipboard');
      // Reset icon after 2 seconds
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  if (wError) return notFound();

  if (mLoading || wLoading)
    return (
      <div className="fixed inset-0 z-200 bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );

  return (
    <SidebarInset className="flex flex-col h-full w-full">
      <main className="p-6 lg:p-8 w-full flex-1 h-ful overflow-y-auto">
        <h1 className="text-2xl md:text-4xl font-bold drop-shadow-xs mb-6">Workspace Settings</h1>

        <div className="flex gap-8 border-b border-slate-800 mb-8">
          <Link href={`/workspaces/${workspaceId}/settings/general`} className="pb-2 border-b-2 border-emerald-500 text-white font-medium text-sm">
            General Settings
          </Link>
          <Link href="#" className="pb-2 text-slate-500 hover:text-slate-300 font-medium text-sm transition-colors">
            Integrations
          </Link>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-12 gap-y-6">
            <div className="bg-transparent border-2 border-border rounded-2xl px-6 py-12 relative group drop-shadow-2xl shadow-sm hover:bg-secondary/10 transition-all duration-200">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-foreground font-medium text-sm sm:text-lg md:text-xl tracking-tight">Workspace ID</h3>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button onClick={handleCopy} className="p-1.5 bg-accent/20 rounded-sm hover:bg-accent transition-all cursor-pointer" type="button">
                      <Copy size={14} className="text-muted-foreground hover:text-foreground" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    className="max-w-[200px] text-foreground bg-sidebar font-sans [&_svg]:bg-sidebar [&_svg]:border-b-2 [&_svg]:border-r-2 border-2 border-border [&_svg]:fill-sidebar"
                    side="bottom"
                  >
                    Copy Workspace ID
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="text-muted-foreground text-xs sm:text-sm">
                <p className="">{workspaceId}</p>
              </div>
            </div>

            <EditWorkspace item={wData} canEdit={mData?.permissions?.canEditWorkspace || false} />

            <SettingCard title="Created On">
              <p className="text-sm text-slate-300">{wData?.createdAt ? dateFormatted(new Date(wData.createdAt)) : '—'}</p>
            </SettingCard>
          </div>

          <div className="bg-transparent border border-border rounded-2xl flex flex-col gap-y-6 px-6 py-12 relative group drop-shadow-xs shadow-sm hover:bg-secondary/10 transition-all duration-200">
            <div className="flex">
              <h3 className="text-foreground font-medium text-sm sm:text-lg md:text-xl tracking-tight flex-1">
                Require Multi-Factor Authentication (MFA)
              </h3>
              <div className="flex items-center space-x-2">
                <Switch defaultChecked={true} id="MFA" />
              </div>
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm">
              This will require users to set up MFA before accessing your workspace. We will not prompt users to set up MFA if they login with Google,
              GitHub, or use <span className="text-blue-400 cursor-pointer">Single-Sign-On</span>.
            </p>
          </div>

          <SettingCard
            title="Configure Session Timeout"
            onEdit={() => {}}
            badge={<span className="text-[10px] bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded uppercase font-bold">Preview</span>}
          >
            <p className="text-xs text-slate-400 mb-4 max-w-4xl">
              Configure the absolute duration and the maximum idle time allowed before requiring re-authentication.
              <span className="text-blue-400 flex items-center gap-1 mt-1 cursor-pointer">
                Learn More <ExternalLink size={12} />
              </span>
            </p>
            <div className="text-xs space-y-1">
              <p>
                <span className="text-muted-foreground/80 border-b border-dotted border-border">Absolute Session Timeout</span>: 12 hours
              </p>
              <p>
                <span className="text-muted-foreground/80 border-b border-dotted border-border">Idle Session Timeout</span>: None
              </p>
            </div>
          </SettingCard>

          {wData && <TrashWorkspace item={wData} canTrash={!!(session?.user?._id?.toString() === wData?.ownerUserId?.toString()) || false} />}
        </div>
      </main>
    </SidebarInset>
  );
}
