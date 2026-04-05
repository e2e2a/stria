import { HttpError } from '@/utils/server/errors';
import { nodeService } from './node.service';
import { NodeDTO } from './node.dto';
import { ensureAuthenticated } from '@/lib/server/auth-utils';
import { INode } from '@/types';

export const nodeController = {
  getBacklink: async (id: string) => {
    const session = await ensureAuthenticated();
    if (!id) throw new HttpError('BAD_INPUT');
    const res = await nodeService.getBacklink(id, session.user);
    return res;
  },

  getProjectTree: async (pid: string, exclude?: string | null) => {
    const session = await ensureAuthenticated();
    if (!pid) throw new HttpError('BAD_INPUT');
    const nodes = await nodeService.getProjectNodeTree(session.user, pid, exclude || undefined);
    return nodes;
  },

  update: async (nid: string, rawBody: { title?: string; content?: string }) => {
    const session = await ensureAuthenticated();
    if (!nid) throw new HttpError('BAD_INPUT');
    const validatedBody = NodeDTO.update.safeParse({ ...rawBody, _id: nid });

    if (!validatedBody.success) {
      const errorMessage = validatedBody.error.issues[0].message;
      throw new HttpError('BAD_INPUT', errorMessage);
    }

    const updatedNode = await nodeService.update(validatedBody.data, session.user.email);
    return updatedNode;
  },

  create: async (rawBody: { title?: string; content?: string }) => {
    const session = await ensureAuthenticated();
    const validatedBody = NodeDTO.create.safeParse(rawBody);
    if (!validatedBody.success) {
      const errorMessage = validatedBody.error.issues[0].message;
      throw new HttpError('BAD_INPUT', errorMessage);
    }

    return await nodeService.create(session.user.email, validatedBody.data);
  },

  restore: async (rawBody: { nodes: INode[] }) => {
    const session = await ensureAuthenticated();
    if (!rawBody || rawBody.nodes.length === 0) throw new HttpError('BAD_INPUT', 'No nodes to insert');

    const validatedBody = NodeDTO.restore.safeParse(rawBody.nodes);
    if (!validatedBody.success) {
      const errorMessage = validatedBody.error.issues[0].message;
      throw new HttpError('BAD_INPUT', errorMessage);
    }

    const node = await nodeService.restore(session.user.email, validatedBody.data);
    return node;
  },

  delete: async (nid: string) => {
    const session = await ensureAuthenticated();
    if (!nid) throw new HttpError('BAD_INPUT');

    const updatedNode = await nodeService.delete(nid, session.user.email);
    return updatedNode;
  },

  move: async (rawBody: { _id: string; parentId: string }) => {
    const session = await ensureAuthenticated();
    const validatedBody = NodeDTO.move.safeParse(rawBody);

    if (!validatedBody.success) {
      const errorMessage = validatedBody.error.issues[0].message;
      throw new HttpError('BAD_INPUT', errorMessage);
    }

    const updatedNode = await nodeService.move(session.user.email, validatedBody.data);
    return updatedNode;
  },
};
