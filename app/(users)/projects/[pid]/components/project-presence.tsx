// components/project-presence.tsx
'use client';

import { HocuspocusProvider } from '@hocuspocus/provider';
import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useProjectPresence } from '@/features/editor/stores/project-pressence';
import { useQueryClient } from '@tanstack/react-query';
import * as Y from 'yjs';

interface ProjectPresenceProps {
  projectId: string;
  children: React.ReactNode;
}

export function ProjectPresence({ projectId, children }: ProjectPresenceProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const setActiveUsers = useProjectPresence(state => state.setActiveUsers);
  const setBroadcastTreeUpdate = useProjectPresence(state => state.setBroadcastTreeUpdate);

  const providerRef = useRef<HocuspocusProvider | null>(null);

  useEffect(() => {
    if (!projectId || !session?.user?._id) return;

    const ydoc = new Y.Doc();
    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:1234';
    const provider = new HocuspocusProvider({
      url: WS_URL,
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
      provider?.awareness?.setLocalState({
        user: {
          id: session.user._id,
          name: session.user.email,
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
  }, [projectId, session?.user?._id, session?.user?.email, setActiveUsers, setBroadcastTreeUpdate, queryClient]);

  return <>{children}</>;
}
