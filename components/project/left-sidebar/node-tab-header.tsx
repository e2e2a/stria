import { useNodeStore } from '@/features/editor/stores/nodes';
import { FolderPlus, ChevronsDownUp, SquarePen, GalleryVertical } from 'lucide-react';
import { Button } from '../../ui/button';
import { TabsContent } from '@/components/ui/tabs';
import { useTabStore } from '@/features/editor/stores/tabs';
import { IProject } from '@/types';
import { IconTooltip } from '../icon-tooltip';
import { useGetMyProjectMembership } from '@/hooks/projectMember/useQueries';

const NodeTabHeader = ({ projectData }: { projectData: IProject }) => {
  const { data: mData } = useGetMyProjectMembership(projectData._id.toString());
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
      <div className="bg-transparent w-full flex gap-x-1 justify-center">
        <IconTooltip label={'New Note'} disabled={mData && mData?.role === 'viewer' ? true : false}>
          <Button
            className="px-2! py-1! w-full h-full border border-transparent"
            variant={'ghost'}
            disabled={mData && mData?.role === 'viewer' ? true : false}
            onClick={() => {
              setIsCreating({ type: 'file', parentId });
              setTimeout(() => {
                const input = document.querySelector<HTMLInputElement>('#sidebar-creating-file-item input');
                input?.focus();
              }, 0);
            }}
          >
            <SquarePen className="w-5! h-5!" />
          </Button>
        </IconTooltip>
        <IconTooltip label={'New Folder'} disabled={mData && mData?.role === 'viewer' ? true : false}>
          <Button
            className="px-2! py-1! w-full h-full border border-transparent"
            variant={'ghost'}
            disabled={mData && mData?.role === 'viewer' ? true : false}
            onClick={() => {
              setIsCreating({ type: 'folder', parentId });
              setTimeout(() => {
                const input = document.querySelector<HTMLInputElement>('#sidebar-creating-folder-item input');
                input?.focus();
              }, 0);
            }}
          >
            <FolderPlus className="w-5! h-5!" />
          </Button>
        </IconTooltip>
        <IconTooltip label={'Auto-reveal current path'}>
          <Button
            className="px-2! py-1! w-full h-full border border-transparent"
            variant={'ghost'}
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
            <GalleryVertical className="w-5! h-5!" />
          </Button>
        </IconTooltip>
        <IconTooltip label={'Collapse All'}>
          <Button
            className="px-2! py-1! w-full h-full border border-transparent"
            variant={'ghost'}
            tabIndex={0}
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              setCollapseAll(true);
            }}
          >
            <ChevronsDownUp className="w-5! h-5!" />
          </Button>
        </IconTooltip>
      </div>
    </TabsContent>
  );
};

export default NodeTabHeader;
