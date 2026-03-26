'use client';
import { SidebarInset } from '@/components/ui/sidebar';
import { DataTable } from '@/components/data-table';
import { columns } from './columns';
import { IUserWorkspaces } from '@/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useGetUserWorkspaces } from '@/hooks/workspace/useQuery';
import { useEffect } from 'react';
import { makeToastError } from '@/lib/toast';

export const WorkspaceClient = () => {
  const { data: session, status } = useSession();
  const { data, isLoading, error } = useGetUserWorkspaces(session?.user?._id as string);

  useEffect(() => {
    if (error) makeToastError(error.message);
  }, [error]);

  if (status === 'loading') return;

  return (
    <SidebarInset className="flex flex-col h-full w-full">
      <main className="p-6 lg:p-8 w-full flex-1 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-4xl font-bold drop-shadow-xs ">Workspaces</h1>
          <Button className="cursor-pointer" asChild>
            <Link href={'/preferences/workspaces/create'}>Create New Workspace</Link>
          </Button>
        </div>
        <div className="">
          <DataTable columns={columns} data={(data?.workspaces || []) as IUserWorkspaces[]} isLoading={isLoading} />
        </div>
      </main>
    </SidebarInset>
  );
};
