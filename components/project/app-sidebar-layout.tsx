'use client';
import React, { useEffect, useRef, memo, useState, useCallback } from 'react';
import { ImperativePanelHandle } from 'react-resizable-panels';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { AppContent } from './app-content';
import { AppShell } from './app-shell';
import LeftSidebarTemplate from './left-sidebar/left-sidebar-template';
import RightSidebarTemplate from './right-sidebar/right-sidebar-template';
import MiniSidebarTemplate from './mini-left-sidebar';
import { useNodeStore } from '@/features/editor/stores/nodes';
import { notFound, useParams } from 'next/navigation';
import { TabsHeader } from './tabs/tab-header';
import { useProjectByIdQuery } from '@/hooks/project/useProjectQuery';
import { useNodesProjectIdQuery } from '@/hooks/node/useNodeQuery';
import { Button } from '../ui/button';
import { PanelRightCloseIcon, PanelRightOpenIcon } from 'lucide-react';
import { IconTooltip } from './icon-tooltip';

interface MainContentAreaProps {
  children: React.ReactNode;
  RightSidebarRef: React.RefObject<ImperativePanelHandle | null>;
  isRightCollapsed: boolean;
}

const MainContentArea = memo(function MainContentArea({ children, RightSidebarRef, isRightCollapsed }: MainContentAreaProps) {
  const params = useParams();
  const pid = params.pid as string;

  const toggleRightSidebar = () => {
    const panel = RightSidebarRef.current;
    if (!panel) return;
    if (panel.isCollapsed()) {
      panel.expand();
    } else {
      panel.collapse();
    }
  };

  return (
    <AppContent variant="sidebar" className="text-muted-foreground h-screen overflow-hidden">
      <div className="flex flex-col h-full w-full gap-1">
        <div className="h-12 bg-sidebar flex">
          <TabsHeader pid={pid} />
          <div className="w-fit h-12 flex items-center px-1">
            <IconTooltip label={'Collapse'} side="left">
              <Button type="button" tabIndex={-1} variant={'ghost'} onClick={toggleRightSidebar} className="w-8 h-8 cursor-pointer ">
                {isRightCollapsed ? <PanelRightOpenIcon className="w-7! h-7!" /> : <PanelRightCloseIcon className="w-7! h-7!" />}
              </Button>
            </IconTooltip>
          </div>
        </div>
        <div className="flex-1 min-h-0 w-full overflow-hidden">{children}</div>
      </div>
    </AppContent>
  );
});

const RightSidebarArea = ({
  activeNodeId,
  activeNodeType,
  activeNodeContent,
}: {
  activeNodeId: string;
  activeNodeType: string;
  activeNodeContent: string;
}) => {
  return (
    <AppContent variant="sidebar" className="text-muted-foreground">
      <RightSidebarTemplate activeNodeId={activeNodeId} activeNodeType={activeNodeType} activeNodeContent={activeNodeContent} />
    </AppContent>
  );
};

export default function AppSidebarLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pid = params.pid as string;
  const { data: pData, isLoading: pLoading, error: pError } = useProjectByIdQuery(pid);
  const { data: nData, isLoading: nLoading } = useNodesProjectIdQuery(pid);
  const activeNode = useNodeStore(state => state.activeNode);
  const selectedNode = useNodeStore(state => state.selectedNode);
  const setSelectedNode = useNodeStore(state => state.setSelectedNode);
  const setIsUpdatingNode = useNodeStore(state => state.setIsUpdatingNode);
  const clearHistory = useNodeStore(state => state.clearHistory);
  const setNodes = useNodeStore(state => state.setNodes);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);

  const LeftSidebarRef = useRef<ImperativePanelHandle>(null);
  const RightSidebarRef = useRef<ImperativePanelHandle>(null);

  useEffect(() => {
    if (!pid) return;

    clearHistory();
  }, [pid, clearHistory]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'F2' && (activeNode || selectedNode)) {
        setIsUpdatingNode(selectedNode || activeNode);
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeNode, selectedNode, setIsUpdatingNode]);

  useEffect(() => {
    if (!nData && (!nData?.nodes || nData?.nodes?.length <= 0)) return;
    setNodes(nData?.nodes);
  }, [nData, setNodes]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [leftMinPercent, setLeftMinPercent] = useState(14);
  const [rightMinPercent, setRightMinPercent] = useState(16);
  const isDraggingRef = useRef(false);
  const lastWidthRef = useRef<number>(0);

  const updatePanelConstraints = useCallback(() => {
    // If user is dragging a handle, DO NOT run the zoom math.
    // This prevents the "jitter" where the mouse and the code fight for control.
    if (isDraggingRef.current || !containerRef.current) return;

    const currentTotalWidth = containerRef.current.offsetWidth;
    if (currentTotalWidth === 0) return;

    // Calculate constraints
    const leftMin = (260 / currentTotalWidth) * 100;
    const rightMin = (300 / currentTotalWidth) * 100;

    setLeftMinPercent(leftMin);
    setRightMinPercent(rightMin);

    // Zoom Logic: Only run if the width actually changed (Window Resize / Inspect)
    if (lastWidthRef.current !== 0 && lastWidthRef.current !== currentTotalWidth) {
      const ratio = lastWidthRef.current / currentTotalWidth;

      if (LeftSidebarRef.current && !isLeftCollapsed) {
        const currentSize = LeftSidebarRef.current.getSize();
        LeftSidebarRef.current.resize(currentSize * ratio);
      }
      if (RightSidebarRef.current && !isRightCollapsed) {
        const currentSize = RightSidebarRef.current.getSize();
        RightSidebarRef.current.resize(currentSize * ratio);
      }
    }

    lastWidthRef.current = currentTotalWidth;
  }, [isLeftCollapsed, isRightCollapsed]);

  useEffect(() => {
    updatePanelConstraints();
    window.addEventListener('resize', updatePanelConstraints);
    const observer = new ResizeObserver(updatePanelConstraints);
    if (containerRef.current) observer.observe(containerRef.current);

    return () => {
      window.removeEventListener('resize', updatePanelConstraints);
      observer.disconnect();
    };
  }, [updatePanelConstraints]);

  const isReady = !pLoading && !nLoading && pData?.project && nData?.nodes;
  if (!isReady) return <div className="flex items-center justify-center h-screen bg-background text-muted-foreground">Loading workspace...</div>;
  if (pError) return notFound();
  return (
    <div ref={containerRef} className="h-full w-full overflow-hidden">
      <AppShell variant="sidebar">
        <ResizablePanelGroup
          direction="horizontal"
          autoSaveId="sidebar-layout"
          className="overflow-y-hidden rounded-none bg-white"
          onMouseDownCapture={e => {
            const target = e.target as HTMLElement;
            if (target.closest('[data-sidebar-node]')) return;
            if (e.button !== 2) {
              if (!selectedNode) return;
              setSelectedNode(null);
            }
          }}
        >
          <MiniSidebarTemplate LeftSidebarRef={LeftSidebarRef} isLeftCollapsed={isLeftCollapsed} RightSidebarRef={RightSidebarRef} />

          <ResizablePanel
            ref={LeftSidebarRef}
            minSize={leftMinPercent}
            collapsedSize={0}
            defaultSize={leftMinPercent}
            collapsible
            onCollapse={() => setIsLeftCollapsed(true)}
            onExpand={() => setIsLeftCollapsed(false)}
            onResize={size => {
              if (size <= 4 && LeftSidebarRef.current) LeftSidebarRef.current.collapse();
            }}
            className="text-muted-foreground flex h-full flex-row p-0"
          >
            <LeftSidebarTemplate projectData={pData?.project} />
          </ResizablePanel>

          <ResizableHandle
            tabIndex={-1}
            hitAreaMargins={{ coarse: 1, fine: 1 }}
            onDragging={isDragging => {
              isDraggingRef.current = isDragging;
              if (isDragging) {
                document.documentElement.classList.add('is-dragging-panels');
              } else {
                document.documentElement.classList.remove('is-dragging-panels');
              }
            }}
            className="p-0 w-px custom-resize-handle group relative "
            withHandle={isLeftCollapsed}
          />

          <ResizablePanel className="flex-1 h-full max-h-full p-0" minSize={8} defaultSize={60}>
            <MainContentArea RightSidebarRef={RightSidebarRef} isRightCollapsed={isRightCollapsed}>
              {children}
            </MainContentArea>
          </ResizablePanel>

          <div className=" w-px p-px bg-background! " />
          <ResizableHandle
            tabIndex={-1}
            hitAreaMargins={{ coarse: 1, fine: 1 }}
            onDragging={isDragging => {
              isDraggingRef.current = isDragging;
              if (isDragging) {
                document.documentElement.classList.add('is-dragging-panels');
              } else {
                document.documentElement.classList.remove('is-dragging-panels');
              }
            }}
            className="p-0 w-px custom-resize-handle group relative "
            withHandle={isRightCollapsed}
          />

          <ResizablePanel
            ref={RightSidebarRef}
            minSize={rightMinPercent}
            defaultSize={rightMinPercent}
            collapsible
            onCollapse={() => setIsRightCollapsed(true)}
            onExpand={() => setIsRightCollapsed(false)}
            onResize={size => {
              if (size <= 1 && RightSidebarRef.current) RightSidebarRef.current.collapse();
            }}
            className="flex-1 h-full max-h-full p-0"
          >
            <RightSidebarArea activeNodeId={activeNode?._id ?? ''} activeNodeType={activeNode?.type ?? ''} activeNodeContent={activeNode?.content ?? ''} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </AppShell>
    </div>
  );
}
