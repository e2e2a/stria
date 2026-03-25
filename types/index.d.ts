export type IUser = {
  _id?: string;
  sub?: string;
  email: string;
  email_verified: boolean;
  role: string;
  isOnboard: boolean;
  goal?: string;

  image?: string;
  company?: string;
  country?: string;
  phoneNumber?: string;
  given_name: string;
  family_name: string;

  last_login: Date | null;
};

export type CreateNodeDTO = {
  userId?: string;
  projectId: string;
  parentId?: string | null;
  projects?: IProject[] | [];
  type: string;
  title?: string;
};

export type IArchived = {
  isArchived: boolean;
  archivedAt?: Date;
  archivedBy?: Pick<IUser, 'email'>;
};

export type INode = {
  _id: string;
  userId?: string;
  projectId: string;
  parentId: string | null;
  type: string;
  path?: string;
  children: INode[];
  title: string;
  content?: string | null;
  archived?: IArchived;
  updatedAt?: Date;
};

export type UpdateNodeDTO = Pick<INode, '_id' | 'title' | 'content' | 'archived' | 'userId'>;

export type IProject = {
  _id: string;
  workspaceId: string;
  userId: string;
  title: string;
  role?: 'owner' | 'editor' | 'viewer';
  nodes?: INode[];
  members?: string[];
  archived: IArchived;
};

export type CreateProjectDTO = Partial<IProject>;
export type UpdateProjectDTO = Pick<INode, 'title'>;
export type ProjectPushNodeDTO = Partial<IProject>;

export type IRateLimitType = 'login' | 'register' | 'sendEmail' | 'verify';
export type IRateLimit = {
  userId?: string;
  ip: string;
  deviceType: string;
  browser?: string;
  os?: string;
  userAgent?: string;

  type: IRateLimitType;
  retryCount: number;
  retryResetAt: Date;
};

export type CreateIRateLimitDTO = IRateLimit;

export type KBAData = {
  kbaQuestion: string;
  kbaAnswer: string;
};

export type ArchivedItem = {
  _id: string;
  type: string;
  title: string;
  size?: string;
  projectId?: string;
  parentId?: string;
  userId?: string;
  path: string;
  archived: IArchived;
};

export type MembersInvited = {
  _id?: string;
  projectId?: Partial<Project>;
  invitedBy?: Partial<IUser>;
  userId?: Pick<IUser, 'email'>;
  email: string;
  status: string;
  createdAt: Date;
};

export type InviteMembersDTO = {
  _id?: string;
  projectId: string;
  email: string;
};

export type IWorkspaceMember = {
  _id: string;
  role: 'owner' | 'editor' | 'viewer';
  email: string;
  user: {
    _id: string;
    family_name: string;
    given_name: string;
  };
  status: 'pending' | 'accepted';
};

export type IWorkspace = {
  _id: string;
  ownerUserId: IUser | string;
  // projects?: IProject[];
  title: string;
  archived?: IArchived;
  createdAt: Date;
};

export interface IWorkspaceMemberCreateDTO {
  role: 'owner' | 'editor' | 'viewer';
  email: string;
}

export type IUserWorkspaces = IWorkspace & {
  membership: {
    _id: string;
    email: string;
    role: 'owner' | 'editor' | 'viewer';
    status: 'pending' | 'accepted';
    createdAt: Date;
    invitedBy: string;
  };

  projectCount?: number;
  ownerCount?: number;
};

export type IUserInvitations = {
  _id?: string;
  workspace: Partial<IWorkspace>;
  invitedBy?: Partial<IUser>;
  email: string;
  role: 'owner' | 'editor' | 'viewer';
  status: 'pending' | 'accepted';
};

export type AuthUser = {
  email: string;
  password: string;
};

export type IToken = {
  email: string;
  emailToChange?: string;
  token: string;
  code: string;
  type: 'EmailVerification' | 'ChangeEmailVerification';
  expires: Date;
  expiresCode: Date;
};

export type IOnboard = {
  step1: IOnboardStep1;
  step2: IOnboardStep2;
  step3: IOnboardStep3;
};

type IOnboardStep1 = {
  given_name: string;
  family_name: string;
  middle_name?: string;
  company?: string;
  country?: string;
  phoneNumber?: string;
};

type IOnboardStep2 = {
  goal: string;
};

type IOnboardStep3 = {
  title: string;
};

export interface BreadcrumbItem {
  title: string | undefined;
  _id: string;
  parentId: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export interface ISectionItem {
  title: string;
  url: string;
  isActive?: boolean;
}

export interface INavItem {
  title: string;
  icon?: Icon;
  items?: ISectionItem[];
  url?: string;
}

export interface INav {
  section: INavItem[];
}

export type TableMeta = {
  editingMemberId: string | null;
  setEditingMemberId: React.Dispatch<React.SetStateAction<string | null>>;
};

export type EditorJumpDetail = {
  nodeId: string;
  offset: number;
  length: number;
};
