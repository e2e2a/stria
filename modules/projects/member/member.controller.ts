import { ensureAuthenticated } from '@/lib/server/auth-utils';
import { projectMemberService } from './member.service';
import { HttpError } from '@/utils/server/errors';
import { MembersSchema } from '@/lib/validators/workspaceMember';
import { NextRequest } from 'next/server';
import { ensureProjectMember } from '../project.context';

export const projectMemberController = {
  getMyMembership: async (workspaceId: string) => {
    const session = await ensureAuthenticated();
    const context = await ensureProjectMember(workspaceId, session.user.email);

    return { ...context };
  },

  create: async (req: NextRequest, pid: string) => {
    const body = await req.json();
    const session = await ensureAuthenticated();
    const { members } = body;

    let resM = null;
    if (members && members.length > 0) {
      resM = MembersSchema.safeParse(members);
      if (!resM.success) throw new HttpError('BAD_INPUT', 'Invalid member fields.');
    }

    const res = await projectMemberService.addMembers(session.user, pid, {
      ...(resM && resM?.data.length > 0 ? { members: resM.data } : {}),
    });

    return res;
  },

  getWorkspaceMembers: async (projectId: string) => {
    const session = await ensureAuthenticated();
    const members = await projectMemberService.getMemberships({ projectId, email: session.user.email });
    return { members };
  },
};
