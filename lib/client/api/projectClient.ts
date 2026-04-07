import { SearchResult } from '@/utils/client/search-nodes-utils';

const BASE_URL_PROJECTS = `${process.env.NEXT_PUBLIC_BASE_URL}/api/projects`;
const BASE_URL_WORKSPACES = `${process.env.NEXT_PUBLIC_BASE_URL}/api/workspaces`;

export interface PropertyStat {
  key: string;
  count: number;
}

export const projectClient = {
  async create(data: {
    title: string;
    workspaceId: string;
    members: {
      role: 'owner' | 'editor' | 'viewer';
      email: string;
    }[];
  }) {
    const res = await fetch(`${BASE_URL_PROJECTS}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || '');

    return json;
  },

  async importProject(data: { title: string; workspaceId: string; nodes: { name: string; path: string; content?: string; type: 'file' | 'folder' }[] }) {
    const res = await fetch(`${BASE_URL_PROJECTS}/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || '');

    return json;
  },

  async update(data: { pid: string; title: string }) {
    const res = await fetch(`${BASE_URL_PROJECTS}/${data.pid}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: data.title }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || '');

    return json;
  },

  async move(data: { pid: string; wid: string }) {
    const res = await fetch(`${BASE_URL_PROJECTS}/${data.pid}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId: data.wid }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || '');

    return json;
  },

  async delete(data: { pid: string }) {
    const res = await fetch(`${BASE_URL_PROJECTS}/${data.pid}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || '');

    return json;
  },

  async getProjectsByWorkspace(workspaceId: string) {
    const res = await fetch(`${BASE_URL_WORKSPACES}/${workspaceId}/projects`);
    if (!res.ok) throw new Error('Failed to fetch projects in workspace');
    return res.json();
  },

  async getProjectById(id: string, cookieHeader?: string) {
    const res = await fetch(`${BASE_URL_PROJECTS}/${id}`, {
      headers: {
        Cookie: cookieHeader || '',
      },
      cache: 'no-store',
    });
    const json = await res.json();
    if (!res.ok) throw new Error('Failed to fetch project');
    return json;
  },

  search: async (projectId: string, query: string): Promise<SearchResult[]> => {
    const res = await fetch(`/api/projects/${projectId}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    const json = await res.json();
    if (!res.ok) throw new Error('Failed to fetch search nodes in project');
    return json;
  },

  getProperties: async (projectId: string): Promise<PropertyStat[]> => {
    const res = await fetch(`${BASE_URL_PROJECTS}/${projectId}/properties`);
    if (!res.ok) throw new Error('Failed to fetch properties in project');
    return res.json();
  },

  getTags: async (projectId: string): Promise<{ name: string; count: number }[]> => {
    const res = await fetch(`${BASE_URL_PROJECTS}/${projectId}/tags`);
    if (!res.ok) throw new Error('Failed to fetch tags in project');
    return res.json();
  },
  // async getProjectsByUserId(userId?: string) {
  //   const res = await fetch(BASE_URL_PROJECTS + `?userId=${userId}`);
  //   const json = await res.json();
  //   if (!res.ok) throw new Error('Failed to fetch projects');
  //   return json;
  // },

  // async updateProject(data: { _id: string } & UpdateProjectDTO) {
  //   const res = await fetch(`${BASE_URL_PROJECTS}/${data._id}`, {
  //     method: 'PATCH',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify(data),
  //   });
  //   const json = await res.json();
  //   if (!res.ok) throw new Error(json.message || '');
  //   return json;
  // },
};
