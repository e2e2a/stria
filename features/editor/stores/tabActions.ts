import { useTabStore } from '@/features/editor/stores/tabs';
import { useNodeStore } from '@/features/editor/stores/nodes';
import { INode } from '@/types';

export const tabActions = {
  openTab(projectId: string, node: INode) {
    useTabStore.getState().openTab(projectId, node);
    useNodeStore.getState().setActiveNode(node._id);
  },

  closeTab(projectId: string, nodeId: string) {
    const tabStore = useTabStore.getState();
    const nodeStore = useNodeStore.getState();

    const tabs = tabStore.projectTabs[projectId] || [];
    const index = tabs.findIndex(t => t.nodeId === nodeId);
    if (index === -1) return;

    const currentActive = tabStore.activeTabs[projectId];

    // Compute next active tab
    let nextActive = currentActive;
    if (currentActive === nodeId) {
      if (index - 1 >= 0) nextActive = tabs[index - 1]?.nodeId ?? null;
      else nextActive = tabs[0]?.nodeId ?? null;
      nodeStore.setActiveNode(nextActive);
    }

    // Call the store's existing closeTab method
    tabStore.closeTab(projectId, nodeId);
  },
};
