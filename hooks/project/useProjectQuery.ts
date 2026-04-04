import { projectClient } from '@/lib/client/api/projectClient';
import { useQuery } from '@tanstack/react-query';

export function useGetProjectsByWorkspaceId(workspaceId: string) {
  return useQuery({
    queryKey: ['projectsByWorkspaceId', workspaceId],
    queryFn: () => projectClient.getProjectsByWorkspace(workspaceId),
    enabled: !!workspaceId,
  });
}

export function useProjectByIdQuery(id: string) {
  return useQuery({
    queryKey: ['projectById', id],
    queryFn: () => projectClient.getProjectById(id),
    enabled: !!id,
  });
}

export function useProjectSearchQuery(projectId: string, query: string) {
  return useQuery({
    queryKey: ['projectSearch', projectId, query],
    queryFn: () => projectClient.search(projectId, query),
    enabled: !!projectId && query.trim().length > 0,
    placeholderData: previousData => previousData,
  });
}

export function useProjectPropertiesQuery(id: string) {
  return useQuery({
    queryKey: ['projectProperties', id],
    queryFn: () => projectClient.getProperties(id),
    enabled: !!id,
  });
}
