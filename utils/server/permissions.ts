export type WorkspacePermissions = {
  canEdit: boolean;
  canEditWorkspace: boolean;
  canEditMember: boolean;
  canEditProject: boolean;
  canEditProjectMember: boolean;

  canInvite: boolean;
  canInviteProjectMember: boolean;
  canCreateProject: boolean;
  canImportProject: boolean;
  canMoveProject: boolean;

  canDeleteInvite: boolean;
  canDeleteProjectInvite: boolean;
  canDeleteMember: boolean;
  canDeleteProject: boolean;
};

/**
 * The "Single Source of Truth" for what roles are allowed to do.
 */
export const resolveWorkspacePermissions = (role?: string): WorkspacePermissions => {
  return {
    canEdit: role === 'owner' || role === 'editor',
    canEditWorkspace: role === 'owner' || role === 'editor',
    canEditMember: role === 'owner' || role === 'editor',
    canEditProject: role === 'owner' || role === 'editor',
    canEditProjectMember: role === 'owner' || role === 'editor',

    canInvite: role === 'owner' || role === 'editor',
    canInviteProjectMember: role === 'owner' || role === 'editor',
    canCreateProject: role === 'owner' || role === 'editor',
    canImportProject: role === 'owner' || role === 'editor',
    canMoveProject: role === 'owner',

    canDeleteInvite: role === 'owner' || role === 'editor',
    canDeleteProjectInvite: role === 'owner' || role === 'editor',
    canDeleteMember: role === 'owner' || role === 'editor',
    canDeleteProject: role === 'owner',
  };
};

export type ProjectPermissions = {
  canEditNode: boolean;

  canCreateNode: boolean;

  canMoveNode: boolean;

  canDeleteNode: boolean;
};

/**
 * The "Single Source of Truth" for what roles are allowed to do.
 */
export const resolveProjectPermissions = (role?: string): ProjectPermissions => {
  return {
    canEditNode: role === 'owner' || role === 'editor',

    canCreateNode: role === 'owner' || role === 'editor',

    canMoveNode: role === 'owner' || role === 'editor',

    canDeleteNode: role === 'owner' || role === 'editor',
  };
};
