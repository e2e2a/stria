import { Account, Profile, User } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import { userRepository } from '@/modules/users/user.repository';
import { AdapterUser } from 'next-auth/adapters';
import { NullableJWT, NullableSession } from '@/types/next-auth';
import connectDb from '../db/connection';

export const authCallbacks = {
  async signIn(params: {
    user: User | AdapterUser;
    account: Account | null;
    profile?: Profile;
    email?: { verificationRequest?: boolean };
  }): Promise<boolean> {
    const { account } = params;
    try {
      if (account?.provider === 'google') {
        // if (!profile) return false;
        // const existingProfile = await profileRepository.findByProviderAccountId(
        //   profile.sub as string
        // );
        // if (!existingProfile) await profileRepository.create(profile as IProfile);
        return true;
      }
    } catch {
      return false;
    }

    return true;
  },
  async session(params: { session: NullableSession; user: AdapterUser; token: JWT }) {
    const { session, token } = params;
    if (!token || !token._id) return (session.deleted = true);

    session.user._id = token._id as string;
    session.user.sub = token.sub as string;
    await connectDb();
    const authUser = await userRepository.findUser(token._id, true);
    if (!authUser) return (session.deleted = true);
    session.user.username = `${authUser.given_name} ${authUser.family_name}`;
    session.user.email = authUser.email as string;
    session.user.role = authUser.role as 'user' | 'admin';
    session.user.email_verified = authUser.email_verified;
    session.user.isOnboard = authUser.isOnboard;

    // token.try = 'seomthing';

    return session;
  },

  async jwt(params: { token: NullableJWT; user?: User | AdapterUser; account?: Account | null; profile?: Profile }) {
    const { token, user } = params;
    if (user) {
      /**
       * This will run once if there is a sucessful signIn mutation
       * 1. we can create accessRecord or update user.lastLogin/user.lastSeen
       */
      token._id = user.id;
      token.email = user.email as string;
      token.role = user.role as 'user' | 'admin';
      token.isOnboard = user.isOnboard;
    }
    return token;
  },
};
