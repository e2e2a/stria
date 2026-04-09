import { nodeRepository } from '@/modules/projects/nodes/node.repository';
import { ObjectId } from 'mongoose';
import { projectService } from '../project.service';
import { ensureWorkspaceMember } from '@/modules/workspaces/workspace.context';
import { ensureProjectMember } from '../project.context';
import { HttpError } from '@/utils/server/errors';
import { UnitOfWork } from '@/common/UnitOfWork';
import { User } from 'next-auth';
import Node from '@/modules/projects/nodes/node.model';
import { Types } from 'mongoose';
import { parseLink } from '@/helpers/server/link-helpers';

export interface Mention {
  excerpt: string;
  line: number;
  index: number;
  length: number; // optional
  heading?: string; // optional
  alias?: string; // optional
}

export interface BacklinkResponse {
  _id: string | Types.ObjectId;
  title: string;
  path: string;
  type: 'file' | 'folder';
  mentions: Mention[];
}

const ALLOWED = ['content', 'chunks', 'createdAt', 'updatedAt'] as const;
export type ExcludeField = (typeof ALLOWED)[number];
interface FlatNode {
  _id: ObjectId;
  parentId: ObjectId | null;
  children: ObjectId[];
  title: string;
  type: 'file' | 'folder';
  path: string;
  content?: string;
}

export interface TreeNode extends Omit<FlatNode, 'children'> {
  children: TreeNode[];
}

/**
 * Recursively sorts a tree structure:
 * 1. Folders before Files
 * 2. Alphabetical (Case-Insensitive) within the same type
 */
export function sortNodeTree(nodes: TreeNode[]): TreeNode[] {
  const sortFn = (a: TreeNode, b: TreeNode) => {
    // Folders first logic
    if (a.type === 'folder' && b.type !== 'folder') return -1;
    if (a.type !== 'folder' && b.type === 'folder') return 1;

    // Alphabetical secondary sort
    return a.title.localeCompare(b.title, undefined, {
      sensitivity: 'base',
      numeric: true,
    });
  };

  // Sort the current level
  nodes.sort(sortFn);

  // Recursively sort children
  for (const node of nodes) {
    if (node.children && node.children.length > 0) {
      sortNodeTree(node.children);
    }
  }

  return nodes;
}

/**
 * O(n) Tree Builder
 * Uses a Map for constant-time lookups.
 * Assumes the flat array contains all nodes in the adjacency list.
 */
export function buildTree(nodes: FlatNode[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  // Pass 1: Initialize the map with TreeNode objects
  for (const node of nodes) {
    map.set(node._id.toString(), { ...node, children: [] });
  }

  // Pass 2: Wire up the hierarchy
  for (const node of nodes) {
    const idStr = node._id.toString();
    const currentTreeNode = map.get(idStr)!;

    if (node.parentId) {
      const parentIdStr = node.parentId.toString();
      const parent = map.get(parentIdStr);

      if (parent) {
        parent.children.push(currentTreeNode);
      } else {
        // Handle orphaned nodes as roots or throw based on your business logic
        roots.push(currentTreeNode);
      }
    } else {
      // No parentId means it's a root node
      roots.push(currentTreeNode);
    }
  }

  return roots;
}

async function checkNodeExistence(params: { projectId: string; path: string; type: 'file' | 'folder' }) {
  const { projectId, path, type } = params;

  const existingNode = await nodeRepository.findOneCollated({
    projectId,
    path: { $regex: new RegExp(`^${path}$`, 'i') },
    type,
  });
  if (existingNode) throw new HttpError('CONFLICT', `A ${type} named "${path}" already exists`);
}

export const nodeService = {
  getBacklink: async (targetId: string, user: User): Promise<{ linked: BacklinkResponse[]; unlinked: BacklinkResponse[] }> => {
    const targetNode = await nodeRepository.findOne({ _id: targetId });
    if (!targetNode) return { linked: [], unlinked: [] };

    if (user.role !== 'admin')
      await Promise.all([ensureWorkspaceMember(targetNode.workspaceId, user.email), ensureProjectMember(targetNode.projectId, user.email)]);

    const allNodes = await nodeRepository.findMany({ projectId: targetNode.projectId });

    const normalize = (p: string | undefined | null): string => {
      if (!p) return '';
      let cleanPath = p;

      cleanPath = cleanPath.replace(/[<>]/g, '').replace(/\+/g, ' ');

      try {
        cleanPath = decodeURIComponent(cleanPath);
      } catch {
        cleanPath = cleanPath.replace(/%20/g, ' ').replace(/%28/g, '(').replace(/%29/g, ')');
      }

      return cleanPath.replace(/\\/g, '/').replace(/\.md$/i, '').toLowerCase().trim();
    };

    const resolveRelative = (basePath: string, linkPath: string) => {
      const parts = basePath.replace(/\\/g, '/').split('/');
      parts.pop();
      const linkParts = linkPath.replace(/\\/g, '/').split('/');
      for (const part of linkParts) {
        if (part === '.') continue;
        if (part === '..') parts.pop();
        else parts.push(part);
      }
      return normalize(parts.join('/'));
    };

    const fullPathMap = new Map<string, (typeof allNodes)[0]>();
    const nameMap = new Map<string, (typeof allNodes)[0][]>();

    allNodes.forEach(n => {
      const full = normalize(n.path);
      const name = full.split('/').pop() || '';
      fullPathMap.set(full, n);
      if (!nameMap.has(name)) nameMap.set(name, []);
      nameMap.get(name)!.push(n);
    });

    const resolveGraphTarget = (sourcePath: string, rawLink: string) => {
      const linkName = normalize(rawLink);
      const currentDir = normalize(sourcePath).split('/').slice(0, -1).join('/');

      let target = fullPathMap.get(currentDir ? `${currentDir}/${linkName}` : linkName);
      if (!target && rawLink.startsWith('.')) target = fullPathMap.get(resolveRelative(sourcePath, linkName));

      if (!target) {
        const potentials = nameMap.get(linkName);
        if (potentials) target = potentials[0];
      }
      return target;
    };

    const targetTitle = targetNode.title || '';
    const cleanTitle = targetTitle.replace(/\s+/g, '');
    const shouldSearchUnlinked = cleanTitle.length >= 3;
    const escapedTitle = targetTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const unlinkedRegex = shouldSearchUnlinked ? new RegExp(`\\b${escapedTitle}\\b`, 'gi') : null;

    const extractMentionData = (content: string, index: number, length: number) => {
      const lineIndex = content.substring(0, index).split('\n').length;
      const lineStart = content.lastIndexOf('\n', index) + 1;
      const lineEnd = content.indexOf('\n', index);
      const excerptEnd = lineEnd === -1 ? content.length : lineEnd;
      return {
        excerpt: content.substring(lineStart, excerptEnd).trim(),
        line: lineIndex,
        index,
        length,
      };
    };

    const linkedBacklinks: BacklinkResponse[] = [];
    const unlinkedMentions: BacklinkResponse[] = [];

    for (const otherNode of allNodes) {
      if (otherNode._id.toString() === targetId || !otherNode.content) continue;

      const content = otherNode.content.replace(/\r/g, '');
      const linkedInThisFile: Mention[] = [];
      const unlinkedInThisFile: Mention[] = [];
      const linkedIndices = new Set<number>();

      const linkRegex = /\[\[([^\]]+)\]\]|\[([^\]]+)\]\(((?:[^()]+|\([^()]*\))+)\)/g;
      let match: RegExpExecArray | null;

      while ((match = linkRegex.exec(content)) !== null) {
        let rawLink: string = (match[1] || match[3] || '').split('|')[0].split('#')[0];
        rawLink = rawLink.replace(/\s+["'].*?["']$/, '').trim();

        const alias: string | undefined = match[2];

        const parsed = parseLink(rawLink);
        const resolvedTarget = resolveGraphTarget(otherNode.path, parsed.path);

        if (resolvedTarget && resolvedTarget._id.toString() === targetId) {
          for (let i = match.index; i < match.index + match[0].length; i++) {
            linkedIndices.add(i);
          }

          linkedInThisFile.push({
            ...extractMentionData(content, match.index, match[0].length),
            heading: parsed.heading,
            alias: alias || parsed.alias,
          });
        }
      }

      if (unlinkedRegex) {
        unlinkedRegex.lastIndex = 0;
        let uMatch: RegExpExecArray | null;
        while ((uMatch = unlinkedRegex.exec(content)) !== null) {
          if (!linkedIndices.has(uMatch.index)) unlinkedInThisFile.push(extractMentionData(content, uMatch.index, uMatch[0].length));
        }
      }

      if (linkedInThisFile.length > 0) {
        linkedBacklinks.push({
          _id: otherNode._id.toString(),
          title: otherNode.title,
          path: otherNode.path,
          type: otherNode.type,
          mentions: linkedInThisFile,
        });
      }

      if (unlinkedInThisFile.length > 0) {
        unlinkedMentions.push({
          _id: otherNode._id.toString(),
          title: otherNode.title,
          path: otherNode.path,
          type: otherNode.type,
          mentions: unlinkedInThisFile,
        });
      }
    }

    return { linked: linkedBacklinks, unlinked: unlinkedMentions };
  },

  // this is only called in local
  getProjectFlatNode: async (data: { projectId: string; type?: 'file' | 'folder' }, exclude?: string) => {
    const fields = (exclude
      ?.split(',')
      .map(f => f.trim())
      .filter(Boolean) ?? []) as ExcludeField[];

    if (!fields.every(f => ALLOWED.includes(f))) throw new HttpError('BAD_INPUT', `Only ${ALLOWED.join(', ')} can be excluded.`);
    const flatNodes = await nodeRepository.findMany(data, fields);
    return flatNodes;
  },

  getProjectNodeTree: async (user: User, projectId: string, exclude?: string): Promise<{ nodes: TreeNode[] }> => {
    const project = await projectService.findById(projectId);
    if (!project) throw new HttpError('NOT_FOUND', `Project not found`);
    if (user.role !== 'admin')
      await Promise.all([
        ensureWorkspaceMember(project.workspaceId, user.email), // wCtx
        ensureProjectMember(project._id, user.email), // pCtx
      ]);

    const fields = (exclude
      ?.split(',')
      .map(f => f.trim())
      .filter(Boolean) ?? []) as ExcludeField[];

    if (!fields.every(f => ALLOWED.includes(f))) throw new HttpError('BAD_INPUT', `Only ${ALLOWED.join(', ')} can be excluded.`);
    const flatNodes = await nodeRepository.findMany({ projectId }, fields);
    const nodes = buildTree(flatNodes);
    const sortedTree = sortNodeTree(nodes);
    return { nodes: sortedTree };
  },

  create: async (
    email: string,
    data: {
      projectId: string;
      parentId: string | null;
      type: 'file' | 'folder';
      title: string;
    }
  ) => {
    const project = await projectService.findById(data.projectId);

    const [, pCtx] = await Promise.all([ensureWorkspaceMember(project.workspaceId, email), ensureProjectMember(project._id, email)]);
    if (!pCtx.permissions.canCreateNode) throw new HttpError('FORBIDDEN');

    let path = data.title;

    if (data.parentId) {
      const parentNode = await nodeRepository.findOne({ _id: data.parentId });
      if (!parentNode) throw new HttpError('NOT_FOUND', 'Parent node not found');
      if (parentNode.type !== 'folder') throw new HttpError('BAD_INPUT', 'Parent node must be a folder');

      // Combine parent path with new title
      path = `${parentNode.path}/${data.title}`;
    }

    await checkNodeExistence({ ...data, path });
    return await UnitOfWork.run(async () => {
      return await nodeRepository.create({ ...data, path, workspaceId: project.workspaceId });
    });
  },

  restore: async (
    email: string,
    data: {
      _id: string;
      projectId: string;
      workspaceId: string;
      parentId: string | null;
      path: string;
      type: 'file' | 'folder';
      title: string;
    }[]
  ) => {
    const { projectId, workspaceId } = data[0];

    const [, pCtx] = await Promise.all([ensureWorkspaceMember(workspaceId, email), ensureProjectMember(projectId, email)]);
    if (!pCtx.permissions.canCreateNode) throw new HttpError('FORBIDDEN');

    const project = await projectService.findById(projectId);
    for (const node of data) {
      if (node.projectId !== projectId) throw new HttpError('BAD_INPUT', 'All nodes must belong to the same project');
      if (node.parentId) {
        const parentNode = await nodeRepository.findOne({ _id: node.parentId });
        if (!parentNode) throw new HttpError('NOT_FOUND', `Parent node ${node.parentId} not found`);
      }
      await checkNodeExistence(node);
      node.workspaceId = project.workspaceId;
    }

    return await nodeRepository.insertMany(data);
  },

  update: async (data: { _id: string; title?: string; content?: string }, email: string) => {
    const node = await nodeRepository.findOne({ _id: data._id });
    if (!node) throw new HttpError('NOT_FOUND', 'Node not found');

    const [, pCtx] = await Promise.all([ensureWorkspaceMember(node.workspaceId, email), ensureProjectMember(node.projectId, email)]);
    if (!pCtx.permissions.canEditNode) throw new HttpError('FORBIDDEN');

    if (data.title) await checkNodeExistence({ ...node, title: data.title });

    return await nodeRepository.updateOne({ _id: data._id }, data);
  },

  move: async (email: string, data: { _id: string; parentId: string | null }) => {
    const node = await nodeRepository.findOne({ _id: data._id });
    if (!node) throw new HttpError('NOT_FOUND', 'Node not found');
    if (node.parentId?.toString() === data?.parentId) throw new HttpError('BAD_INPUT', 'Node is already in the parent node');
    if (node._id.toString() === data?.parentId) throw new HttpError('BAD_INPUT', 'Node cannot be moved to itself');

    const [, pCtx] = await Promise.all([ensureWorkspaceMember(node.workspaceId, email), ensureProjectMember(node.projectId, email)]);
    if (!pCtx.permissions.canMoveNode) throw new HttpError('FORBIDDEN');

    let newPath = node.title || node.name;
    if (data.parentId) {
      const parentNode = await nodeRepository.findOne({ _id: data.parentId });
      if (!parentNode) throw new HttpError('NOT_FOUND', 'Parent node not found');
      if (parentNode.type !== 'folder') throw new HttpError('BAD_INPUT', 'Parent node is not a folder');

      newPath = `${parentNode.path}/${node.title || node.name}`;
    }

    const oldPath = node.path;

    if (node.type === 'folder') {
      const descendants = await Node.find({
        projectId: node.projectId,
        path: new RegExp(`^${oldPath}/`),
      });

      if (descendants.length > 0) {
        const bulkOps = descendants.map(desc => {
          const updatedDescPath = desc.path.replace(oldPath, newPath);
          return {
            updateOne: {
              filter: { _id: desc._id },
              update: { $set: { path: updatedDescPath } },
            },
          };
        });

        await Node.bulkWrite(bulkOps);
      }
    }

    await checkNodeExistence({ ...node, parentId: data.parentId });
    return await nodeRepository.updateOne({ _id: data._id }, { parentId: data.parentId, path: newPath });
  },

  delete: async (id: string, email: string) => {
    const node = await nodeRepository.findOne({ _id: id });
    if (!node) throw new HttpError('NOT_FOUND', 'Node not found');

    const [, pCtx] = await Promise.all([ensureWorkspaceMember(node.workspaceId, email), ensureProjectMember(node.projectId, email)]);

    if (!pCtx.permissions.canDeleteNode) throw new HttpError('FORBIDDEN');

    return await nodeRepository.deleteMany({
      workspaceId: node.workspaceId,
      projectId: node.projectId,
      path: { $regex: `^${node.path}` },
    });
  },

  bulkCreate: async (
    nodes: {
      _id: string;
      projectId: string;
      parentId: string | null;
      path: string;
      workspaceId: string;
      type: 'file' | 'folder';
      title: string;
      content?: string;
    }[]
  ) => {
    const CHUNK_SIZE = 500;
    const results = [];

    for (let i = 0; i < nodes.length; i += CHUNK_SIZE) {
      const chunk = nodes.slice(i, i + CHUNK_SIZE);
      const inserted = await nodeRepository.insertMany(chunk);
      results.push(...inserted);
    }
    return results;
  },

  /**
   * PRIVATE HELPER: Pure logic for path/ID mapping.
   * Separation of concerns makes this easy to unit test without DB.
   */
  _prepareNodeBatch: (
    nodes: { name: string; path: string; content: string; type: 'file' | 'folder' }[],
    ctx: { workspaceId: string; projectId: string }
  ) => {
    const nodeDataMap = new Map<string, (typeof nodes)[0]>();

    for (const file of nodes) {
      const parts = file.path.split('/');
      let currentPath = '';

      for (let i = 0; i < parts.length - 1; i++) {
        currentPath += (currentPath ? '/' : '') + parts[i];
        if (!nodeDataMap.has(currentPath)) {
          nodeDataMap.set(currentPath, {
            name: parts[i],
            path: currentPath,
            type: 'folder' as 'file' | 'folder',
            content: '',
          });
        }
      }
      nodeDataMap.set(file.path, file);
    }

    const sortedNodes = Array.from(nodeDataMap.values()).sort((a, b) => a.path.split('/').length - b.path.split('/').length);

    const pathToIdMap = new Map<string, string>();
    return sortedNodes.map(nodeData => {
      const tempId = new Types.ObjectId().toString();
      const parentPath = nodeData.path.split('/').slice(0, -1).join('/');
      const parentId = pathToIdMap.get(parentPath) || null;

      if (nodeData.type === 'folder') pathToIdMap.set(nodeData.path, tempId);

      return {
        _id: tempId,
        workspaceId: ctx.workspaceId,
        projectId: ctx.projectId,
        parentId,
        type: nodeData.type,
        path: nodeData.path,
        title: nodeData.name,
        content: nodeData.content || '',
        children: [],
      };
    });
  },

  // local
  deleteManyByWorkspaceId: async (workspaceId: string) => {
    return await nodeRepository.deleteMany({ workspaceId });
  },
};
