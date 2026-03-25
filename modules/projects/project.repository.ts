import Project from '@/modules/projects/project.model';
import { PopulateOptions } from 'mongoose';
import { IProject, ProjectPushNodeDTO } from '@/types';
import mongoose from 'mongoose';
import { UnitOfWork } from '@/common/UnitOfWork';
const updateOptions = { new: true, runValidators: true };

export function populateChildren(path: string, depth: number = 3): PopulateOptions {
  if (depth <= 0) return { path };

  return {
    path,
    populate: populateChildren(path, depth - 1),
  };
}

export const projectRepository = {
  findAll: () => Project.find(),

  findMany: async (data: { workspaceId?: string }) => {
    const res = await Project.aggregate([
      { $match: { workspaceId: new mongoose.Types.ObjectId(data.workspaceId) } },
      {
        $lookup: {
          from: 'projectmembers',
          localField: '_id',
          foreignField: 'projectId',
          as: 'members',
        },
      },

      { $addFields: { memberCount: { $size: '$members' } } },

      { $project: { members: 0 } },
    ]);
    return res;
  },

  deleteMany: async (data: { workspaceId: string }) => {
    const session = UnitOfWork.getSession();
    return await Project.deleteMany(data, { session });
  },

  findOne: (data: { _id: string }) => Project.findOne(data),

  findProjectByIdAndUserId: (data: { _id: string; userId: string }) => Project.findOne(data).populate('nodes').lean<IProject>(),

  findProjectByTitle: (workspaceId: string, title: string) => Project.findOne({ workspaceId, title }, { collation: { locale: 'en', strength: 2 } }),

  findProjectsByUserId: (userId: string) =>
    Project.find({ userId, 'archived.isArchived': false }).populate({
      path: 'nodes',
      match: { parentId: null },
    }),

  create: async (data: { workspaceId: string; title: string; createdBy: string }) => {
    const session = UnitOfWork.getSession();
    const [project] = await Project.create([data], { session });
    return project;
  },

  pushNode(id: string, data: ProjectPushNodeDTO): Promise<IProject | null> {
    return Project.findByIdAndUpdate(id, { ...(data.nodes ? { $push: { nodes: { $each: data.nodes } } } : {}) }, updateOptions)
      .lean<IProject>()
      .exec();
  },

  pullNode(dataToFind: { _id: string; userId: string }, data: { nodes: string[] }): Promise<IProject | null> {
    return Project.findOneAndUpdate(dataToFind, { ...(data.nodes ? { $pull: { nodes: { $in: data.nodes } } } : {}) }, updateOptions)
      .lean<IProject>()
      .exec();
  },

  updateOne: async (dataToFind: { _id: string; workspaceId?: string }, dataToUpdate: { title?: string; workspaceId?: string }) => {
    const session = UnitOfWork.getSession();
    return await Project.findOneAndUpdate(dataToFind, { $set: dataToUpdate }, { ...updateOptions, session })
      .lean<IProject>()
      .exec();
  },

  archiveById(projectId: string, data: Partial<IProject>): Promise<IProject | null> {
    return Project.findByIdAndUpdate(projectId, { $set: { archived: data.archived } }, updateOptions)
      .lean<IProject>()
      .exec();
  },

  retrieveById(projectId: string): Promise<IProject | null> {
    return Project.findByIdAndUpdate(
      projectId,
      {
        $set: { archived: { isArchived: false, archivedAt: null, archivedBy: null } },
      },
      updateOptions
    )
      .lean<IProject>()
      .exec();
  },

  deleteOne: async (_id: string) => {
    const session = UnitOfWork.getSession();
    return await Project.findOneAndDelete({ _id }, { session });
  },

  findArchivedProjectsByUserId(userId: string) {
    return Project.find({ userId, 'archived.isArchived': true }).populate('archived.archivedBy').exec();
  },
};
