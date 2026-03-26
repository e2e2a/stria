'use client';
import { DataTable } from '@/components/data-table';
import { SidebarInset } from '@/components/ui/sidebar';
import { notFound, useParams } from 'next/navigation';
import { columns } from './columns';
import { IWorkspaceMember } from '@/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useGetMembersInWorkspace, useGetMyWorkspaceMembership } from '@/hooks/workspasceMember/useQueries';
import { cn } from '@/lib/utils';

export function AccessUsersClient() {
  const params = useParams();
  const workspaceId = params.id as string;
  const { data: mData, isLoading: mLoading } = useGetMyWorkspaceMembership(workspaceId);
  const { data, isLoading, error } = useGetMembersInWorkspace(workspaceId);

  if (error) return notFound();
  if (mLoading)
    return (
      <div className="fixed inset-0 z-200 bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-muted-foreground">Loading Project...</p>
        </div>
      </div>
    );

  return (
    <SidebarInset className="flex flex-col h-full w-full">
      <main className="p-6 lg:p-8 w-full flex-1 overflow-y-auto">
        <div className={cn('flex items-center', mData?.permissions.canInvite ? 'justify-between' : '')}>
          <h1 className="text-2xl md:text-4xl font-bold drop-shadow-xs mb-2">Users</h1>
          {mData?.permissions.canInvite && (
            <Link href={`/workspaces/${workspaceId}/access/users/invite`}>
              <Button className="cursor-pointer">Invite Users</Button>
            </Link>
          )}
        </div>
        <div className="">
          <DataTable columns={columns} data={(data.members || []) as IWorkspaceMember[]} isLoading={isLoading} />
        </div>
      </main>
    </SidebarInset>
  );
}
