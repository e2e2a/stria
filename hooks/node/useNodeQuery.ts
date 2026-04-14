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
    staleTime: 3 * 1000,
  });
}

export function useNodeOutlinesQuery(id: string) {
  return useQuery({
    queryKey: ['nodeOutlines', id],
    queryFn: () => nodeClient.getOutlines(id),
    enabled: !!id,
    staleTime: 60 * 60 * 1000,
  });
}
