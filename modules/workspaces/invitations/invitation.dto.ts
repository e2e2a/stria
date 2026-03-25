import { z } from 'zod';
import { ObjectId } from 'mongodb';

/**
 * InvitationDTO Namespace
 * Encapsulates all validation schemas (Input DTOs) for the Invitation entity.
 */
const objectIdSchema = (fieldName: string) =>
  z.string().refine(val => ObjectId.isValid(val), {
    message: `Invalid ${fieldName}`,
  });

const WorkspaceMemberCreateSchema = z.object({
  role: z.enum(['owner', 'editor', 'viewer']),
  email: z.string().email(),
});

export const InvitationDTO = {
  create: z.object({
    workspaceId: objectIdSchema('Workspace id'),
    projectId: objectIdSchema('Project id').optional(),
    members: z.array(WorkspaceMemberCreateSchema).nonempty('Members array cannot be empty'),
  }),
};
