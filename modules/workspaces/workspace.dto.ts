import { z } from 'zod';
import { ObjectId } from 'mongodb';

/**
 * InvitationDTO Namespace
 * Encapsulates all validation schemas (Input DTOs) for the Workspace entity.
 */
const objectIdSchema = (fieldName: string) =>
  z.string().refine(val => ObjectId.isValid(val), {
    message: `Invalid ${fieldName}`,
  });

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
