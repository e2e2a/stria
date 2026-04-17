import { INode, IProject } from '@/types';
import { useState, useEffect } from 'react';

export interface LoadStep {
  key: 'project' | 'nodes' | 'settings' | 'editor' | 'finalize';
  label: string;
  done: boolean;
  active: boolean;
}

export function useProjectLoader({
  pLoading,
  nLoading,
  isSettingsLoading,
  pData,
  nData,
}: {
  pLoading: boolean;
  nLoading: boolean;
  isSettingsLoading: boolean;
  pData: { project: IProject } | null | undefined;
  nData: { nodes: INode[] } | null | undefined;
}) {
  const [isFullyDone, setIsFullyDone] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const steps: LoadStep[] = [
    { key: 'project', label: 'Loading project', done: !!pData?.project, active: pLoading },
    { key: 'nodes', label: 'Loading files & folders', done: !!nData?.nodes, active: nLoading },
    { key: 'settings', label: 'Syncing settings', done: !isSettingsLoading, active: isSettingsLoading },
    { key: 'editor', label: 'Preparing editor', done: false, active: !isSettingsLoading && !!nData?.nodes },
    { key: 'finalize', label: 'Finalizing editor', done: false, active: false },
  ];

  const allReady = steps.slice(0, 3).every(s => s.done);

  if (allReady) {
    steps[3].done = true;
    steps[3].active = false;
    steps[4].active = !isFullyDone;
    steps[4].done = isFullyDone;
  }

  const doneCount = steps.filter(s => s.done).length;
  const pct = isFullyDone ? 100 : Math.round((doneCount / steps.length) * 100);

  const nodeCount = nData?.nodes?.length || 0;
  const durationMs = nodeCount * 50;

  useEffect(() => {
    let exitTimer: NodeJS.Timeout;

    if (allReady) {
      const workTimer = setTimeout(() => {
        setIsFullyDone(true);

        exitTimer = setTimeout(() => {
          setIsReady(true);
        }, 500);
      }, durationMs);

      return () => {
        clearTimeout(workTimer);
        clearTimeout(exitTimer);
      };
    }
  }, [allReady, durationMs]);

  return { steps, pct, isReady };
}
