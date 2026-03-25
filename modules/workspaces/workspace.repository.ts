import { UnitOfWork } from '@/common/UnitOfWork';
import Workspace from '@/modules/workspaces/workspace.model';
import { IWorkspace } from './workspace.dto';

const updateOptions = { new: true, runValidators: true };

export const workspaceRepository = {
  findOne: (data: { _id: string }) => Workspace.findOne(data),

  updateOne: async (dataToFind: { _id: string }, dataToUpdate: { title?: string }) => {
    const session = UnitOfWork.getSession();
    return await Workspace.findOneAndUpdate(dataToFind, { $set: dataToUpdate }, { ...updateOptions, session })
      .lean<IWorkspace>()
      .exec();
  },

  store: async (data: { ownerUserId: string; title: string }) => {
    const session = UnitOfWork.getSession();
    const workspace = new Workspace(data);
    await workspace.save({ session });
    return workspace;
  },
};
