import type { route as routeFn } from 'ziggy-js';

declare global {
  const route: typeof routeFn;
}

declare global {
  interface Window {
    __PENDING_JUMP__: { nodeId: string; offset: number; length: number } | null;
  }

  interface WindowEventMap {
    'set-editor-context': CustomEvent<{ type: 'general' | 'callout'; pos?: number }>;
    // THE ONLY NEW THING:
    'editor-action': CustomEvent<{ nodeId: string; text: string }>;
  }
}
