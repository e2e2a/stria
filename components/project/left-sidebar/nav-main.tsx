'use client';
import { useRef, DragEvent, useEffect, useMemo } from 'react';
import { useNodeStore } from '@/features/editor/stores/nodes';
import { groupNodes } from '@/utils/client/node-utils';
import { SidebarGroup } from '@/components/ui/sidebar';
import SidebarItem from '../nodes/sidebar-item';
import { INode } from '@/types';
import { cn } from '@/lib/utils';
import SidebarCreateFolderItem from '../nodes/sidebar-create-folder-item';
import SidebarCreateFileItem from '../nodes/sidebar-create-file-item';
import { makeToastError } from '@/lib/toast';
import { useNodeMutations } from '@/hooks/node/useNodeMutations';
import { sortNodeTree } from '@/utils/client/sortNode';

export function clearAllFolderDragOver() {
  document.querySelectorAll('[data-drag-over]').forEach(el => el.removeAttribute('data-drag-over'));
}

export function NavMain({ canMoveNode }: { canMoveNode: boolean }) {
  const nodes = useNodeStore(state => state.nodes);
  const isCreating = useNodeStore(state => state.isCreating);
  const activeDrag = useNodeStore(state => state.activeDrag);
  const setActiveDrag = useNodeStore(state => state.setActiveDrag);
  const setNodes = useNodeStore(state => state.setNodes);
  const moveNode = useNodeStore(state => state.moveNode);
  const activeNode = useNodeStore(state => state.activeNode);
  const mutation = useNodeMutations();

  const nodesById = useMemo(() => {
    const map: Record<string, INode> = {};
    const walk = (list?: INode[]) => {
      if (!list) return;
      for (const n of list) {
        map[n._id] = n;
        walk(n.children);
      }
    };
    walk(nodes ?? []);
    return map;
  }, [nodes]);

  useEffect(() => {
    if (!nodes || nodes?.length <= 0) return;
    const result = sortNodeTree(nodes);
    setNodes(result);
  }, [nodes, setNodes]);

  // Ref for the final drop logic to avoid unnecessary re-renders
  const targetIdRef = useRef<string | null>(null);

  const { folders, files } = groupNodes(nodes || []);

  const handleDragFinished = () => {
    const dragged = activeDrag;
    const targetId = targetIdRef.current;

    setActiveDrag(null);
    targetIdRef.current = null;

    if (!dragged || !targetId) return; // invalid drop
    if (targetId === 'root' && dragged.parentId === null) return; // invalid drop

    try {
      moveNode(dragged._id, targetId);
      requestAnimationFrame(() => document.getElementById('sidebar-tree-nodes')?.focus());

      mutation.move.mutate(
        { _id: dragged._id, pid: dragged.projectId, parentId: targetId === 'root' ? null : targetId },
        {
          onError: async err => {
            try {
              makeToastError(err.message);
            } catch {}
            return;
          },
        }
      );
    } catch (err) {
      let message = 'Unknown Error';
      if (err instanceof Error) {
        message = err.message;
      } else {
        message = err as string;
      }
      makeToastError(message);
    }
  };

  const isCreatingAtRoot = isCreating && isCreating.parentId === null;

  const commonDragEvents = {
    onDragOver: (e: DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';

      const targetId = 'root';
      if (targetIdRef.current !== targetId) {
        clearAllFolderDragOver();
        targetIdRef.current = targetId;
      }

      const el = document.querySelector(`[data-id="${targetId}"]`) as HTMLElement | null;
      el?.setAttribute('data-drag-over', 'true');
    },

    onDragLeave: (e: DragEvent) => {
      e.preventDefault();
      clearAllFolderDragOver();
    },

    onDragEnter: (e: DragEvent) => e.preventDefault(),
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      // e.stopPropagation();
      clearAllFolderDragOver();
      handleDragFinished();
    },
  };

  return (
    <div
      className={cn(
        'h-full w-full flex flex-col group/nodes-border-level',
        activeDrag &&
          activeDrag.parentId &&
          'has-[[data-id="root"][data-drag-over="true"]]:bg-accent/50 has-[[data-id="root"][data-drag-over="true"]]:ring-1 has-[[data-id="root"][data-drag-over="true"]]:ring-inset has-[[data-id="root"][data-drag-over="true"]]:ring-accent'
      )}
    >
      <SidebarGroup className="flex-1 flex px-0 pb-0 flex-col pt-16 overflow-y-auto relative [&::-webkit-scrollbar-track]:mt-[60px]">
        {isCreatingAtRoot && isCreating.type === 'folder' && <SidebarCreateFolderItem depth={0} />}
        {folders.map(item => (
          <SidebarItem
            key={item._id}
            item={item}
            nodesById={nodesById}
            depth={0}
            targetIdRef={targetIdRef}
            activeNode={activeNode}
            activeDrag={activeDrag}
            canMoveNode={canMoveNode}
            onDragStart={setActiveDrag}
            onDragEnd={handleDragFinished}
          />
        ))}

        {isCreatingAtRoot && isCreating.type === 'file' && <SidebarCreateFileItem depth={2} />}
        {files.map(item => (
          <SidebarItem
            key={item._id}
            item={item}
            nodesById={nodesById}
            depth={0}
            targetIdRef={targetIdRef}
            activeNode={activeNode}
            activeDrag={activeDrag}
            canMoveNode={canMoveNode}
            onDragStart={setActiveDrag}
            onDragEnd={handleDragFinished}
          />
        ))}

        {/* Flexible spacer at the bottom */}
        <div data-id="root" className="flex-1 w-full min-h-3" {...commonDragEvents} />
      </SidebarGroup>
    </div>
  );
}
