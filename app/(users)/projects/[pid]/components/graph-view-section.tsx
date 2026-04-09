'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  Simulation,
  forceX,
  forceY,
  ForceManyBody,
  ForceY,
  ForceX,
  ForceLink,
} from 'd3-force';
import * as d3Zoom from 'd3-zoom';
import * as d3Drag from 'd3-drag';
import { select } from 'd3-selection';
import { Search, X, Settings, RotateCcw, ChevronRight } from 'lucide-react';
import { useTabStore } from '@/features/editor/stores/tabs';
import { useNodeStore } from '@/features/editor/stores/nodes';
import { GraphNode } from '@/lib/client/api/projectClient';
import { INode } from '@/types';
import { Slider } from '@/components/ui/slider';
import { useProjectGraphViewQuery } from '@/hooks/project/useProjectQuery';

type GraphLink = {
  source: string | GraphNode;
  target: string | GraphNode;
};

function GraphViewSection({ projectId }: { projectId: string; activeTabId: string | null }) {
  const { data, isLoading } = useProjectGraphViewQuery(projectId);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const transformRef = useRef(d3Zoom.zoomIdentity);
  const simRef = useRef<Simulation<GraphNode, GraphLink> | null>(null);
  const hoveredNodeIdRef = useRef<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>('Filters');

  const [showOrphans, setShowOrphans] = useState(true);
  const [showTags, setShowTags] = useState(false);

  const [centerForce, setCenterForce] = useState(1);
  const [repelForce, setRepelForce] = useState(120);
  const [linkForce, setLinkForce] = useState(0.15);
  const [linkDistance, setLinkDistance] = useState(50);

  const handleReset = () => {
    setSearchQuery('');
    setShowOrphans(true);
    setShowTags(false);
    setCenterForce(1);
    setRepelForce(120);
    setLinkForce(0.15);
    setLinkDistance(50);
  };

  const categories = ['Filters', 'Forces'];

  const { filteredNodes, filteredLinks, adjacency } = useMemo(() => {
    if (!data || !data.d3Nodes) return { filteredNodes: [], filteredLinks: [], adjacency: new Map() };

    const query = searchQuery.toLowerCase().trim();
    const cleanTagQuery = query.replace(/^#/, '');
    const fullAdj = new Map<string, Set<string>>();

    data.d3Nodes.forEach(n => fullAdj.set(n._id, new Set<string>()));

    const validLinks = data.d3Links || [];
    validLinks.forEach(l => {
      fullAdj.get(l.source)?.add(l.target);
      fullAdj.get(l.target)?.add(l.source);
    });

    const visibleNodeIds = new Set<string>();

    data.d3Nodes.forEach(n => {
      if (n.type === 'tag' && !showTags) return;

      const isOrphan = fullAdj.get(n._id)?.size === 0;
      if (!showOrphans && isOrphan) return;

      if (!query) {
        visibleNodeIds.add(n._id);
      } else {
        const isMatch = showTags
          ? n.type === 'tag' && n.title.toLowerCase().includes(cleanTagQuery)
          : n.type !== 'tag' && n.title.toLowerCase().includes(query);

        if (isMatch) {
          visibleNodeIds.add(n._id);
          const neighbors = fullAdj.get(n._id);
          if (neighbors) {
            neighbors.forEach(neighborId => visibleNodeIds.add(neighborId));
          }
        }
      }
    });

    const nodesArr = data.d3Nodes
      .filter(n => {
        if (!showTags && n.type === 'tag') return false;
        return visibleNodeIds.has(n._id);
      })
      .map(n => ({ ...n }));

    const nodeMap = new Map<string, GraphNode>();
    nodesArr.forEach(n => nodeMap.set(n._id, n));

    const linksArr: GraphLink[] = [];
    const adj = new Map<string, Set<string>>();
    nodesArr.forEach(n => adj.set(n._id, new Set<string>()));

    validLinks.forEach(l => {
      const sourceNode = nodeMap.get(l.source);
      const targetNode = nodeMap.get(l.target);

      if (sourceNode && targetNode) {
        linksArr.push({ source: sourceNode, target: targetNode });
        adj.get(sourceNode._id)?.add(targetNode._id);
        adj.get(targetNode._id)?.add(sourceNode._id);
      }
    });

    return { filteredNodes: nodesArr, filteredLinks: linksArr, adjacency: adj };
  }, [data, searchQuery, showOrphans, showTags]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || filteredNodes.length === 0) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let isMoving = false;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const simulation = forceSimulation<GraphNode>(filteredNodes)
      .alphaDecay(0.02)
      .alphaMin(0.0001)
      .force(
        'link',
        forceLink<GraphNode, GraphLink>(filteredLinks)
          .id(d => d._id)
          .distance(linkDistance)
          .strength(linkForce)
      )
      .force('charge', forceManyBody<GraphNode>().strength(-repelForce))
      .force('center', forceCenter(canvas.width / 2, canvas.height / 2))
      .force('x', forceX(canvas.width / 2).strength(centerForce * 0.05))
      .force('y', forceY(canvas.height / 2).strength(centerForce * 0.05))
      .force(
        'collide',
        forceCollide<GraphNode>()
          .radius(d => d.radius + 6)
          .strength(0.5)
          .iterations(1)
      )
      .velocityDecay(0.4);

    simRef.current = simulation;

    const getWorldCoords = (mouseX: number, mouseY: number) => {
      const rect = canvas.getBoundingClientRect();
      const t = transformRef.current;
      return {
        x: (mouseX - rect.left - t.x) / t.k,
        y: (mouseY - rect.top - t.y) / t.k,
      };
    };

    canvas.onclick = e => {
      if (isMoving) return;
      const coords = getWorldCoords(e.clientX, e.clientY);
      const hit = filteredNodes.find(n => {
        const dx = n.x - coords.x;
        const dy = n.y - coords.y;
        return dx * dx + dy * dy < n.radius * n.radius;
      });

      if (hit && hit.type !== 'tag') {
        useTabStore.getState().openTab(projectId, hit as unknown as INode, true);
        useNodeStore.getState().setActiveNode(hit._id);
      }
    };

    const zoomBehavior = d3Zoom
      .zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([0.01, 8])
      .filter(event => {
        const coords = getWorldCoords(event.clientX, event.clientY);
        const hit = filteredNodes.find(n => {
          const dx = n.x - coords.x;
          const dy = n.y - coords.y;
          return dx * dx + dy * dy < n.radius * n.radius;
        });
        return !hit || event.type === 'wheel';
      })
      .on('zoom', event => {
        transformRef.current = event.transform;
        render();
      });

    const dragBehavior = d3Drag
      .drag<HTMLCanvasElement, unknown>()
      .subject(event => {
        const coords = getWorldCoords(event.sourceEvent.clientX, event.sourceEvent.clientY);
        return filteredNodes.find(n => {
          const dx = n.x - coords.x;
          const dy = n.y - coords.y;
          return dx * dx + dy * dy < n.radius * n.radius;
        });
      })
      .on('start', event => {
        isMoving = false;
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      })
      .on('drag', event => {
        isMoving = true;
        const coords = getWorldCoords(event.sourceEvent.clientX, event.sourceEvent.clientY);
        event.subject.fx = coords.x;
        event.subject.fy = coords.y;
      })
      .on('end', event => {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
        setTimeout(() => {
          isMoving = false;
        }, 50);
      });

    select(canvas).call(zoomBehavior).call(dragBehavior);

    canvas.onmousemove = e => {
      const coords = getWorldCoords(e.clientX, e.clientY);
      const hit = filteredNodes.find(n => {
        const dx = n.x - coords.x;
        const dy = n.y - coords.y;
        return dx * dx + dy * dy < n.radius * n.radius;
      });
      const newId = hit?._id || null;
      if (hoveredNodeIdRef.current !== newId) {
        hoveredNodeIdRef.current = newId;
        render();
      }
    };

    function render() {
      if (!ctx || !canvas) return;
      const t = transformRef.current;
      const hoverId = hoveredNodeIdRef.current;

      const currentNodes = simulation.nodes();
      const linkForce = simulation.force('link') as ForceLink<GraphNode, GraphLink>;
      const currentLinks = linkForce ? linkForce.links() : [];

      const dynamicNeighbors = new Set<string>();
      if (hoverId) {
        for (const l of currentLinks) {
          const sId = typeof l.source === 'object' ? (l.source as GraphNode)._id : String(l.source);
          const tId = typeof l.target === 'object' ? (l.target as GraphNode)._id : String(l.target);
          if (sId === hoverId) dynamicNeighbors.add(tId);
          if (tId === hoverId) dynamicNeighbors.add(sId);
        }
      }

      const COLOR_PRIMARY = 'oklch(0.5337 0.2808 293.24)';
      const COLOR_NEIGHBOR = '#60a5fa';
      const COLOR_TAG = '#fbbf24';
      const COLOR_IDLE = 'rgba(200, 200, 200, 0.8)';
      const COLOR_MUTED = 'rgba(255, 255, 255, 0.05)';

      ctx.fillStyle = 'oklch(0.2293 0.0153 264.2095)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.scale(t.k, t.k);

      ctx.beginPath();

      for (const l of currentLinks) {
        const sourceNode = l.source as GraphNode;
        const targetNode = l.target as GraphNode;

        if (sourceNode.x === undefined || targetNode.x === undefined) continue;

        const isRelated = hoverId && (sourceNode._id === hoverId || targetNode._id === hoverId);
        const isTagLink = sourceNode.type === 'tag' || targetNode.type === 'tag';

        ctx.moveTo(sourceNode.x, sourceNode.y);
        ctx.lineTo(targetNode.x, targetNode.y);

        if (hoverId) {
          ctx.strokeStyle = isRelated ? (isTagLink ? COLOR_TAG : COLOR_NEIGHBOR) : 'rgba(255, 255, 255, 0.01)';
        } else {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        }

        ctx.lineWidth = isRelated ? 2 / t.k : 0.8 / t.k;
        ctx.stroke();
        ctx.beginPath();
      }

      for (const n of currentNodes) {
        if (n.x === undefined || n.y === undefined) continue;

        const isMain = hoverId === n._id;
        const isNeighbor = dynamicNeighbors.has(n._id);
        const isTag = n.type === 'tag';

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius || 10, 0, 2 * Math.PI);

        if (!hoverId) {
          ctx.fillStyle = isTag ? COLOR_TAG : COLOR_IDLE;
        } else if (isMain) {
          ctx.fillStyle = isTag ? COLOR_TAG : COLOR_PRIMARY;
        } else if (isNeighbor) {
          ctx.fillStyle = isTag ? COLOR_TAG : COLOR_NEIGHBOR;
        } else {
          ctx.fillStyle = COLOR_MUTED;
        }

        if (isMain || (isNeighbor && (n.radius || 10) >= 18)) {
          ctx.shadowBlur = 15;
          ctx.shadowColor = isTag ? COLOR_TAG : isMain ? COLOR_PRIMARY : COLOR_NEIGHBOR;
        }
        ctx.fill();
        ctx.shadowBlur = 0;

        if (t.k > 0.8 || (t.k <= 0.8 && isMain)) {
          const showLabel = !hoverId || isMain || isNeighbor;
          if (showLabel) {
            const isBig = isMain && t.k <= 0.8;
            const fontSize = isBig ? 22 / t.k : 12 / t.k;
            ctx.font = `${isMain ? 'bold' : 'normal'} ${fontSize}px Inter, sans-serif`;
            ctx.textAlign = 'center';

            if (isMain) {
              ctx.fillStyle = '#ffffff';
            } else if (isNeighbor) {
              ctx.fillStyle = isTag ? COLOR_TAG : 'rgba(255,255,255,0.9)';
            } else {
              ctx.fillStyle = 'rgba(255,255,255,0.4)';
            }

            ctx.fillText(n.title, n.x, n.y + (n.radius || 10) + (isBig ? 35 : 15) / t.k);
          }
        }
      }

      ctx.restore();
    }

    simulation.on('tick', render);
    return () => {
      simulation.stop();
      window.removeEventListener('resize', resize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredNodes, filteredLinks, adjacency, projectId]);

  useEffect(() => {
    if (!simRef.current) return;
    const sim = simRef.current;

    const charge = sim.force('charge') as ForceManyBody<GraphNode> | undefined;
    if (charge) charge.strength(-repelForce);

    const link = sim.force('link') as ForceLink<GraphNode, GraphLink> | undefined;
    if (link) {
      link.distance(linkDistance);
      link.strength(linkForce);
    }

    const xAxis = sim.force('x') as ForceX<GraphNode> | undefined;
    if (xAxis) xAxis.strength(centerForce * 0.1);

    const yAxis = sim.force('y') as ForceY<GraphNode> | undefined;
    if (yAxis) yAxis.strength(centerForce * 0.1);

    sim.alpha(0.3).restart();
  }, [centerForce, repelForce, linkForce, linkDistance]);

  useEffect(() => {
    const handlePing = (e: CustomEvent) => {
      const { nodeId, content } = e.detail;
      const safeNodeId = String(nodeId);

      if (!simRef.current || !data || !data.d3Nodes) {
        return;
      }

      const sim = simRef.current;
      const currentNodes = sim.nodes();

      const normalize = (p: string) => {
        if (!p) return '';
        let cleanPath = p.replace(/[<>]/g, '').replace(/\+/g, ' ');
        try {
          cleanPath = decodeURIComponent(cleanPath);
        } catch {
          cleanPath = cleanPath.replace(/%20/g, ' ').replace(/%28/g, '(').replace(/%29/g, ')');
        }
        return cleanPath.replace(/\\/g, '/').replace(/\.md$/i, '').toLowerCase().trim();
      };

      const allFilesMap = new Map<string, GraphNode>();
      data.d3Nodes.forEach(n => allFilesMap.set(normalize(n.title), n));

      const activeNodeMap = new Map<string, GraphNode>();
      currentNodes.forEach(n => activeNodeMap.set(String(n._id), n as GraphNode));

      const tags = new Set<string>();
      const linkTargets = new Set<string>();
      const LINK_REGEX = /\[\[([^\]]+)\]\]|\[([^\]]+)\]\(((?:[^()]+|\([^()]*\))+)\)/g;

      const lines = content.replace(/\r/g, '').split('\n');
      lines.forEach((line: string) => {
        const tagRegex = /(^|\s)#([a-zA-Z0-9_\-\/]+)/g;
        let match;
        while ((match = tagRegex.exec(line)) !== null) {
          tags.add(`tag-${match[2].toLowerCase()}`);
        }
      });

      LINK_REGEX.lastIndex = 0;
      let match;
      while ((match = LINK_REGEX.exec(content)) !== null) {
        let rawLink = (match[1] || match[3] || '').split('|')[0].split('#')[0];
        rawLink = normalize(rawLink.replace(/\s+["'].*?["']$/, ''));

        if (allFilesMap.has(rawLink)) {
          const targetId = String(allFilesMap.get(rawLink)!._id);
          linkTargets.add(targetId);
        }
      }

      const allTargetIds = [...Array.from(tags), ...Array.from(linkTargets)];

      let nodesChanged = false;

      allTargetIds.forEach(targetId => {
        if (!activeNodeMap.has(targetId)) {
          if (targetId.startsWith('tag-')) {
            const newTagNode = {
              _id: targetId,
              title: '#' + targetId.replace('tag-', ''),
              type: 'tag',
              x: (Math.random() - 0.5) * 200,
              y: (Math.random() - 0.5) * 200,
              vx: 0,
              vy: 0,
              radius: 10,
            } as unknown as GraphNode;

            currentNodes.push(newTagNode);
            activeNodeMap.set(targetId, newTagNode);
            nodesChanged = true;
          } else {
            const missingFile = data.d3Nodes.find(n => String(n._id) === targetId);
            if (missingFile) {
              const newFileNode = { ...missingFile, x: 0, y: 0, vx: 0, vy: 0, radius: 10 };
              currentNodes.push(newFileNode as GraphNode);
              activeNodeMap.set(targetId, newFileNode as GraphNode);
              nodesChanged = true;
            }
          }
        }
      });

      if (nodesChanged) {
        sim.nodes(currentNodes);
      }

      const newLinks: GraphLink[] = [];
      const seenLinks = new Set<string>();

      const linkForce = sim.force('link') as ForceLink<GraphNode, GraphLink> | undefined;
      if (linkForce) {
        const existingLinks = linkForce.links();
        existingLinks.forEach(l => {
          const sourceId = String(typeof l.source === 'object' ? l.source._id : l.source);
          const targetId = String(typeof l.target === 'object' ? l.target._id : l.target);

          if (sourceId !== safeNodeId && targetId !== safeNodeId) {
            const key = [sourceId, targetId].sort().join('-');
            if (!seenLinks.has(key)) {
              seenLinks.add(key);
              newLinks.push({ source: sourceId, target: targetId });
            }
          }
        });
      }

      allTargetIds.forEach(targetId => {
        const key = [safeNodeId, targetId].sort().join('-');
        if (!seenLinks.has(key)) {
          seenLinks.add(key);
          newLinks.push({ source: safeNodeId, target: targetId });
        }
      });

      if (linkForce) {
        linkForce.links(newLinks);
      }

      sim.alpha(0.3).restart();
    };

    window.addEventListener('ping-graph-update', handlePing as EventListener);
    return () => {
      window.removeEventListener('ping-graph-update', handlePing as EventListener);
    };
  }, [data]);

  if (isLoading)
    return (
      <div className="h-full bg-background flex items-center justify-center text-muted-foreground animate-pulse">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-xs font-mono tracking-tighter uppercase">Initializing Graph...</span>
        </div>
      </div>
    );

  return (
    <div className="relative h-full w-full overflow-hidden select-none">
      <div className="absolute top-6 left-6 z-20 flex flex-col items-start gap-2">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-white/70"
        >
          <Settings className={`w-5 h-5 ${showSettings ? 'rotate-90' : ''} transition-transform duration-300`} />
        </button>

        {showSettings && (
          <div className="w-64 bg-background/90 backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-3 border-b border-white/5">
              <span className="text-[11px] font-bold uppercase tracking-widest text-white/50">Graph Settings</span>
              <div className="flex gap-2">
                <button onClick={handleReset} className="p-1 hover:text-blue-400 text-white/30 transition-colors">
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setShowSettings(false)} className="p-1 hover:text-red-400 text-white/30 transition-colors">
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
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          placeholder={showTags ? 'Search tags...' : 'Search files...'}
                          className="w-full bg-white/5 border border-white/10 rounded py-1.5 pl-9 pr-8 text-xs text-white outline-none focus:border-accent focus:ring-1 focus:ring-accent/70 transition-all"
                        />
                        {searchQuery && (
                          <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-xs font-medium text-white/70">Tags</span>
                          <button
                            onClick={() => {
                              setShowTags(!showTags);
                              setSearchQuery('');
                            }}
                            className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors focus:outline-none ${
                              showTags ? 'bg-blue-500' : 'bg-white/10'
                            }`}
                          >
                            <span
                              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                showTags ? 'translate-x-4' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>

                        <div className="flex items-center justify-between px-1">
                          <span className="text-xs font-medium text-white/70">Orphans</span>
                          <button
                            onClick={() => setShowOrphans(!showOrphans)}
                            className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors focus:outline-none ${
                              showOrphans ? 'bg-blue-500' : 'bg-white/10'
                            }`}
                          >
                            <span
                              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                showOrphans ? 'translate-x-4' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {expandedCategory === cat && cat === 'Forces' && (
                    <div className="p-3 pt-0 animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col gap-5 mt-2">
                      {/* Center Force */}
                      <div className="flex flex-col gap-3 group/slider">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider">Center force</span>
                          <span className="text-[10px] font-mono text-blue-400 opacity-0 group-hover/slider:opacity-100 transition-opacity">
                            {centerForce.toFixed(2)}
                          </span>
                        </div>
                        <Slider value={[centerForce]} onValueChange={v => setCenterForce(v[0])} min={0} max={2} step={0.01} />
                      </div>

                      {/* Repel Force */}
                      <div className="flex flex-col gap-3 group/slider">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider">Repel force</span>
                          <span className="text-[10px] font-mono text-blue-400 opacity-0 group-hover/slider:opacity-100 transition-opacity">
                            {repelForce}
                          </span>
                        </div>
                        <Slider value={[repelForce]} onValueChange={v => setRepelForce(v[0])} max={200} step={1} />
                      </div>

                      {/* Link Force */}
                      <div className="flex flex-col gap-3 group/slider">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider">Link force</span>
                          <span className="text-[10px] font-mono text-blue-400 opacity-0 group-hover/slider:opacity-100 transition-opacity">
                            {linkForce.toFixed(2)}
                          </span>
                        </div>
                        <Slider value={[linkForce]} onValueChange={v => setLinkForce(v[0])} max={1} step={0.05} />
                      </div>

                      {/* Link Distance */}
                      <div className="flex flex-col gap-3 group/slider">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-white/50 uppercase tracking-wider">Link distance</span>
                          <span className="text-[10px] font-mono text-blue-400 opacity-0 group-hover/slider:opacity-100 transition-opacity">
                            {linkDistance}
                          </span>
                        </div>
                        <Slider value={[linkDistance]} onValueChange={v => setLinkDistance(v[0])} min={30} max={500} step={1} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="block cursor-crosshair outline-none" />

      <div className="absolute bottom-6 left-6 flex items-end gap-4 pointer-events-none z-10">
        <div className="flex flex-col gap-1 border-l border-blue-500/50 pl-4 py-1 bg-background/20 backdrop-blur-sm rounded-r-md">
          <h2 className="text-[10px] font-bold text-blue-400/80 uppercase tracking-[0.2em]">Database Index</h2>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-light tracking-tighter text-white/90">{filteredNodes.length}</span>
            <span className="text-[10px] text-white/30 uppercase font-medium tracking-widest">Visible Nodes</span>
          </div>
        </div>

        <div className="mb-1 flex items-center gap-2 bg-white/5 px-2 py-1 rounded-md border border-white/5 backdrop-blur-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[9px] text-white/40 font-mono uppercase tracking-tight">Synced</span>
        </div>
      </div>
    </div>
  );
}

export default React.memo(GraphViewSection, (prevProps, nextProps) => {
  return prevProps.activeTabId === nextProps.activeTabId;
});
