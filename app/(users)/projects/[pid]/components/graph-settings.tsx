import React, { useState } from 'react';
import { Search, X, Settings, RotateCcw, ChevronRight } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface GraphSettingsProps {
  showSettings: boolean;
  setShowSettings: (v: boolean) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  showTags: boolean;
  setShowTags: (v: boolean) => void;
  showOrphans: boolean;
  setShowOrphans: (v: boolean) => void;
  centerForce: number;
  setCenterForce: (v: number) => void;
  repelForce: number;
  setRepelForce: (v: number) => void;
  linkForce: number;
  setLinkForce: (v: number) => void;
  linkDistance: number;
  setLinkDistance: (v: number) => void;
  handleReset: () => void;
}

export function GraphSettings(props: GraphSettingsProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>('Filters');
  const categories = ['Filters', 'Forces'];

  return (
    <div className="absolute top-6 left-6 z-20 flex flex-col items-start gap-2">
      <button
        onClick={() => props.setShowSettings(!props.showSettings)}
        className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-white/70"
      >
        <Settings className={`w-5 h-5 ${props.showSettings ? 'rotate-90' : ''} transition-transform duration-300`} />
      </button>

      {props.showSettings && (
        <div className="w-64 bg-background/90 backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between p-3 border-b border-white/5">
            <span className="text-[11px] font-bold uppercase tracking-widest text-white/50">Graph Settings</span>
            <div className="flex gap-2">
              <button onClick={props.handleReset} className="p-1 hover:text-blue-400 text-white/30 transition-colors">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => props.setShowSettings(false)} className="p-1 hover:text-red-400 text-white/30 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex flex-col">
            {categories.map(cat => (
              <div key={cat} className="border-b border-white/5 last:border-0">
                <button
                  onClick={() => setExpandedCategory(expandedCategory === cat ? null : cat)}
                  className="w-full flex items-center justify-between p-3 hover:bg-white/5 text-left group"
                >
                  <div className="flex items-center gap-3">
                    <ChevronRight
                      className={`w-3 h-3 text-white/20 group-hover:text-blue-500 transition-transform duration-200 ${expandedCategory === cat ? 'rotate-90' : ''}`}
                    />
                    <span className="text-xs font-medium text-white/70 group-hover:text-white transition-colors tracking-wide">{cat}</span>
                  </div>
                </button>

                {/* Filters Category */}
                {expandedCategory === cat && cat === 'Filters' && (
                  <div className="p-3 pt-0 animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col gap-4">
                    <div className="relative group mt-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={props.searchQuery}
                        onChange={e => props.setSearchQuery(e.target.value)}
                        placeholder={props.showTags ? 'Search tags...' : 'Search files...'}
                        className="w-full bg-white/5 border border-white/10 rounded py-1.5 pl-9 pr-8 text-xs text-white outline-none focus:border-accent focus:ring-1 focus:ring-accent/70 transition-all"
                      />
                      {props.searchQuery && (
                        <button onClick={() => props.setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-xs font-medium text-white/70">Tags</span>
                        <button
                          onClick={() => {
                            props.setShowTags(!props.showTags);
                            props.setSearchQuery('');
                          }}
                          className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors focus:outline-none ${
                            props.showTags ? 'bg-blue-500' : 'bg-white/10'
                          }`}
                        >
                          <span
                            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${props.showTags ? 'translate-x-4' : 'translate-x-1'}`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between px-1">
                        <span className="text-xs font-medium text-white/70">Orphans</span>
                        <button
                          onClick={() => props.setShowOrphans(!props.showOrphans)}
                          className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors focus:outline-none ${
                            props.showOrphans ? 'bg-blue-500' : 'bg-white/10'
                          }`}
                        >
                          <span
                            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${props.showOrphans ? 'translate-x-4' : 'translate-x-1'}`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Forces Category */}
                {expandedCategory === cat && cat === 'Forces' && (
                  <div className="p-3 pt-0 animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col gap-5 mt-2">
                    <div className="flex flex-col gap-3 group/slider">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider">Center force</span>
                        <span className="text-[10px] font-mono text-blue-400 opacity-0 group-hover/slider:opacity-100 transition-opacity">
                          {props.centerForce.toFixed(2)}
                        </span>
                      </div>
                      <Slider value={[props.centerForce]} onValueChange={v => props.setCenterForce(v[0])} min={0} max={2} step={0.01} />
                    </div>

                    <div className="flex flex-col gap-3 group/slider">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider">Repel force</span>
                        <span className="text-[10px] font-mono text-blue-400 opacity-0 group-hover/slider:opacity-100 transition-opacity">
                          {props.repelForce}
                        </span>
                      </div>
                      <Slider value={[props.repelForce]} onValueChange={v => props.setRepelForce(v[0])} max={200} step={1} />
                    </div>

                    <div className="flex flex-col gap-3 group/slider">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider">Link force</span>
                        <span className="text-[10px] font-mono text-blue-400 opacity-0 group-hover/slider:opacity-100 transition-opacity">
                          {props.linkForce.toFixed(2)}
                        </span>
                      </div>
                      <Slider value={[props.linkForce]} onValueChange={v => props.setLinkForce(v[0])} max={1} step={0.05} />
                    </div>

                    <div className="flex flex-col gap-3 group/slider">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider">Link distance</span>
                        <span className="text-[10px] font-mono text-blue-400 opacity-0 group-hover/slider:opacity-100 transition-opacity">
                          {props.linkDistance}
                        </span>
                      </div>
                      <Slider value={[props.linkDistance]} onValueChange={v => props.setLinkDistance(v[0])} min={30} max={500} step={1} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
