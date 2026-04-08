'use client';
import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tab, useTabStore } from '@/features/editor/stores/tabs';
import { tabActions } from '@/features/editor/stores/tabActions';
import { useNodeStore } from '@/features/editor/stores/nodes';
import TabHeaderContextMenu from './tab-header-context-menu';

interface TabItemProps {
  tab: Tab;
  isActive: boolean;
  isDropBefore: boolean;
  pid: string;
  canEditChunk: boolean;
  draggedTabId: string | null;
  onDragStart: (e: React.DragEvent, tabId: string) => void;
}

export const TabItem = ({ tab, isActive, draggedTabId, isDropBefore, pid, canEditChunk, onDragStart }: TabItemProps) => {
  const activeNode = useNodeStore(state => state.activeNode);
  const setActiveTab = useTabStore(state => state.setActiveTab);
  const pinTab = useTabStore(state => state.pinTab);
  const setActiveNode = useNodeStore(state => state.setActiveNode);

  return (
    <TabHeaderContextMenu tab={tab} pid={pid} canEditChunk={canEditChunk}>
      <div
        key={tab.nodeId}
        data-tab-id={tab.nodeId}
        draggable
        onDragStart={e => onDragStart(e, tab.nodeId)}
        onMouseDown={e => {
          if (e.button !== 0) return;
          const targetId = tab.nodeId;
          setActiveTab(pid, targetId);

          const elNode = document.querySelector(`[data-node-id="${targetId}"]`);
          if (elNode) {
            setTimeout(() => {
              setActiveNode(targetId);
              requestAnimationFrame(() => {
                elNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
              });
            }, 0);
          } else {
            const isAlreadyActive = activeNode?._id === targetId;

            if (isAlreadyActive) {
              setTimeout(() => {
                setActiveNode(targetId);
              }, 0);
            } else {
              setTimeout(() => {
                setActiveNode(null);
              }, 0);
              setActiveNode(targetId);
            }

            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                const foundNode = document.querySelector(`[data-node-id="${targetId}"]`);
                foundNode?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              });
            });
          }

          // Handle Tab scroll (Always visible)
          const elTab = document.querySelector(`[data-tab-id="${targetId}"]`);
          elTab?.scrollIntoView({ behavior: 'smooth', inline: 'nearest' });
        }}
        onDoubleClick={() => pinTab(pid, tab.nodeId)}
        onDragEnter={e => e.preventDefault()}
        className="h-fit w-fit"
      >
        <div
          className={cn(
            'group relative inline-flex select-none items-center h-12 px-3 min-w-[120px] max-w-[200px] border-r cursor-pointer transition-colors',
            isActive ? 'bg-background text-foreground' : 'bg-muted/40 text-muted-foreground hover:bg-muted/80'
          )}
        >
          {isActive && <div className="absolute top-0 left-0 right-0 h-[2px]" />}

          {isDropBefore && <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-blue-500 z-50" />}

          <span className={cn('text-sm truncate flex-1 select-none', tab.isPreview && 'italic opacity-80')}>{tab.title}</span>

          <div onMouseDown={e => e.stopPropagation()} className={cn('ml-2 flex items-center justify-center w-4 h-4 pointer-events-auto')}>
            <X
              className={cn('w-3 h-3 opacity-0 group-hover:opacity-100 hover:bg-accent rounded-sm transition-opacity ')}
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                tabActions.closeTab(pid, tab.nodeId);
              }}
            />
          </div>
        </div>
      </div>
    </TabHeaderContextMenu>
  );
};
