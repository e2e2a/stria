import { INode } from '@/types';
import { apiUrl, readJsonResponse } from './apiBase';

const BASE_URL = '/api/nodes';
const BASE_URL_PROJECT = '/api/projects';
interface BacklinkMention {
  excerpt: string;
  line: number;
  index: number;
  length: number;
  alias?: string;
}
interface IBacklink {
  _id: string;
  title: string;
  path: string;
  type: 'file' | 'folder';
  mentions: BacklinkMention[];
}
interface IBacklinkResponse {
  linked: IBacklink[];
  unlinked: IBacklink[];
}
type NodeResponse = INode | { data: INode };

interface OutlineNode {
  text: string;
  level: number;
  children: OutlineNode[];
}

export const nodeClient = {
  async getNodes(projectId: string) {
    const res = await fetch(apiUrl(`${BASE_URL_PROJECT}/${projectId}/nodes?exclude=content,updatedAt`));
    if (!res.ok) throw new Error('Failed to fetch nodes');
    return res.json();
  },

  async getNode(id: string) {
    const res = await fetch(apiUrl(`${BASE_URL}/${id}`));
    if (!res.ok) throw new Error(`Failed to fetch node with id ${id}`);
    return res.json();
  },

  async getBacklinks(id: string): Promise<IBacklinkResponse> {
    const res = await fetch(apiUrl(`${BASE_URL}/${id}/backlinks`));
    if (!res.ok) throw new Error(`Failed to fetch node with backlinks id ${id}`);
    return res.json();
  },

  async getOutlines(id: string): Promise<OutlineNode[]> {
    const res = await fetch(apiUrl(`${BASE_URL}/${id}/outlines`));
    if (!res.ok) throw new Error(`Failed to fetch node outline with id ${id}`);
    return res.json();
  },

  async getSingleNode(id: string): Promise<INode> {
    const res = await fetch(apiUrl(`${BASE_URL}/${id}`));
    if (!res.ok) throw new Error(`Failed to fetch Single node ${id}`);
    return res.json();
  },

  async create(data: { projectId: string; parentId: string | null; type: 'file' | 'folder'; title: string }): Promise<NodeResponse> {
    const res = await fetch(apiUrl(BASE_URL), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return readJsonResponse<NodeResponse>(res, 'Failed to create file or folder');
  },

  async restore(nodes: INode[]) {
    const res = await fetch(apiUrl(`${BASE_URL}/restore`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodes }),
    });
    return readJsonResponse(res, 'Failed to restore files');
  },

  async update(data: { _id: string; title?: string; content?: string }) {
    const res = await fetch(apiUrl(`${BASE_URL}/${data._id}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return readJsonResponse(res, 'Failed to update file');
  },

  async move(data: { _id: string; parentId: string | null }) {
    const res = await fetch(apiUrl(`${BASE_URL}/move`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return readJsonResponse(res, 'Failed to move file or folder');
  },

  async trash(data: { _id: string }) {
    const res = await fetch(apiUrl(`${BASE_URL}/${data._id}`), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return readJsonResponse(res, 'Failed to delete file or folder');
  },
};
