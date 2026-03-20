import { useNodeStore } from '@/features/editor/stores/nodes';
import { FolderPlus, ChevronsDownUp, SquarePen, GalleryVertical } from 'lucide-react';
import { Button } from '../../ui/button';
import { TabsContent } from '@/components/ui/tabs';
import { useTabStore } from '@/features/editor/stores/tabs';
import { IProject } from '@/types';

const NodeTabHeader = ({ projectData }: { projectData: IProject }) => {
  const setCollapseAll = useNodeStore(state => state.setCollapseAll);
  const selectedNode = useNodeStore(state => state.selectedNode);
  const activeNode = useNodeStore(state => state.activeNode);
  const setIsCreating = useNodeStore(state => state.setIsCreating);
  const setActiveNode = useNodeStore(state => state.setActiveNode);

  let parentId: string | null = null;
  if (activeNode) parentId = activeNode.type === 'folder' ? activeNode._id : activeNode.parentId;
  if (selectedNode) parentId = selectedNode.type === 'folder' ? selectedNode._id : selectedNode.parentId;

  const activeTabs = useTabStore(state => state.activeTabs);
  const activeTabId = activeTabs[projectData._id];
  return (
    <TabsContent className="h-full min-h-0 w-full" value="nodes">
      <div className="bg-transparent w-full flex items-start gap-x-1 justify-start">
        <Button
          className="px-2! py-1! border border-transparent"
          variant={'ghost'}
          title="New Note"
          onClick={() => {
            setIsCreating({ type: 'file', parentId });
            setTimeout(() => {
              const input = document.querySelector<HTMLInputElement>('#sidebar-creating-file-item input');
              input?.focus();
            }, 0);
          }}
        >
          <SquarePen className="h-6! w-6!" />
        </Button>

        <Button
          className="px-2! py-1! w-fit h-fit border border-transparent"
          variant={'ghost'}
          title="New Folder"
          onClick={() => {
            setIsCreating({ type: 'folder', parentId });
            setTimeout(() => {
              const input = document.querySelector<HTMLInputElement>('#sidebar-creating-folder-item input');
              input?.focus();
            }, 0);
          }}
        >
          <FolderPlus className="h-6! w-6!" />
        </Button>

        <Button
          className="px-2! py-1! border border-transparent"
          variant={'ghost'}
          title="Auto-reveal current path"
          onClick={() => {
            const targetId = activeTabId;

            const elNode = document.querySelector(`[data-node-id="${targetId}"]`);
            if (elNode) return elNode.scrollIntoView({ behavior: 'smooth', block: 'center' });

            setActiveNode(null);

            setTimeout(() => {
              setActiveNode(targetId);

              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  const foundNode = document.querySelector(`[data-node-id="${targetId}"]`);
                  foundNode?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                });
              });
            }, 0);
          }}
        >
          <GalleryVertical className="h-6! w-6!" />
        </Button>

        <Button
          className="px-2! py-1! border border-transparent"
          variant={'ghost'}
          title="Collapse All"
          tabIndex={0}
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            setCollapseAll(true);
          }}
        >
          <ChevronsDownUp className="h-6! w-6!" />
        </Button>
      </div>
    </TabsContent>
  );
};

export default NodeTabHeader;
