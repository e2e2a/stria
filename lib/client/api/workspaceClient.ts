import { IUserWorkspaces, IWorkspace, IWorkspaceMemberCreateDTO } from '@/types';
const BASE_URL = `${process.env.NEXT_PUBLIC_BASE_URL}/api/workspaces`;

type IResponse = {
  workspaces: IUserWorkspaces[];
};

export const workspaceClient = {
  async create(data: { title: string; members: IWorkspaceMemberCreateDTO[] }) {
    const res = await fetch(`${BASE_URL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || '');
    return json;
  },

  async getUserWorkspaces(): Promise<IResponse> {
    const res = await fetch(`${BASE_URL}`);
    if (!res.ok) throw new Error('Failed to fetch workspace');
    return res.json();
  },

  async getWorkspace(wid: string): Promise<IWorkspace> {
    const res = await fetch(`${BASE_URL}/${wid}`);
    if (!res.ok) throw new Error('Failed to fetch workspace');
    return res.json();
  },

  async update(data: { wid: string; title: string }) {
    const res = await fetch(`${BASE_URL}/${data.wid}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: data.title }),
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.message || '');

    return json;
  },
};
