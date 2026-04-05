export const EditorStatusBar = ({ nodeId, initialContent = '' }: { nodeId: string; initialContent?: string }) => {
  const words = initialContent?.trim() ? initialContent.trim().split(/\s+/).length : 0;

  return (
    <div className="absolute bottom-0 left-0 right-0 h-5 w-full bg-background justify-end border-t border-white/5 flex items-center px-4 z-60 select-none">
      <div className="flex items-center gap-4 text-[10px] font-mono text-white/40 uppercase tracking-tight">
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
