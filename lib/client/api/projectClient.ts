import { SearchResult } from '@/utils/client/search-nodes-utils';
import { apiUrl, readJsonResponse } from './apiBase';

const BASE_URL_PROJECTS = '/api/projects';

export interface PropertyStat {
  key: string;
  count: number;
}
export type GraphNode = {
  _id: string;
  title: string;
  path?: string;
  content?: string | null;
  type: 'file' | 'tag';
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx?: number | null;
  fy?: number | null;
  radius: number;
  [key: string]: unknown;
};
export interface GraphViewResponse {
  d3Nodes: GraphNode[];
  d3Links: { source: string; target: string }[]; // API sends pure strings
}

export const projectClient = {
  async getProjectById(id: string) {
    const res = await fetch(apiUrl(`${BASE_URL_PROJECTS}/${id}`));
    const json = await res.json();
    if (!res.ok) throw new Error('Failed to fetch project');
    return json;
  },

  search: async (projectId: string, query: string): Promise<SearchResult[]> => {
    const res = await fetch(apiUrl(`${BASE_URL_PROJECTS}/${projectId}/search`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    return readJsonResponse<SearchResult[]>(res, 'Failed to fetch search results');
  },

  getProperties: async (projectId: string): Promise<PropertyStat[]> => {
    const res = await fetch(apiUrl(`${BASE_URL_PROJECTS}/${projectId}/properties`));
    if (!res.ok) throw new Error('Failed to fetch properties in project');
    return res.json();
  },

  getTags: async (projectId: string): Promise<{ name: string; count: number }[]> => {
    const res = await fetch(apiUrl(`${BASE_URL_PROJECTS}/${projectId}/tags`));
    if (!res.ok) throw new Error('Failed to fetch tags in project');
    return res.json();
  },

  getGraphView: async (projectId: string): Promise<GraphViewResponse> => {
    const res = await fetch(apiUrl(`${BASE_URL_PROJECTS}/${projectId}/graph-view`));
    if (!res.ok) throw new Error('Failed to fetch tags in project');
    return res.json();
  },
};
