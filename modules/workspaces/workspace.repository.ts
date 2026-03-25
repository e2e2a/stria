import { UnitOfWork } from '@/common/UnitOfWork';
import Workspace from '@/modules/workspaces/workspace.model';

export const workspaceRepository = {
  findOne: (data: { _id: string }) => Workspace.findOne(data),

  store: async (data: { ownerUserId: string; title: string }) => {
    const session = UnitOfWork.getSession();
    const workspace = new Workspace(data);
    await workspace.save({ session });
    return workspace;
  },
};
