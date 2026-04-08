import { IWorkspaceMember } from '@/types';
import { ProjectPermissions } from '@/utils/server/permissions';

const BASE_URL_PROJECT = `${process.env.NEXT_PUBLIC_BASE_URL}/api/projects`;

export type IMyMembership = {
  canLeave: boolean;
  membership: IWorkspaceMember;
  permissions: ProjectPermissions;
  role: string;
  ownerCount: number;
};

export const projectMemberClient = {
  async getMyProjectMembership(projectId: string): Promise<IMyMembership> {
    const res = await fetch(`${BASE_URL_PROJECT}/${projectId}/members/me`);
    if (!res.ok) throw new Error('Failed to fetch workspace');
    if (res.status !== 200) throw new Error('Opps Error Occured.');
    return res.json();
  },

  async create(data: {
    projectId: string;
    members: {
      role: 'owner' | 'editor' | 'viewer';
      email: string;
    }[];
  }) {
    const res = await fetch(`${BASE_URL_PROJECT}/${data.projectId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || '');

    return json;
  },

  async getMembersInProject(projectId: string) {
    const res = await fetch(`${BASE_URL_PROJECT}/${projectId}/members`);
    if (!res.ok) throw new Error('Failed to fetch workspace');
    if (res.status !== 200) throw new Error('Opps Error Occured.');
    return res.json();
  },
};
