import { HttpError } from '@/utils/server/errors';
import { resolveWorkspacePermissions, WorkspacePermissions } from '@/utils/server/permissions';
import { workspaceMemberRepository } from './members/member.repository';
import { IWorkspaceMember } from '@/types';

export interface WorkspaceContext {
  membership: IWorkspaceMember | null;
  permissions: WorkspacePermissions;
  ownerCount: number;
  canLeave: boolean;
}

/**
 * Builds the security and logic context for a specific user within a workspace.
 */
export async function getWorkspaceContext(workspaceId: string, email: string): Promise<WorkspaceContext> {
  // 1. Fetch the member record from the sub-module repository
  const membership = await workspaceMemberRepository.getMembershipForWorkspace({
    workspaceId,
    email,
  });

  // 2. If no membership exists, they have no permissions (Guest/None)
  if (!membership)
    return {
      membership: null,
      permissions: resolveWorkspacePermissions('none'),
      ownerCount: 0,
      canLeave: false,
    };

  // 3. Map the role to boolean capabilities
  const permissions = resolveWorkspacePermissions(membership.role);

  return {
    membership: membership,
    permissions,
    ownerCount: membership.ownerCount,
    canLeave: canLeaveWorkspace(membership.role, membership.ownerCount),
  };
}

/**
 * A "Strict" version that throws an error if the user isn't a member.
 * Useful for protected routes like "Update Settings".
 */
export async function ensureWorkspaceMember(wid: string, email: string) {
  const context = await getWorkspaceContext(wid, email);
  if (!context.membership || context.membership.status === 'pending') throw new HttpError('FORBIDDEN', 'You are not a member of this workspace');

  return {
    membership: context.membership,
    permissions: context.permissions,
    ownerCount: context.ownerCount,
    canLeave: context.canLeave,
  };
}

// workspace.service.ts
export const canLeaveWorkspace = (role: string, ownerCount: number): boolean => {
  if (!role) return false;
  if (role !== 'owner') return true;

  return ownerCount > 1;
};
