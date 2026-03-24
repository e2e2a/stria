'use client';
import React, { useEffect, useState, DragEvent, useRef, useMemo } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../ui/collapsible';
import { SidebarGroupContent, SidebarMenu } from '../../ui/sidebar';
import { SidebarContextMenu } from '../left-sidebar/sidebar-context-menu';
import { cn } from '@/lib/utils';
import { INode } from '@/types';
import { useNodeStore } from '@/features/editor/stores/nodes';
import SidebarFileItem from './sidebar-file-item';
import SidebarCreateFileItem from './sidebar-create-file-item';
import { groupNodes } from '@/utils/client/node-utils';
import SidebarCreateFolderItem from './sidebar-create-folder-item';
import SidebarFolderItem from './sidebar-folder-item';
import { clearAllFolderDragOver } from '@/components/project/left-sidebar/nav-main';

function isDescendant(draggedId: string, targetId: string, nodesById: Record<string, INode>) {
  let current = nodesById[targetId];

  while (current?.parentId) {
    if (current.parentId === draggedId) return true;
    current = nodesById[current.parentId];
  }

  return false;
}

function getHighlightTargetId(item: INode) {
  if (item.type === 'file') {
    if (!item.parentId) return 'root';
    return item.parentId ?? item._id;
  }

  return item._id;
}

interface IProps {
  item: INode;
  depth: number;
  nodesById: Record<string, INode>;
  targetIdRef: React.RefObject<string | null>;
  activeDrag: INode | null;
  isParentDragging?: boolean;
  onDragStart: (node: INode) => void;
  onDragEnd: () => void;
}

export default function SidebarItem({ item, depth, nodesById, activeDrag, targetIdRef, isParentDragging = false, onDragStart, onDragEnd }: IProps) {
  const localStorageKey = `sidebar-folder-open-${item._id}`;
  const hoverTimeoutRef = useRef<number | null>(null);

  const isCreating = useNodeStore(state => state.isCreating);
  const activeNode = useNodeStore(state => state.activeNode);
  const collapseVersion = useNodeStore(state => state.collapseVersion);
  const isUpdatingNode = useNodeStore(state => state.isUpdatingNode);
  const userToggledRef = useRef(false);
  const [isOpen, setIsOpen] = useState(() => {
    try {
      return localStorage.getItem(localStorageKey) === 'true';
    } catch {
      return false;
    }
  });

  const [prevVersion, setPrevVersion] = useState(collapseVersion);
  // if (collapseVersion !== prevVersion) {
  //   setPrevVersion(collapseVersion);
  //   setIsOpen(false);
  // }

  useEffect(() => {
    localStorage.setItem(localStorageKey, String(isOpen));
  }, [localStorageKey, isOpen]);
  const isCreatingHere = isCreating && isCreating.parentId === item._id;

  const isDirectTarget = activeDrag?._id === item._id;
  const isInForbiddenZone = isDirectTarget || isParentDragging;

  const handleToggle = (value: boolean) => {
    userToggledRef.current = true;
    setIsOpen(value);
  };

  useEffect(() => {
    if (item.type !== 'folder') return;

    const isGlobalCollapseTriggered = collapseVersion !== prevVersion;

    if (isGlobalCollapseTriggered || (!activeNode && isGlobalCollapseTriggered)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsOpen(false);
      setPrevVersion(collapseVersion);
      userToggledRef.current = true;
      return;
    }
    let current = activeNode;
    let shouldOpen = false;
    while (current?.parentId) {
      if (current.parentId === item._id) {
        shouldOpen = true;
        break;
      }
      current = nodesById[current.parentId];
    }

    if (activeNode?._id === item?._id) shouldOpen = true;
    if (shouldOpen && !isOpen && !userToggledRef.current) setIsOpen(true);
  }, [activeNode, isOpen, item._id, item.type, nodesById, collapseVersion, prevVersion]);

  const lastActiveIdRef = useRef<string | null>(activeNode?._id || null);

  useEffect(() => {
    if (activeNode?._id !== lastActiveIdRef.current) {
      userToggledRef.current = false;
      lastActiveIdRef.current = activeNode?._id || null;
    }
  }, [activeNode?._id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isCreatingHere) setIsOpen(true);
  }, [isCreatingHere]);

  const clearOpenFolderTimeout = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  const handleDragStart = (e: DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    onDragStart(item);

    // Create simple ghost image
    const dragImage = document.createElement('div');
    dragImage.innerText = item.title || 'Moving...';
    dragImage.style.cssText =
      'position:absolute; top:-1000px; padding:6px 10px; background:#000; color:#fff; border-radius:4px; font-size:12px; z-index:1000;';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);

    // Clean up the ghost DOM node after the drag starts
    setTimeout(() => {
      if (document.body.contains(dragImage)) {
        document.body.removeChild(dragImage);
      }
    }, 0);
  };

  const commonDragEvents = {
    onDragOver: (e: DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (!activeDrag) return;
      const targetId = getHighlightTargetId(item);

      if (targetIdRef.current !== targetId) {
        clearOpenFolderTimeout();
        clearAllFolderDragOver();
        targetIdRef.current = targetId;
      }

      const el = document.querySelector(`[data-id="${targetId}"]`) as HTMLElement | null;
      el?.setAttribute('data-drag-over', 'true');

      if (!isOpen && item.type === 'folder' && !hoverTimeoutRef.current) {
        hoverTimeoutRef.current = window.setTimeout(() => {
          setIsOpen(true);
          hoverTimeoutRef.current = null;
        }, 1000);
      }
    },

    onDragLeave: (e: DragEvent) => {
      e.preventDefault();

      clearOpenFolderTimeout();
      const relatedTarget = e.relatedTarget as HTMLElement | null;
      if (!relatedTarget || !relatedTarget.closest(`[data-id="${targetIdRef.current}"]`)) {
        targetIdRef.current = null;
        clearAllFolderDragOver();
      }
    },

    onDragEnter: (e: DragEvent) => e.preventDefault(),
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      // e.stopPropagation();
      clearOpenFolderTimeout();
      clearAllFolderDragOver();
      if (activeDrag?._id !== item.parentId && activeDrag?._id !== item._id) {
        if (isDescendant(activeDrag?._id as string, item._id, nodesById)) {
          return;
        }
        if (!isOpen && item.type === 'folder') setIsOpen(true);
        onDragEnd();
      }
    },
  };

  const { folders, files } = useMemo(() => groupNodes(item.children), [item.children]);
  if (item.type === 'file') {
    return (
      <SidebarContextMenu node={item}>
        <div
          onDragStart={handleDragStart}
          draggable={isUpdatingNode || isCreating ? 'false' : 'true'}
          data-id={item.parentId ?? 'root'}
          data-node-id={item._id}
          {...commonDragEvents}
          className={cn(
            'flex text-sidebar-foreground/70 font-medium text-sm rounded-none focus:outline-none outline-none focus:ring-0',
            activeDrag && '*:hover:bg-transparent!'
          )}
        >
          <SidebarFileItem item={item} depth={!item.parentId ? depth + 2 : depth} />
        </div>
      </SidebarContextMenu>
    );
  }

  return (
    <>
      <SidebarMenu className="gap-0! p-0!">
        <Collapsible
          key={item.title}
          open={isOpen}
          data-id={item._id ?? 'root'}
          onOpenChange={isUpdatingNode?._id === item._id ? undefined : handleToggle}
          className={cn(
            'transition-none leading-none z-0',
            activeDrag && '*:hover:bg-transparent!',
            !isInForbiddenZone && activeDrag?.parentId !== item._id
              ? 'data-[drag-over=true]:bg-accent/50 data-[drag-over=true]:ring-1 data-[drag-over=true]:ring-inset data-[drag-over=true]:ring-accent '
              : ''
          )}
        >
          <CollapsibleTrigger disabled={isUpdatingNode?._id === item._id} asChild>
            <div className="w-full focus:outline-none gap-0 cursor-pointer" onDragStart={handleDragStart} draggable="true" {...commonDragEvents}>
              <SidebarContextMenu node={item}>
                <div className="">
                  <SidebarFolderItem item={item} isOpen={isOpen} depth={depth} />
                </div>
              </SidebarContextMenu>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="relative transition-none">
            <div
              aria-hidden
              className={cn(
                'absolute opacity-0 left-0 top-0 bottom-0 w-[0.5px] bg-foreground/10 z-5 group-hover/nodes-border-level:opacity-100',
                activeNode &&
                  ((activeNode.type === 'folder' && activeNode._id === item._id) || (activeNode.type === 'file' && activeNode.parentId === item._id)) &&
                  'opacity-100'
              )}
              style={{ left: (depth + 1) * 8 }}
            />

            <SidebarGroupContent>
              <SidebarMenu className="gap-0! space-y-0! p-0!">
                {isCreatingHere && isCreating.type === 'folder' && <SidebarCreateFolderItem depth={depth + 2} />}
                {folders.map(child => (
                  <SidebarItem
                    key={child._id}
                    item={child}
                    nodesById={nodesById}
                    depth={depth + 1}
                    activeDrag={activeDrag}
                    targetIdRef={targetIdRef}
                    isParentDragging={isInForbiddenZone}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                  />
                ))}
                {isCreatingHere && isCreating.type === 'file' && <SidebarCreateFileItem depth={depth + 3} />}
                {files.map(child => (
                  <SidebarItem
                    key={child._id}
                    item={child}
                    nodesById={nodesById}
                    depth={depth + 3}
                    activeDrag={activeDrag}
                    targetIdRef={targetIdRef}
                    isParentDragging={isInForbiddenZone}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        </Collapsible>
      </SidebarMenu>
    </>
  );
}
