import { useProjectPresence } from '@/features/editor/stores/project-pressence';
import { nodeClient } from '@/lib/client/api/nodeClient';
import { INode } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useNodeMutations() {
  const queryClient = useQueryClient();
  const broadcastTreeUpdate = useProjectPresence(state => state.broadcastTreeUpdate);

  const create = useMutation({
    mutationFn: (data: { projectId: string; parentId: string | null; type: 'file' | 'folder'; title: string }) => nodeClient.create(data),
    onSuccess: (_data, variables) => {
      if (!variables) return;
      queryClient.invalidateQueries({ queryKey: ['nodesByProjectId', variables.projectId] });
      broadcastTreeUpdate();
    },
  });

  const restore = useMutation({
    mutationFn: (data: INode[]) => nodeClient.restore(data),
    onSuccess: (_data, variables) => {
      if (!variables || variables.length <= 0) return;
      for (const node of variables) {
        queryClient.invalidateQueries({ queryKey: ['nodesByProjectId', node.projectId] });
      }
    },
  });

  const update = useMutation({
    mutationFn: (data: { _id: string; pid?: string; title?: string; content?: string }) => nodeClient.update(data),
    onSuccess: (_data, variables) => {
      if (!variables) return;
      // condition for title only sidebar to rerender
      if (variables.title) queryClient.invalidateQueries({ queryKey: ['nodesByProjectId', variables.pid] });
      return;
    },
  });

  const move = useMutation({
    mutationFn: (data: { _id: string; pid: string; parentId: string | null }) => nodeClient.move(data),
    onSuccess: (_data, variables) => {
      if (!variables) return;
      queryClient.invalidateQueries({ queryKey: ['nodesByProjectId', variables.pid] });
      return;
    },
  });

  const trash = useMutation({
    mutationFn: (data: { _id: string; pid: string }) => nodeClient.trash(data),
    onSuccess: (_data, variables) => {
      if (!variables) return;
      if (variables.pid) queryClient.invalidateQueries({ queryKey: ['nodesByProjectId', variables.pid] });
      return;
    },
  });

  return { create, restore, update, move, trash };
}
