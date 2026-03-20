export function SearchOverlay({
  query,
  history,
  setHistory,
  STORAGE_KEY,
  onSelect,
}: {
  query: string;
  STORAGE_KEY: string;
  history: string[];
  setHistory: (val: string[]) => void;
  onSelect: (val: string) => void;
}) {
  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    localStorage.removeItem(STORAGE_KEY);
    setHistory([]);
  };

  const handleInteraction = (e: React.MouseEvent, value: string) => {
    e.preventDefault();
    onSelect(value);
  };

  return (
    <div className="absolute top-full left-0 w-full z-50 px-4 text-sm">
      <div className="bg-background border border-white/10 rounded-md shadow-2xl py-2">
        {!query && (
          <div className="pb-3 border-b border-white/5 mb-2">
            <p className="text-[10px] uppercase text-muted-foreground font-bold px-2 pb-1">Search options</p>
            <div className="space-y-1">
              <OptionItem label="tag:" description="search for tags" onMouseDown={e => handleInteraction(e, 'tag:#')} />
              <OptionItem label="line:" description="search keywords on same line" onMouseDown={e => handleInteraction(e, 'line:')} />
              <OptionItem label="file:" description="match file name" onMouseDown={e => handleInteraction(e, 'file:')} />
            </div>
          </div>
        )}

        {/* History Section */}
        <div>
          <div className="flex justify-between px-2 pb-1">
            <p className="text-[10px] uppercase text-muted-foreground font-bold">History</p>
            <button onMouseDown={handleClear} className="text-[10px] hover:text-white">
              ✕
            </button>
          </div>
          {history.map(item => (
            <div
              key={item}
              className="px-2 py-1.5 hover:bg-white/5 rounded cursor-pointer text-muted-foreground hover:text-white"
              onMouseDown={() => onSelect(item)}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OptionItem({ label, description, onMouseDown }: { label: string; description: string; onMouseDown?: (e: React.MouseEvent) => void }) {
  return (
    <div className="flex gap-2 px-2 py-1 hover:bg-white/5 rounded cursor-pointer group" onMouseDown={onMouseDown}>
      <span className="text-white font-mono">{label}</span>
      <span className="text-muted-foreground group-hover:text-white/70">{description}</span>
    </div>
  );
}
