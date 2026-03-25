export interface IWorkspaceMemberCreateDTO {
  role: 'owner' | 'editor' | 'viewer';
  email: string;
}
