'use client';
import { DataTable } from '@/components/data-table';
import { SidebarInset } from '@/components/ui/sidebar';
import { notFound, useParams } from 'next/navigation';
import { columns } from './columns';
import { IProject } from '@/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useGetProjectsByWorkspaceId } from '@/hooks/project/useProjectQuery';
import { cn } from '@/lib/utils';
import { useGetMyWorkspaceMembership } from '@/hooks/workspasceMember/useQueries';
import ImportProject from './import-project';
import { PlusIcon } from 'lucide-react';

export function WorkspaceProjectsClient() {
  const params = useParams();
  const workspaceId = params.id as string;
  const { data: mData } = useGetMyWorkspaceMembership(workspaceId);
  const { data, error, isLoading } = useGetProjectsByWorkspaceId(workspaceId);
  if (error) return notFound();

  return (
    <SidebarInset className="flex flex-col h-screen w-full! overflow-hidden">
      <div className="px-3 py-4 w-full! flex-1 overflow-y-auto">
        <div className={cn('flex items-center', mData?.permissions.canCreateProject ? 'justify-between' : '')}>
          <h1 className="text-2xl md:text-4xl font-bold drop-shadow-xs mb-2">Projects</h1>
          <div className="flex gap-x-2">
            {mData?.permissions.canCreateProject && (
              <Button className="cursor-pointer" asChild>
                <Link href={`/workspaces/${workspaceId}/projects/create`}>
                  <PlusIcon className=" h-4 w-4" /> Create New Project
                </Link>
              </Button>
            )}
            {mData?.permissions.canImportProject && <ImportProject workspaceId={workspaceId} />}
          </div>
        </div>
        <div className="w-full">
          <DataTable columns={columns} data={(data || []) as IProject[]} isLoading={isLoading} />
        </div>
      </div>
    </SidebarInset>
  );
}
