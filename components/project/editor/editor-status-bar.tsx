import { useCorePluginStore } from '@/features/editor/stores/setting-core-plugin';

export const EditorStatusBar = ({ nodeId, initialContent = '' }: { nodeId: string; initialContent?: string }) => {
  const words = initialContent?.trim() ? initialContent.trim().split(/\s+/).length : 0;
  const editorStatus = useCorePluginStore(state => state.settings['editor-status']);

  if (!editorStatus) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 h-6 w-full justify-end flex items-center z-49 select-none">
      <div className="flex items-center h-full border-t border-b border-l border-border rounded-tl-lg bg-sidebar gap-4 text-xs px-4 font-mono text-foreground/60 uppercase tracking-tight">
        <div className="flex gap-1.5">
          <span>Lines:</span>
          <span id={`cm-line-count-${nodeId}`} className="text-blue-400/80">
            {words}
          </span>
        </div>
        <div className="flex gap-1.5">
          <span>Words:</span>
          <span id={`cm-word-count-${nodeId}`} className="text-blue-400/80">
            {words}
          </span>
        </div>
        <div className="flex gap-1.5">
          <span>Chars:</span>
          <span id={`cm-char-count-${nodeId}`} className="text-blue-400/80">
            {initialContent.length}
          </span>
        </div>
        <div className="ml-auto text-muted-foreground">UTF-8</div>
      </div>
    </div>
  );
};
