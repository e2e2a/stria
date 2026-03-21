import Node from '@/modules/projects/nodes/node.model';
import { INode } from '@/types';
import { FilterQuery, ObjectId } from 'mongoose';
import { ExcludeField } from './node.service';
import { UnitOfWork } from '@/common/UnitOfWork';
const updateOptions = { new: true, runValidators: true };

interface FlatNode {
  _id: ObjectId;
  parentId: ObjectId | null;
  children: ObjectId[];
  title: string;
  type: 'file' | 'folder';
  path: string;
  content?: string;
}

export const nodeRepository = {
  findNodes: (email: string) => Node.find({ email }),

  findNodeByProject: (projectId: string) => Node.find({ projectId, parentId: null }).populate('children'),

  create: async (data: { projectId: string; parentId: string | null | undefined; path: string; workspaceId: string; type: string; title: string }) => {
    const session = UnitOfWork.getSession();
    const [node] = await Node.create([data], { session });
    return node;
  },

  insertMany: async (
    data: {
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
    const session = UnitOfWork.getSession();
    const nodes = await Node.insertMany(data, { session });
    return nodes;
  },

  findOne: (data: { _id?: string }) => Node.findOne(data),

  findOneCollated: (
    params: FilterQuery<{
      projectId: string;
      parentId: string | null;
      title: string;
      type: 'file' | 'folder';
    }>
  ) => Node.findOne(params).collation({ locale: 'en', strength: 2 }),

  updateOne: (dataToFind: { _id: string }, dataToUpdate: Partial<INode>): Promise<INode | null> =>
    Node.findOneAndUpdate(dataToFind, dataToUpdate, updateOptions).lean<INode>().exec(),

  findMany: (data: { projectId: string }, exclude: ExcludeField[] = []) => {
    let query = Node.find(data);

    if (exclude && exclude.length > 0) {
      const projection = exclude.map(f => `-${f.trim()}`).join(' ');
      query = query.select(projection);
    }

    return query.lean<FlatNode[]>().exec();
  },

  deleteMany: (filter: FilterQuery<INode>) => {
    const session = UnitOfWork.getSession();
    return Node.deleteMany(filter, { session }).exec();
  },
};
