'use client';
import { DataTable } from '@/components/data-table';
import { SidebarInset } from '@/components/ui/sidebar';
import { notFound, useParams } from 'next/navigation';
import { columns } from './columns';
import { IWorkspaceMember } from '@/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useGetMembersInProject } from '@/hooks/projectMember/useQueries';
import { useProjectByIdQuery } from '@/hooks/project/useProjectQuery';
import { useGetMyWorkspaceMembership } from '@/hooks/workspasceMember/useQueries';

export function AccessUsersClient() {
  const params = useParams();
  const projectId = params.pid as string;
  const { data: pData, isLoading: pLoading, error: pError } = useProjectByIdQuery(projectId);
  const { data: mData, isLoading: pmLoading } = useGetMyWorkspaceMembership(pData?.project?.workspaceId);
  const { data, isLoading, error } = useGetMembersInProject(projectId);

  if (pError || error) return notFound();
  if (pLoading || pmLoading)
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
        <div className={cn('flex items-center', mData?.permissions?.canEditProjectMember ? 'justify-between' : '')}>
          <h1 className="text-2xl md:text-4xl font-bold drop-shadow-xs mb-2">Users</h1>
          {mData?.permissions?.canEditProjectMember && (
            <Link href={`/projects/${projectId}/access/users/invite`}>
              <Button className="cursor-pointer">Invite Users</Button>
            </Link>
          )}
        </div>
        <div className="">
          <DataTable columns={columns} data={(data?.members || []) as IWorkspaceMember[]} isLoading={isLoading} />
        </div>
      </main>
    </SidebarInset>
  );
}
