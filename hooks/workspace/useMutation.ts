import { useMutation, useQueryClient } from '@tanstack/react-query';
import { IWorkspaceMemberCreateDTO } from '@/types';
import { workspaceClient } from '@/lib/client/api/workspaceClient';

export function useWorkspaceMutations() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (data: { userId: string; title: string; members: IWorkspaceMemberCreateDTO[] }) => workspaceClient.create(data),
    onSuccess: (_data, variables) => {
      if (!variables) return;
      queryClient.invalidateQueries({ queryKey: ['userWorkspaces', variables.userId] });
      return;
    },
  });

  const update = useMutation({
    mutationFn: (data: { wid: string; title: string }) => workspaceClient.update(data),
    onSuccess: (_data, variables) => {
      if (!variables) return;
      queryClient.invalidateQueries({ queryKey: ['workspace', variables.wid] });
      return;
    },
  });

  const trash = useMutation({
    mutationFn: (data: { wid: string }) => workspaceClient.trash(data),
    onSuccess: (_data, variables) => {
      if (!variables) return;
      queryClient.removeQueries({ queryKey: ['workspace', variables.wid] });
      queryClient.invalidateQueries({ queryKey: ['userWorkspaces'] });
      return;
    },
  });

  return { create, update, trash };
}
