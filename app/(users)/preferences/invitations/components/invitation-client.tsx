'use client';
import { SidebarInset } from '@/components/ui/sidebar';
import { DataTable } from '@/components/data-table';
import { columns } from './columns';
import { IUserInvitations } from '@/types';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { useGetUserInvitations } from '@/hooks/invitation/useQuery';
import { makeToastError } from '@/lib/toast';
import { useEffect } from 'react';

export const InvitationClient = () => {
  const { data: session, status } = useSession();
  const { data: iData, isLoading, error } = useGetUserInvitations(session?.user?._id as string);

  useEffect(() => {
    if (error) makeToastError(error.message);
  }, [error]);

  if (status === 'loading') return;

  return (
    <SidebarInset className="flex flex-col h-screen w-full overflow-hidden">
      <div className="p-6 lg:p-8 w-full flex-1 overflow-y-auto">
        <h1 className="text-2xl md:text-4xl font-bold drop-shadow-xs mb-2">Invitations</h1>
        <div className={cn('overflow-x-auto')}>
          <DataTable columns={columns} data={(iData?.invitations || []) as IUserInvitations[]} isLoading={isLoading} />
        </div>
      </div>
    </SidebarInset>
  );
};
