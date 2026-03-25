import { workspaceRepository } from '@/modules/workspaces/workspace.repository';
import { IWorkspaceMemberCreateDTO } from './members/member.dto';
import { workspaceMemberService } from './members/member.service';
import { User } from 'next-auth';
import { workspaceMemberRepository } from '@/modules/workspaces/members/member.repository';
import { UnitOfWork } from '@/common/UnitOfWork';
import { ensureWorkspaceMember } from './workspace.context';
import { HttpError } from '@/utils/server/errors';

export const workspaceService = {
  initializeWorkspace: async (user: User, workspaceDTO: { ownerUserId: string; title: string }, members: IWorkspaceMemberCreateDTO[]) => {
    return await UnitOfWork.run(async () => {
      const workspace = await workspaceRepository.store(workspaceDTO);
      await workspaceMemberService.initializeOwnership({
        email: user.email,
        workspaceId: workspace._id,
      });

      if (members.length > 0) {
        const membersDataToCreate = members.map(member => ({
          ...member,
          invitedBy: user._id!.toString(),
          workspaceId: workspace._id!.toString(),
          status: 'pending' as 'pending' | 'accepted',
        }));
        await workspaceMemberService.store(membersDataToCreate);
      }

      return { workspace };
    });
  },

  update: async (user: User, workspaceId: string, title: string) => {
    return await UnitOfWork.run(async () => {
      const ctx = await ensureWorkspaceMember(workspaceId, user.email);
      if (!ctx.permissions.canEditWorkspace) throw new HttpError('FORBIDDEN');

      const workspace = await workspaceRepository.updateOne({ _id: workspaceId }, { title });
      if (!workspace) throw new HttpError('NOT_FOUND', 'The requested workspace was not found');

      return { workspace };
    });
  },

  getUserWorkspaces: async (data: { email: string }) => {
    const { email } = data;
    const docs = await workspaceMemberRepository.findByEmailAndStatus({
      email,
      status: 'accepted',
    });

    const workspaces = docs.map(doc => {
      return {
        ...doc.workspaceId,
        membership: {
          role: doc.role,
          _id: doc._id,
          status: doc.status,
          createdAt: doc.createdAt,
          email: doc.email,
          invitedBy: doc.invitedBy,
        },
        projectCount: doc.projectCount,
        ownerCount: doc.ownerCount,
      };
    });
    return { workspaces };
  },

  getWorkspace: async (data: { _id: string; email: string }) => {
    const { _id, email } = data;
    await ensureWorkspaceMember(_id, email);
    const workspace = await workspaceRepository.findOne({ _id });
    return workspace;
  },
};
