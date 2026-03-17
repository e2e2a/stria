import { HttpError } from '@/utils/server/errors';
import { userRepository } from '@/modules/users/user.repository';
import { IOnboard } from '@/types';
import { Step1Schema, Step2Schema } from '@/lib/validators/onboard';
import { workspaceRepository } from '@/modules/workspaces/workspace.repository';
import { workspaceSchema } from '@/lib/validators/workspace';
import { User } from 'next-auth';
import { workspaceMemberService } from '../workspaces/members/member.service';
import { UnitOfWork } from '@/common/UnitOfWork';

export const userServices = {
  onboard: async (data: IOnboard, authUser: User) => {
    return await UnitOfWork.run(async () => {
      const result1 = Step1Schema.safeParse(data.step1);
      const result2 = Step2Schema.safeParse(data.step2);
      const result3 = workspaceSchema.safeParse(data.step3);
      if (!result1.success || !result2.success || !result3.success) throw new HttpError('NOT_FOUND', 'Invalid fields.');

      const user = await userRepository.updateUserById(authUser._id!, {
        ...result1.data,
        ...result2.data,
        isOnboard: true,
      });

      if (!user) throw new HttpError('NOT_FOUND', 'No user found.');
      // if (user.isOnboard) throw new HttpError('CONFLICT', 'You are already onboarded.');

      const workspace = await workspaceRepository.store({
        ...result3.data,
        ownerUserId: authUser._id!.toString(),
      });
      await workspaceMemberService.initializeOwnership({
        email: authUser.email,
        workspaceId: workspace._id,
      });
      return { workspaceId: workspace._id };
    });
  },

  getCurrentUser: async (authUser: User) => {
    const user = await userRepository.findUser(authUser._id as string, true);
    if (!user) throw new HttpError('NOT_FOUND', 'No User Found');
    return user;
  },
};
