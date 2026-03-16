import { nodeClient } from '@/lib/client/api/nodeClient';
import { useQuery } from '@tanstack/react-query';

export function useNodesProjectIdQuery(projectId: string) {
  return useQuery({
    queryKey: ['nodesByProjectId', projectId],
    queryFn: () => nodeClient.getNodes(projectId),
    enabled: !!projectId,
  });
}

export function useNodeBacklinksQuery(id: string) {
  return useQuery({
    queryKey: ['nodeBacklinks', id],
    queryFn: () => nodeClient.getBacklinks(id),
    enabled: !!id,
  });
}
