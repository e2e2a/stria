import { HttpError } from '@/utils/server/errors';
import { projectMemberRepository } from '@/modules/projects/member/member.repository';
import { UnitOfWork } from '@/common/UnitOfWork';
import { ensureWorkspaceMember } from '@/modules/workspaces/workspace.context';
import { ensureProjectMember } from '../project.context';
import { projectRepository } from '../project.repository';
import { User } from 'next-auth';
import { projectService } from '../project.service';
import { workspaceMemberService } from '@/modules/workspaces/members/member.service';

export const projectMemberService = {
  addMembers: async (
    user: User,
    pid: string,
    data: {
      members?: { email: string; role: 'owner' | 'editor' | 'viewer' }[];
    }
  ) => {
    return await UnitOfWork.run(async () => {
      const project = await projectService.findById(pid);
      await ensureWorkspaceMember(project.workspaceId, user.email);

      const baseMemberData = { projectId: project._id.toString(), workspaceId: project.workspaceId };
      if (data.members && data.members.length > 0) {
        const workspaceMembersDataToCreate = data.members.map(member => ({
          ...member,
          ...baseMemberData,
          status: 'pending' as const,
          invitedBy: user.email,
          role: 'viewer' as const,
        }));
        const projectMembersDataToCreate = data.members.map(member => ({
          ...member,
          ...baseMemberData,
        }));
        await workspaceMemberService.store(workspaceMembersDataToCreate);
        await projectMemberService.store(projectMembersDataToCreate);
      }

      return true;
    });
  },

  store: async (
    members: {
      role: 'owner' | 'editor' | 'viewer';
      email: string;
      workspaceId: string;
      projectId: string;
    }[]
  ) => {
    return await UnitOfWork.run(async () => {
      // Project members
      const existingP = await projectMemberService.checkProjectMemberExistence(members);
      let nonExistingP = members;
      if (existingP.length > 0) nonExistingP = members.filter(m => !existingP.includes(m.email));
      if (nonExistingP.length > 0) await projectMemberRepository.createMany(members);

      return true;
    });
  },

  move: async (oldwid: string, newwid: string, projectId: string) => {
    return await UnitOfWork.run(async () => {
      const dataToUpdate = {
        role: 'viewer' as const,
        workspaceId: newwid,
      };
      // @Note: reason to update because project member cannot be exist without the project.
      const members = await projectMemberRepository.findMany({ projectId, workspaceId: oldwid });
      await projectMemberRepository.updateMany({ projectId, workspaceId: oldwid }, dataToUpdate);
      return members;
    });
  },

  checkProjectMemberExistence: async (
    members: {
      email: string;
      workspaceId: string;
      projectId: string;
    }[]
  ) => {
    const emails = members.map(m => m.email);
    return await projectMemberRepository.findExistingEmails(members[0].workspaceId, members[0].projectId, emails);
  },

  getMembership: async (data: { projectId: string; email: string }) => {
    const membership = await projectMemberRepository.findOne(data);
    if (!membership) throw new HttpError('FORBIDDEN', 'Not a project member');
    return membership;
  },

  addOwner: (data: { projectId: string; workspaceId: string; email: string }) => projectMemberRepository.create({ ...data, role: 'owner' }),

  getMemberships: async (data: { projectId: string; email: string }) => {
    const { email, projectId } = data;
    const project = await projectRepository.findOne({ _id: projectId });
    await Promise.all([
      ensureWorkspaceMember(project.workspaceId, email), // wCtx
      ensureProjectMember(project._id, email), // pCtx
    ]);
    const members = await projectMemberRepository.findMembers({ ...data, workspaceId: project.workspaceId });
    return members;
  },
};
