'use client';
import AppSidebarLayout from '@/components/project/app-sidebar-layout';
import { useParams } from 'next/navigation';
import MarkdownSection from './MarkdownSection';
import { INode } from '@/types';
import { useTabStore } from '@/features/editor/stores/tabs';
import { ProjectPresence } from './project-presence';
import GraphViewSection from './graph-view-section';
import { useEffect, useState } from 'react';
import { useGetMyProjectMembership } from '@/hooks/projectMember/useQueries';

export function ProjectSingleClient() {
  const params = useParams();
  const pid = params.pid as string;
  const projectTabs = useTabStore(state => state.projectTabs);
  const activeTabs = useTabStore(state => state.activeTabs);
  const tabs = projectTabs[pid] || [];
  const activeTabId = activeTabs[pid];

  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (activeTabId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisitedTabs(prev => new Set(prev).add(activeTabId));
    }
  }, [activeTabId]);

  const { data: mData } = useGetMyProjectMembership(pid);
  const canEditNode = !!mData?.permissions?.canEditNode;
  const canEditChunk = !!mData?.permissions?.canEditChunk;

  return (
    <AppSidebarLayout>
      <ProjectPresence projectId={pid}>
        <div className="h-full">
          {(tabs.length === 0 || !activeTabId) && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground/40 select-none">
              <div className="border-2 border-dashed border-muted rounded-xl p-8 flex flex-col items-center">
                <p className="text-sm font-medium">No file selected</p>
                <p className="text-xs">Open a file to start editing</p>
              </div>
            </div>
          )}

          {tabs.map(tab => {
            const isActive = tab.nodeId === activeTabId;
            const hasBeenVisited = visitedTabs.has(tab.nodeId);

            // KISS: If it's not active and we haven't visited it yet, don't even put the div in the DOM.
            // This stops the initial refresh lag when history has 10 tabs.
            if (!isActive && !hasBeenVisited) return null;
            return (
              <div key={tab.nodeId} className={tab.nodeId === activeTabId ? 'h-full w-full block' : 'hidden'}>
                {tab.nodeId === 'graph-view' ? (
                  <GraphViewSection projectId={pid} activeTabId={activeTabId} />
                ) : (
                  <MarkdownSection node={tab.node as INode} isDirty={tab.isDirty} canEditChunk={canEditChunk} canEditNode={canEditNode} />
                )}
              </div>
            );
          })}
        </div>
      </ProjectPresence>
    </AppSidebarLayout>
  );
}
