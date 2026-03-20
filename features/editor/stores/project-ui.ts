import { create } from 'zustand';

interface EditorState {
  leftSidebarTab: 'nodes' | 'search' | 'bookmarks';
  rightSidebarTab: 'pressence' | 'properties' | 'outline' | 'link' | 'outgoing' | 'mermaid';
  setLeftSidebarTab(tab: 'nodes' | 'search' | 'bookmarks'): void;
  setRightSidebarTab(tab: 'pressence' | 'properties' | 'outline' | 'link' | 'outgoing' | 'mermaid'): void;
  searchQuery: string;
  setSearchQuery(query: string): void;
}

export const useProjectUIStore = create<EditorState>(set => ({
  leftSidebarTab: 'nodes',
  rightSidebarTab: 'pressence',
  setLeftSidebarTab: flag => set({ leftSidebarTab: flag }),
  setRightSidebarTab: flag => set({ rightSidebarTab: flag }),

  searchQuery: '',
  setSearchQuery: query => set({ searchQuery: query }),
}));
