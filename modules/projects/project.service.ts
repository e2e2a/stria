import { HttpError } from '@/utils/server/errors';
import { projectRepository } from '@/modules/projects/project.repository';
import { INode, ProjectPushNodeDTO } from '@/types';
import { User } from 'next-auth';
import { projectMemberService } from './member/member.service';
import { projectMemberRepository } from '@/modules/projects/member/member.repository';
import mongoose from 'mongoose';
import { ensureWorkspaceMember } from '../workspaces/workspace.context';
import { workspaceMemberService } from '../workspaces/members/member.service';
import { UnitOfWork } from '@/common/UnitOfWork';
import { ensureProjectMember } from './project.context';
import { nodeService } from './nodes/node.service';
import { performSearch } from '@/utils/client/search-nodes-utils';
import { getAllPropertyStats } from '@/utils/client/get-property-stats';
import { getProjectTagsCount } from '@/utils/client/get-tags-count';

export const projectService = {
  create: async (
    user: User,
    data: {
      title: string;
      workspaceId: string;
      members?: { email: string; role: 'owner' | 'editor' | 'viewer' }[];
    }
  ) => {
    return await UnitOfWork.run(async () => {
      const { workspaceId, title, members } = data;
      const context = await ensureWorkspaceMember(data.workspaceId, user.email);
      if (!context.permissions.canCreateProject) throw new HttpError('FORBIDDEN', 'You do not have permission to import a project');

      await projectService.checkTitleExist(workspaceId, title);
      const newProject = await projectRepository.create({
        workspaceId,
        title,
        createdBy: user._id!.toString(),
      });
      await projectMemberService.addOwner({
        workspaceId,
        projectId: newProject._id as string,
        email: user.email,
      });
      const baseMemberData = { projectId: newProject._id.toString(), workspaceId };
      if (members && members.length > 0) {
        const workspaceMembersDataToCreate = members.map(member => ({
          ...member,
          ...baseMemberData,
          status: 'pending' as const,
          invitedBy: user.email,
          role: 'viewer' as const,
        }));
        const projectMembersDataToCreate = members.map(member => ({
          ...member,
          ...baseMemberData,
        }));
        await workspaceMemberService.store(workspaceMembersDataToCreate);
        await projectMemberService.store(projectMembersDataToCreate);
      }

      return { project: newProject };
    });
  },

  search: async (data: { pid: string; query: string }, email: string) => {
    const project = await projectRepository.findOne({ _id: data.pid });
    if (!project) throw new HttpError('NOT_FOUND', 'No project to be updated');

    await Promise.all([
      ensureWorkspaceMember(project.workspaceId, email), // wCtx
      ensureProjectMember(project._id, email), // pCtx
    ]);
    const flatNodes = await nodeService.getProjectFlatNode({ projectId: project._id, type: 'file' });
    const results = performSearch(data.query, flatNodes as unknown as INode[]);
    return results;
  },

  getTags: async (pid: string, email: string) => {
    const project = await projectRepository.findOne({ _id: pid });
    if (!project) throw new HttpError('NOT_FOUND', 'No project to be updated');

    await Promise.all([
      ensureWorkspaceMember(project.workspaceId, email), // wCtx
      ensureProjectMember(project._id, email), // pCtx
    ]);

    const flatNodes = await nodeService.getProjectFlatNode({ projectId: project._id, type: 'file' });
    const results = await getProjectTagsCount((flatNodes as unknown as INode[]) || []);
    return results;
  },

  getProperties: async (pid: string, email: string) => {
    const project = await projectRepository.findOne({ _id: pid });
    if (!project) throw new HttpError('NOT_FOUND', 'No project to be updated');

    await Promise.all([
      ensureWorkspaceMember(project.workspaceId, email), // wCtx
      ensureProjectMember(project._id, email), // pCtx
    ]);

    const flatNodes = await nodeService.getProjectFlatNode({ projectId: project._id, type: 'file' });
    const results = getAllPropertyStats((flatNodes as unknown as INode[]) || []);
    return results;
  },

  import: async (
    user: User,
    data: {
      title: string;
      workspaceId: string;
      nodes: { name: string; path: string; content: string; type: 'file' | 'folder' }[];
    }
  ) => {
    return await UnitOfWork.run(async () => {
      const { workspaceId, title, nodes } = data;
      await ensureWorkspaceMember(data.workspaceId, user.email);

      const context = await ensureWorkspaceMember(data.workspaceId, user.email);
      if (!context.permissions.canImportProject) throw new HttpError('FORBIDDEN', 'You do not have permission to import a project');

      await projectService.checkTitleExist(workspaceId, title);
      const newProject = await projectRepository.create({
        workspaceId,
        title,
        createdBy: user._id!.toString(),
      });

      await projectMemberService.addOwner({
        workspaceId,
        projectId: newProject._id as string,
        email: user.email,
      });

      const nodesToInsert = nodeService._prepareNodeBatch(nodes, {
        workspaceId,
        projectId: newProject._id.toString(),
      });

      await nodeService.bulkCreate(nodesToInsert);
      return { project: newProject };
    });
  },

  checkTitleExist: async (workspaceId: string, title: string) => {
    const existingProjectTitle = await projectRepository.findProjectByTitle(workspaceId, title);
    if (existingProjectTitle) throw new HttpError('CONFLICT', 'Project title already exists.');
    return;
  },

  getMyWorkspaceProjects: async (workspaceId: string, email: string) => {
    const { membership } = await ensureWorkspaceMember(workspaceId, email);
    if (membership.role === 'owner') return await projectRepository.findMany({ workspaceId });

    return await projectMemberRepository.findProjects({
      workspaceId,
      email,
    });
  },

  getAllProjects: (email: string) => projectMemberRepository.findProjects({ email }),

  update: async (projectId: string, email: string, dataToUpdate: { title: string }) => {
    return await UnitOfWork.run(async () => {
      const project = await projectRepository.findOne({ _id: projectId });
      if (!project) throw new HttpError('NOT_FOUND', 'No project to be updated');

      const { permissions } = await ensureWorkspaceMember(project.workspaceId, email);
      if (!permissions.canEditProject) throw new HttpError('FORBIDDEN');
      await projectService.checkTitleExist(project.workspaceId, dataToUpdate.title);
      await projectRepository.updateOne({ _id: projectId }, dataToUpdate);

      return project;
    });
  },

  move: async (projectId: string, email: string, data: { workspaceId: string }) => {
    return await UnitOfWork.run(async () => {
      const project = await projectRepository.findOne({ _id: projectId });
      if (!project) throw new HttpError('NOT_FOUND', 'No project to be updated');
      if (project.workspaceId === data.workspaceId) throw new HttpError('BAD_INPUT', 'Project is already in the target workspace');

      const [sourceCtx, targetCtx] = await Promise.all([
        ensureWorkspaceMember(project.workspaceId, email),
        ensureWorkspaceMember(data.workspaceId, email),
      ]);
      if (!sourceCtx.permissions.canMoveProject) throw new HttpError('FORBIDDEN');
      if (targetCtx.membership.role !== 'owner') throw new HttpError('FORBIDDEN');

      await projectService.checkTitleExist(data.workspaceId, project.title);
      await projectRepository.updateOne({ _id: projectId }, data);

      const PMembers = await projectMemberService.move(project.workspaceId, data.workspaceId, project._id);
      const PEmails = PMembers.map(m => m.email);
      await workspaceMemberService.move(project.workspaceId, data.workspaceId, PEmails);
      // update nodes workspaceId
      return project;
    });
  },

  deleteProject: async (projectId: string, user: User) => {
    if (!mongoose.Types.ObjectId.isValid(projectId)) throw new HttpError('BAD_INPUT', 'Invalid project ID.');

    await projectMemberService.getMembership({ projectId, email: user.email });

    const project = await projectRepository.deleteOne(projectId);
    if (!project) throw new HttpError('NOT_FOUND', 'No project to be deleted');

    return project;
  },

  findById: async (_id: string) => {
    const project = await projectRepository.findOne({ _id });
    if (!project) throw new HttpError('NOT_FOUND', 'Project not found');

    return project;
  },

  findByIdWithAccess: async (email: string, _id: string) => {
    const project = await projectService.findById(_id);
    await Promise.all([
      ensureWorkspaceMember(project.workspaceId, email), // wCtx
      ensureProjectMember(project._id, email), // pCtx
    ]);
    return { project };
  },

  pushNode: async (id: string, data: ProjectPushNodeDTO) => {
    return projectRepository.pushNode(id, data);
  },

  findProjectsByUserId: async (userId: string) => projectRepository.findProjectsByUserId(userId),

  pullNode: async (dataToFind: { _id: string; userId: string }, data: { nodes: string[] }) => {
    return projectRepository.pullNode(dataToFind, data);
  },

  // local
  deleteManyByWorkspaceId: async (workspaceId: string) => {
    return await projectRepository.deleteMany({ workspaceId });
  },
};
