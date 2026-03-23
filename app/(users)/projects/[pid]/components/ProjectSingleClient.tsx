'use client';
import AppSidebarLayout from '@/components/project/app-sidebar-layout';
import { useParams } from 'next/navigation';
import MarkdownSection from './MarkdownSection';
import { INode } from '@/types';
import { useTabStore } from '@/features/editor/stores/tabs';
import { ProjectPresence } from './project-presence';
import GraphViewSection from './graph-view-section';

export function ProjectSingleClient() {
  const params = useParams();
  const pid = params.pid as string;
  const projectTabs = useTabStore(state => state.projectTabs);
  const activeTabs = useTabStore(state => state.activeTabs);
  const tabs = projectTabs[pid] || [];
  const activeTabId = activeTabs[pid];
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
            return (
              <div key={tab.nodeId} className={tab.nodeId === activeTabId ? 'h-full w-full block' : 'hidden'}>
                {tab.nodeId === 'graph-view' ? <GraphViewSection projectId={pid} /> : <MarkdownSection node={tab.node as INode} isDirty={tab.isDirty} />}
              </div>
            );
          })}
        </div>
      </ProjectPresence>
    </AppSidebarLayout>
  );
}
