'use client';
import React, { useRef, useState } from 'react';
import { useNodeStore } from '@/features/editor/stores/nodes';
import { useTabStore } from '@/features/editor/stores/tabs';
import { cn } from '@/lib/utils';
import { TabItem } from './tab-item';

interface TabsHeaderProps {
  pid: string;
}

export const TabsHeader = ({ pid }: TabsHeaderProps) => {
  const projectTabs = useTabStore(state => state.projectTabs);
  const activeTabs = useTabStore(state => state.activeTabs);
  const openTab = useTabStore(state => state.openTab);
  const setActiveTab = useTabStore(state => state.setActiveTab);
  const activeDrag = useNodeStore(state => state.activeDrag);
  const setActiveNode = useNodeStore(state => state.setActiveNode);

  const tabs = projectTabs[pid] || [];
  const activeTabId = activeTabs[pid];

  const headerRef = useRef<HTMLDivElement | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);

  const getInsertIndex = (clientX: number) => {
    if (!headerRef.current) return tabs.length;
    const tabElements = Array.from(headerRef.current.querySelectorAll<HTMLElement>('[data-tab-id]'));
    for (let i = 0; i < tabElements.length; i++) {
      const rect = tabElements[i].getBoundingClientRect();
      const midX = rect.left + rect.width / 2;
      if (clientX < midX) return i;
    }
    return tabElements.length;
  };

  const getReorderIndex = (rawIndex: number, currentIndex: number) => {
    return rawIndex > currentIndex ? rawIndex - 1 : rawIndex;
  };

  const handleTabDragStart = (e: React.DragEvent, tabId: string) => {
    setDraggedTabId(tabId);
    e.dataTransfer.effectAllowed = 'move';

    const dragImage = document.createElement('div');
    dragImage.innerText = tabs.find(t => t.nodeId === tabId)?.title || 'Tab';
    dragImage.style.cssText = 'position:absolute; top:-1000px; padding:6px 10px; background:#000; color:#fff; border-radius:4px;';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);

    setTimeout(() => {
      if (document.body.contains(dragImage)) document.body.removeChild(dragImage);
    }, 0);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!activeDrag && !draggedTabId) return;
    e.preventDefault();

    const rawIndex = getInsertIndex(e.clientX);

    if (draggedTabId) {
      const currentIndex = tabs.findIndex(t => t.nodeId === draggedTabId);
      if (currentIndex === -1) return;

      const nextDropIndex = getReorderIndex(rawIndex, currentIndex);
      const currentDropIndex = dropIndex === null ? null : getReorderIndex(dropIndex, currentIndex);

      if (nextDropIndex === currentIndex) return;
      if (currentDropIndex === nextDropIndex) return;
    } else if (activeDrag && dropIndex === rawIndex) {
      return;
    }

    setDropIndex(rawIndex);
  };

  const handleDragLeave = () => setDropIndex(null);

  const handleDrop = () => {
    if (!activeDrag && !draggedTabId) return;

    if (draggedTabId) {
      const currentIndex = tabs.findIndex(t => t.nodeId === draggedTabId);
      if (currentIndex === -1 || dropIndex === null) return;

      const newTabs = [...tabs];
      const [moved] = newTabs.splice(currentIndex, 1);
      const finalIndex = getReorderIndex(dropIndex, currentIndex);
      newTabs.splice(finalIndex, 0, moved);

      useTabStore.setState(state => ({
        projectTabs: { ...state.projectTabs, [pid]: newTabs },
      }));
    } else if (activeDrag) {
      if (dropIndex === null) return;
      openTab(pid, activeDrag, true, dropIndex);
      setActiveTab(pid, activeDrag._id);
      setActiveNode(activeDrag._id);
    }

    setDropIndex(null);
    setDraggedTabId(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!headerRef.current) return;
    if (e.deltaY !== 0) {
      headerRef.current.scrollLeft += e.deltaY;
    }
  };

  return (
    <header
      ref={headerRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onDragEnter={e => e.preventDefault()}
      onWheel={handleWheel}
      className={cn('flex flex-row items-end h-12 w-full overflow-x-auto overflow-y-hidden', 'pl-3')}
    >
      {tabs.map((tab, i) => {
        const isActive = activeTabId === tab.nodeId;
        const isDropBefore = dropIndex === i;

        return (
          <TabItem
            key={tab.nodeId}
            tab={tab}
            isActive={isActive}
            isDropBefore={isDropBefore}
            pid={pid}
            canEditChunk={true}
            draggedTabId={draggedTabId}
            onDragStart={handleTabDragStart}
          />
        );
      })}

      <div className="relative flex-1 h-10 min-w-6">
        {dropIndex === tabs.length && <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-primary/60 z-50 rounded-full" />}
      </div>
    </header>
  );
};
