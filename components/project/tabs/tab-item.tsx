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

export const TabItem = ({ tab, isActive, isDropBefore, pid, canEditChunk, onDragStart }: TabItemProps) => {
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
          if (tab.nodeId === 'graph-view') return;
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
        className="h-fit w-full"
      >
        <div
          className={cn(
            'group relative inline-flex items-center h-8 px-3 min-w-[140px] max-w-[220px] cursor-pointer transition-all duration-200 ease-in-out',
            'rounded-t-lg',
            isActive
              ? 'bg-background text-foreground z-20 border-t border-l border-r border-border shadow-[0_-2px_10px_-2px_rgba(0,0,0,0.08)]'
              : 'bg-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground/80'
          )}
        >
          {!isActive && <div className="absolute -left-px top-1/2 -translate-y-1/2 w-px h-[50%] bg-border/60 transition-opacity group-hover:opacity-0" />}

          {!isActive && (
            <div className="absolute -right-px top-1/2 -translate-y-1/2  w-px h-[50%] bg-border/60 transition-opacity group-hover:opacity-0" />
          )}

          {isDropBefore && <div className="absolute left-px top-1 bottom-1 w-0.5 bg-primary/60 z-50 rounded-full" />}

          <span className={cn('text-xs font-medium tracking-wide truncate flex-1 z-10 pl-1', tab.isPreview && 'italic opacity-80')}>{tab.title}</span>

          <div className="ml-2 flex items-center justify-center w-5 h-5 z-10">
            <X
              className={cn(
                'w-3.5 h-3.5 p-[1.5px] rounded-md transition-all duration-200',
                isActive
                  ? 'opacity-60 hover:opacity-100 hover:bg-muted hover:scale-105'
                  : 'opacity-0 group-hover:opacity-60 hover:opacity-100! hover:bg-muted/80'
              )}
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
