import { ensureAuthenticated } from '@/lib/server/auth-utils';
import { workspaceService } from './workspace.service';
import { NextRequest } from 'next/server';
import { HttpError } from '@/utils/server/errors';
import { WorkspaceDTO } from './workspace.dto';

export const workspaceController = {
  create: async (req: NextRequest) => {
    const session = await ensureAuthenticated();
    const rawBody = await req.json();

    const validatedBody = WorkspaceDTO.initialize.safeParse({ ...rawBody });
    if (!validatedBody.success) {
      const errorMessage = validatedBody.error.issues[0].message;
      throw new HttpError('BAD_INPUT', errorMessage);
    }

    const { title, members } = validatedBody.data;
    const res = await workspaceService.initializeWorkspace(session.user, { ownerUserId: session.user._id, title }, members);
    return res;
  },

  update: async (req: NextRequest, wid: string) => {
    const session = await ensureAuthenticated();
    const rawBody = await req.json();

    const validatedBody = WorkspaceDTO.update.safeParse({ ...rawBody });
    if (!validatedBody.success) {
      const errorMessage = validatedBody.error.issues[0].message;
      throw new HttpError('BAD_INPUT', errorMessage);
    }

    const { title } = validatedBody.data;
    const res = await workspaceService.update(session.user, wid, title);
    return res;
  },

  getUserWorkspaces: async () => {
    const session = await ensureAuthenticated();
    const workspaces = await workspaceService.getUserWorkspaces({ email: session.user.email });
    return workspaces;
  },

  getWorkspace: async (wid: string) => {
    const session = await ensureAuthenticated();
    const workspaces = await workspaceService.getWorkspace({ _id: wid, email: session.user.email });
    return workspaces;
  },
};
