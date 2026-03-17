import { HttpError } from '@/utils/server/errors';
import { workspaceMemberRepository } from '@/modules/workspaces/members/member.repository';
import { workspaceMemberService } from '../members/member.service';
import { User } from 'next-auth';
import { IWorkspaceMemberCreateDTO } from '@/types';
import { projectMemberService } from '../../projects/member/member.service';
import { MembersSchema } from '@/lib/validators/workspaceMember';
import { ensureWorkspaceMember } from '../workspace.context';
import { UnitOfWork } from '@/common/UnitOfWork';

export const invitationServices = {
  /**
   * Permission rules:
   * 1. Workspace roles:
   *    - owner or editor can invite members (workspace and project invitations)
   *    - viewer cannot invite members
   *
   * 2. Project roles:
   *    - owner or editor permissions apply only to actions inside the project content
   *      (e.g., creating/editing/deleting nodes or files)
   *    - project roles do NOT override workspace-level permissions
   *      (e.g., inviting members or renaming the project is blocked for workspace viewers)
   */
  create: async (
    user: User,
    data: {
      workspaceId: string;
      projectId?: string;
      members: IWorkspaceMemberCreateDTO[];
    }
  ) => {
    return await UnitOfWork.run(async () => {
      const { workspaceId, projectId, members } = data;

      const res = MembersSchema.safeParse(members);
      if (!res.success) throw new HttpError('BAD_INPUT', 'Invalid member fields.');

      if (members.length <= 0) throw new HttpError('BAD_INPUT', 'No Members to be invited.');

      const context = await ensureWorkspaceMember(data.workspaceId, user.email);
      if (!context.permissions.canInvite) throw new HttpError('FORBIDDEN', 'You do not have permission to invite members');

      const initialMembersData = members.map(member => ({ ...member, workspaceId }));

      const workspaceMembers = initialMembersData.map(m => ({
        ...m,
        invitedBy: user._id!,
        // @Note: reason as 'viewer' because it is invited due to project member creation not invitation in the workspace
        ...(projectId ? { role: 'viewer' as const } : {}),
        status: 'pending' as const,
      }));
      await workspaceMemberService.store(workspaceMembers);

      if (projectId) {
        const workspaceMembers = initialMembersData.map(m => ({ ...m, projectId }));
        await projectMemberService.store(workspaceMembers);
      }

      return true;
    });
  },

  getPendingInvitations: async (data: { email: string }) => {
    const docs = await workspaceMemberRepository.findByEmailAndStatus({ email: data.email, status: 'pending' }, { invitedBy: true });
    const invitations = docs.map(doc => {
      return {
        role: doc.role,
        _id: doc._id,
        status: doc.status,
        createdAt: doc.createdAt,
        email: doc.email,
        invitedBy: {
          _id: doc.invitedBy._id,
          email: doc.invitedBy.email,
          given_name: doc.invitedBy.given_name,
          family_name: doc.invitedBy.family_name,
          last_login: doc.invitedBy.last_login,
        },
        workspace: {
          ...doc.workspaceId,
          ownerCount: doc.ownerCount,
        },
      };
    });
    return invitations;
  },

  // strict: the invited user can only accept the invitation by the parameter email: session.user.email
  accept: async (data: { email: string; _id: string }) => {
    return await UnitOfWork.run(async () => {
      const res = await workspaceMemberRepository.updateStatus(data, {
        status: 'accepted',
      });
      if (!res) throw new HttpError('NOT_FOUND', 'No Invitation to be accepted');
      return res;
    });
  },

  delete: async (data: { _id: string; email: string }) => {
    return await UnitOfWork.run(async () => {
      const invitation = await workspaceMemberRepository.deleteById(data._id);
      if (!invitation) throw new HttpError('NOT_FOUND', 'No Invitation to be deleted');

      const context = await ensureWorkspaceMember(invitation.workspaceId, data.email);
      if (!context.permissions.canDeleteInvite) throw new HttpError('FORBIDDEN', 'You do not have permission');
      return invitation;
    });
  },

  reject: async (data: { _id: string; email: string }) => {
    /**
     * @todo
     * Feature resend
     * Reject must be soft delete
     */
    return await UnitOfWork.run(async () => {
      const res = await workspaceMemberRepository.deleteById(data._id);
      if (!res) throw new HttpError('NOT_FOUND', 'No Invitation to be rejected');
      return res;
    });
  },
};
