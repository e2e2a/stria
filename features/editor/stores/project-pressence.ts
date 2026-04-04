import { create } from 'zustand';

interface UserInfo {
  id: string;
  name: string;
  color: string;
}

interface ProjectPresenceState {
  activeUsers: Map<string, UserInfo>;
  setActiveUsers: (users: Map<string, UserInfo>) => void;

  broadcastTreeUpdate: () => void;
  setBroadcastTreeUpdate: (fn: () => void) => void;
}

export const useProjectPresence = create<ProjectPresenceState>(set => ({
  activeUsers: new Map(),
  setActiveUsers: users => set({ activeUsers: users }),

  broadcastTreeUpdate: () => {},
  setBroadcastTreeUpdate: fn => set({ broadcastTreeUpdate: fn }),
}));
