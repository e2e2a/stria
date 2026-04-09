'use client';
import React, { useRef, useState } from 'react';
import { useNodeStore } from '@/features/editor/stores/nodes';
import { useTabStore } from '@/features/editor/stores/tabs';
import { cn } from '@/lib/utils';
import { TabItem } from './tab-item';
import { useGetMyProjectMembership } from '@/hooks/projectMember/useQueries';

interface TabsHeaderProps {
  pid: string;
}

export const TabsHeader = ({ pid }: TabsHeaderProps) => {
  const projectTabs = useTabStore(state => state.projectTabs);
  const activeTabs = useTabStore(state => state.activeTabs);
  const openTab = useTabStore(state => state.openTab);
  const setActiveTab = useTabStore(state => state.setActiveTab);
  const { data: mData } = useGetMyProjectMembership(pid);
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

    const index = getInsertIndex(e.clientX);

    // 1️⃣ Dragging a tab itself
    if (draggedTabId) {
      const currentIndex = tabs.findIndex(t => t.nodeId === draggedTabId);
      // Ignore if hovering over the same index or immediately next (VS Code behavior)
      if (currentIndex === index || currentIndex + 1 === index) return;
    }

    // 2️⃣ Dragging a node to insert as new tab
    if (activeDrag && dropIndex === index) return; // nothing changed, ignore

    // Only update dropIndex if it’s actually different
    if (dropIndex !== index) setDropIndex(index);
  };

  const handleDragLeave = () => setDropIndex(null);

  const handleDrop = () => {
    if (!activeDrag && !draggedTabId) return;

    if (draggedTabId) {
      const currentIndex = tabs.findIndex(t => t.nodeId === draggedTabId);
      if (currentIndex === -1 || dropIndex === null) return;
      const newTabs = [...tabs];
      const [moved] = newTabs.splice(currentIndex, 1);
      const finalIndex = dropIndex > currentIndex ? dropIndex - 1 : dropIndex;
      newTabs.splice(finalIndex, 0, moved);
      useTabStore.setState(state => ({ projectTabs: { ...state.projectTabs, [pid]: newTabs } }));
    } else if (activeDrag) {
      if (dropIndex === null) return;
      openTab(pid, activeDrag, true, dropIndex);
      setActiveTab(pid, activeDrag._id);
      setActiveNode(activeDrag._id);
      // setSelectedNode(null);
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
      className={cn('flex flex-row p-0 items-center h-full overflow-x-auto overflow-y-hidden w-full relative')}
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
            canEditChunk={!!mData?.permissions.canEditChunk}
            draggedTabId={draggedTabId}
            onDragStart={handleTabDragStart}
          />
        );
      })}
      <div className="flex-1 w-full h-full drop-shadow-xl shadow-xl" />
    </header>
  );
};
