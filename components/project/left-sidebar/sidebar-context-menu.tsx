'use client';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from '@/components/ui/context-menu';
import { INode } from '@/types';
import { memo, ReactNode } from 'react';
import { DangerConfirmDialog } from '../../danger-confirm-dialog';
import { useNodeStore } from '@/features/editor/stores/nodes';
import { cn } from '@/lib/utils';
import { IMyMembership } from '@/lib/client/api/projectMemberClient';

interface ContainerProps {
  children: ReactNode;
  node: INode | null;
  mData: IMyMembership | undefined;
}

function SidebarContextMenuComponent({ children, node, mData }: ContainerProps) {
  const isUpdatingNode = useNodeStore(state => state.isUpdatingNode);
  const selectedNode = useNodeStore(state => state.selectedNode);
  const setIsUpdatingNode = useNodeStore(state => state.setIsUpdatingNode);
  const setSelectedNode = useNodeStore(state => state.setSelectedNode);
  const setIsCreating = useNodeStore(state => state.setIsCreating);

  const isUpdatingSelf = !!isUpdatingNode && isUpdatingNode._id === node?._id;
  if (isUpdatingSelf) {
    return (
      <div
        node-editing="true"
        onContextMenu={e => {
          // 1. Stop the event from bubbling up to the Parent ContextMenu
          e.stopPropagation();

          // 2. DO NOT call e.preventDefault() here.
          // This allows the native browser context menu to appear.
        }}
        onMouseDown={e => e.stopPropagation()}
        className="h-auto w-full contents"
      >
        {children}
      </div>
    );
  }

  let parentId: string | null = null;
  if (node) parentId = node.type === 'file' ? node.parentId : node._id;

  return (
    <ContextMenu
      onOpenChange={() => {
        if (!node) return setSelectedNode(null);
        if (selectedNode?._id === node._id) return;
        setSelectedNode(node);
      }}
      modal={true}
    >
      <ContextMenuTrigger className={cn('h-auto w-full contents')} asChild disabled={mData && mData?.role === 'viewer' ? true : false}>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent
        onCloseAutoFocus={e => e.preventDefault()}
        onClick={e => e.preventDefault()}
        onContextMenu={e => e.preventDefault()}
        className="w-52"
      >
        <ContextMenuItem
          className="cursor-pointer"
          onMouseDown={e => e.stopPropagation()}
          onClick={e => {
            e.stopPropagation();
            setIsCreating({ type: 'file', parentId });
            setTimeout(() => {
              const input = document.querySelector<HTMLInputElement>('#sidebar-creating-file-item input');
              input?.focus();
            }, 0);
          }}
          inset
        >
          New File
        </ContextMenuItem>
        <ContextMenuItem
          className="cursor-pointer"
          onMouseDown={e => e.stopPropagation()}
          onClick={e => {
            e.stopPropagation();
            setIsCreating({ type: 'folder', parentId });
            setTimeout(() => {
              const input = document.querySelector<HTMLInputElement>('#sidebar-creating-folder-item input');
              input?.focus();
            }, 0);
          }}
          inset
        >
          New Folder
        </ContextMenuItem>
        <ContextMenuSeparator />

        <ContextMenuItem className="cursor-pointer" inset>
          Cut
        </ContextMenuItem>
        <ContextMenuItem className="cursor-pointer" inset>
          Copy
        </ContextMenuItem>
        <ContextMenuItem className="cursor-pointer" inset>
          Paste
        </ContextMenuItem>
        {node && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem
              className="cursor-pointer"
              onMouseDown={e => {
                e.stopPropagation();
              }}
              onClick={() => setIsUpdatingNode(node)}
              inset
            >
              Rename
            </ContextMenuItem>
            {/* <ContextMenuItem
              className="hover:bg-red-200 focus:bg-red-300 cursor-pointer p-0 px-0 w-full"
              onClick={e => e.preventDefault()}
            > */}
            <DangerConfirmDialog
              triggerTitle="Trash"
              title="Are you absolutely sure?"
              description="This item will be moved to the Trash and kept for 30 days. You can restore it anytime before permanent deletion."
              node={node}
            />
            {/* </ContextMenuItem> */}
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}

export const SidebarContextMenu = memo(SidebarContextMenuComponent, (prevProps, nextProps) => {
  // If the function returns true, the component will NOT re-render.
  // We check if the node _id is exactly the same.
  return prevProps.node?._id === nextProps.node?._id && prevProps.children === nextProps.children;
});
