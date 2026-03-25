import { workspaceClient } from '@/lib/client/api/workspaceClient';
import { useQuery } from '@tanstack/react-query';

export function useGetUserWorkspaces(userId: string) {
  return useQuery({
    queryKey: ['userWorkspaces', userId],
    queryFn: () => workspaceClient.getUserWorkspaces(),
    enabled: !!userId,
  });
}

export function useGetWorkspace(wid: string) {
  return useQuery({
    queryKey: ['workspace', wid],
    queryFn: () => workspaceClient.getWorkspace(wid),
    enabled: !!wid,
  });
}
