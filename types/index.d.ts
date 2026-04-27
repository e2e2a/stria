export type IUser = {
  _id?: string;
  email: string;
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
  createdAt?: Date;
};

export type UpdateNodeDTO = Pick<INode, '_id' | 'title' | 'content' | 'archived' | 'userId'>;

export type IProject = {
  _id: string;
  title: string;
  nodes?: INode[];
  archived?: IArchived;
};

export type CreateProjectDTO = Partial<IProject>;
export type UpdateProjectDTO = Pick<INode, 'title'>;
export type ProjectPushNodeDTO = Partial<IProject>;

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
  editingRowId: string | null;
  setEditingRowId: React.Dispatch<React.SetStateAction<string | null>>;
};

export type EditorJumpDetail = {
  nodeId: string;
  offset: number;
  length: number;
};
