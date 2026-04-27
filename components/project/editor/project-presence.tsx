// components/project-presence.tsx
'use client';

import { HocuspocusProvider } from '@hocuspocus/provider';
import { useEffect, useRef } from 'react';
import { useProjectPresence } from '@/features/editor/stores/project-pressence';
import { useQueryClient } from '@tanstack/react-query';
import * as Y from 'yjs';

interface ProjectPresenceProps {
  projectId: string;
  children: React.ReactNode;
}

export function ProjectPresence({ projectId, children }: ProjectPresenceProps) {
  const queryClient = useQueryClient();

  const setActiveUsers = useProjectPresence(state => state.setActiveUsers);
  const setBroadcastTreeUpdate = useProjectPresence(state => state.setBroadcastTreeUpdate);

  const providerRef = useRef<HocuspocusProvider | null>(null);

  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_URL;
    if (!projectId || !wsUrl) return;

    const ydoc = new Y.Doc();
    const provider = new HocuspocusProvider({
      url: wsUrl,
      name: `project-presence-${projectId}`,
      document: ydoc,
    });

    providerRef.current = provider;

    const syncMap = ydoc.getMap<number>('sync-state');

    const handleRemoteSync = (event: Y.YMapEvent<number>) => {
      if (!event.transaction.local) {
        console.log('Remote tree update detected! Refreshing...');
        queryClient.invalidateQueries({ queryKey: ['nodesByProjectId', projectId] });
      }
    };

    syncMap.observe(handleRemoteSync);

    setBroadcastTreeUpdate(() => {
      syncMap.set('lastUpdate', Date.now());
    });

    provider.on('synced', () => {
      const userId = localStorage.getItem('markdown-editor-user-id') || crypto.randomUUID();
      localStorage.setItem('markdown-editor-user-id', userId);
      provider?.awareness?.setLocalState({
        user: {
          id: userId,
          name: 'Local editor',
          color: '#' + Math.floor(Math.random() * 16777215).toString(16),
        },
      });
    });

    const updateUsers = () => {
      const states = provider?.awareness?.getStates();
      if (states) {
        const users = new Map();
        states.forEach(state => {
          if (state?.user?.id) {
            users.set(state.user.id, state.user);
          }
        });
        setActiveUsers(users);
      }
    };

    provider?.awareness?.on('change', updateUsers);

    return () => {
      syncMap.unobserve(handleRemoteSync);
      provider?.awareness?.off('change', updateUsers);
      provider.destroy();
      setBroadcastTreeUpdate(() => {});
    };
  }, [projectId, setActiveUsers, setBroadcastTreeUpdate, queryClient]);

  return <>{children}</>;
}
