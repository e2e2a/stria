import { HttpError } from '@/utils/server/errors';
import { workspaceMemberRepository } from '@/modules/workspaces/members/member.repository';
import { ensureWorkspaceMember } from '../workspace.context';
import { UnitOfWork } from '@/common/UnitOfWork';

export const workspaceMemberService = {
  store: async (
    members: {
      role: 'owner' | 'editor' | 'viewer';
      email: string;
      invitedBy: string;
      workspaceId: string;
      status: 'pending' | 'accepted';
    }[]
  ) => {
    return await UnitOfWork.run(async () => {
      const docsToInsert = members.filter(m => m && typeof m === 'object' && Object.keys(m).length > 0);

      if (docsToInsert.length === 0) return [];
      const existing = await workspaceMemberService.checkWorkspaceMemberExistence(members);

      let nonExisting = members;
      if (existing.length > 0) nonExisting = members.filter(m => !existing.includes(m.email));
      if (nonExisting.length > 0) await workspaceMemberRepository.createMany(nonExisting);

      return true;
    });
  },

  move: async (oldwid: string, newwid: string, emails: string[]) => {
    return await UnitOfWork.run(async () => {
      const members = await workspaceMemberRepository.findMembers({ workspaceId: oldwid, emails });

      const newMembers = members?.map(m => {
        return {
          email: m.email,
          role: 'viewer' as 'owner' | 'editor' | 'viewer',
          invitedBy: m.invitedBy,
          status: m.status,
          workspaceId: newwid,
        };
      });
      await workspaceMemberService.store(newMembers);
      return true;
    });
  },

  initializeOwnership: async (data: { email: string; workspaceId: string }) => {
    return await workspaceMemberRepository.create({ ...data, role: 'owner', status: 'accepted' });
  },

  checkWorkspaceMemberExistence: async (
    members: {
      email: string;
      workspaceId: string;
    }[]
  ) => {
    const emails = members.map(m => m.email);
    return await workspaceMemberRepository.findExistingEmails(members[0].workspaceId, emails);
  },

  getMemberships: async (data: { workspaceId: string }) => {
    const members = await workspaceMemberRepository.findMembers(data);
    return members;
  },

  leave: async (data: { workspaceId: string; email: string }) => {
    return await UnitOfWork.run(async () => {
      const context = await ensureWorkspaceMember(data.workspaceId, data.email);
      if (!context.canLeave) throw new HttpError('FORBIDDEN', 'Cannot leave the workspace while you are the only owner');
      /**
       * @todo
       * 1. Notify admins user leaving in the workspace
       *
       */
      const res = await workspaceMemberRepository.deleteByWorkspaceIdAndEmail(data);
      if (!res) throw new HttpError('NOT_FOUND', 'No workspace member to be deleted');
      return res;
    });
  },

  update: async (mid: string, data: { workspaceId: string; email: string; role: string }) => {
    return await UnitOfWork.run(async () => {
      const context = await ensureWorkspaceMember(data.workspaceId, data.email);
      if (!context.permissions.canEditMember) throw new HttpError('FORBIDDEN');
      /**
       * @todo
       * 1. Notify admins user updating member roles
       *
       */
      const res = await workspaceMemberRepository.updateById(mid, { role: data.role });
      if (!res) throw new HttpError('NOT_FOUND', 'No workspace member to be deleted');
      return res;
    });
  },

  delete: async (mid: string, data: { workspaceId: string; email: string }) => {
    return await UnitOfWork.run(async () => {
      const context = await ensureWorkspaceMember(data.workspaceId, data.email);
      if (!context.permissions.canDeleteMember) throw new HttpError('FORBIDDEN');

      const res = await workspaceMemberRepository.findById(mid);
      if (!res) throw new HttpError('NOT_FOUND', 'No workspace member to be deleted');
      if (res.role === 'owner' && context.ownerCount <= 1) throw new HttpError('FORBIDDEN', 'Ownership of workspace should remain atleast 1');
      /**
       * @todo
       * 1. Notify admins user deleting member
       *
       */
      await workspaceMemberRepository.deleteById(mid);
      return res;
    });
  },

  // local
  deleteManyByWorkspaceId: async (workspaceId: string) => {
    return await workspaceMemberRepository.deleteMany({ workspaceId });
  },
};
