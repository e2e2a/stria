import { projectMemberClient } from '@/lib/client/api/projectMemberClient';
import { useQuery } from '@tanstack/react-query';

export function useGetMembersInProject(projectId: string) {
  return useQuery({
    queryKey: ['projectMembers', projectId],
    queryFn: () => projectMemberClient.getMembersInProject(projectId),
    enabled: !!projectId,
  });
}

export function useGetMyProjectMembership(projectId: string) {
  return useQuery({
    queryKey: ['projectMember', projectId],
    queryFn: () => projectMemberClient.getMyProjectMembership(projectId),
    enabled: !!projectId,
  });
}
