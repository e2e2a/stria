import { z } from 'zod';
import { ObjectId } from 'mongodb';

/**
 * Project DTO Namespace
 * Encapsulates all validation schemas (Input DTOs) for the Project entity.
 */
const objectIdSchema = (fieldName: string) =>
  z.string().refine(val => ObjectId.isValid(val), {
    message: `Invalid ${fieldName}`, // field-specific message
  });

export const ProjectDTO = {
  create: z.object({
    title: z.string().min(1).max(100),
    workspaceId: objectIdSchema('workspaceId'),
  }),

  search: z.object({
    pid: objectIdSchema('workspaceId'),
    query: z.string().min(1).max(100),
  }),

  import: z.object({
    workspaceId: objectIdSchema('workspaceId'),
    title: z.string().min(1).max(255),
    nodes: z.array(
      z.object({
        name: z.string().min(1),
        path: z.string().min(1),
        content: z.string().default(''),
        type: z.enum(['file', 'folder']),
      })
    ),
  }),
};
