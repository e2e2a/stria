import { z } from 'zod';
import { IArchived, IUser } from '@/types';

export type IWorkspace = {
  _id: string;
  ownerUserId: IUser | string;
  title: string;
  archived?: IArchived;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * WorkspaceDTO Namespace
 * Encapsulates all validation schemas (Input DTOs) for the Workspace entity.
 */

const WorkspaceMemberCreateSchema = z.object({
  role: z.enum(['owner', 'editor', 'viewer']),
  email: z.string().email(),
});

export const WorkspaceDTO = {
  initialize: z.object({
    title: z.string().min(1, 'title is required'),
    members: z.array(WorkspaceMemberCreateSchema).default([]),
  }),

  update: z.object({
    title: z.string().min(1, 'title is required'),
  }),
};
