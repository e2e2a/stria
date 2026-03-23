'use client';

import React, { useEffect, useMemo, useRef, useDeferredValue } from 'react';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, Simulation } from 'd3-force';
import * as d3Zoom from 'd3-zoom';
import * as d3Drag from 'd3-drag';
import { select } from 'd3-selection';
import { useNodesProjectIdQuery } from '@/hooks/node/useNodeQuery';
import { flattenNodeTree } from '@/utils/client/node-utils';
import { useTabStore } from '@/features/editor/stores/tabs';
import { useNodeStore } from '@/features/editor/stores/nodes';

const getRandomPos = () => (Math.random() - 0.5) * 2000;

/* ===================== TYPES ===================== */
type GraphNode = {
  _id: string;
  title: string;
  path?: string;
  content?: string | null;
  type: 'file';
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx?: number | null;
  fy?: number | null;
  radius: number;
  [key: string]: unknown;
};

type GraphLink = {
  source: GraphNode;
  target: GraphNode;
};

function GraphViewSection({ projectId }: { projectId: string; activeTabId: string | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const transformRef = useRef(d3Zoom.zoomIdentity);
  const simRef = useRef<Simulation<GraphNode, GraphLink> | null>(null);
  const hoveredNodeIdRef = useRef<string | null>(null);

  const { data, isLoading } = useNodesProjectIdQuery(projectId);
  const deferredNodes = useDeferredValue(data?.nodes || []);
  const flattened = flattenNodeTree(deferredNodes);
  const { d3Nodes, d3Links, adjacency } = useMemo(() => {
    const LINK_REGEX = /\[\[([^\]]+)\]\]|\[([^\]]+)\]\(([^)]+)\)/g;

    const normalize = (p: string | undefined | null): string => {
      if (!p) return '';
      return decodeURIComponent(p).replace(/\\/g, '/').replace(/\.md$/i, '').toLowerCase().trim();
    };

    const getBasename = (p: string) => p.split('/').pop() || '';

    const resolveRelative = (basePath: string, linkPath: string) => {
      const parts = basePath.replace(/\\/g, '/').split('/');
      parts.pop();
      const linkParts = linkPath.replace(/\\/g, '/').split('/');

      for (const part of linkParts) {
        if (part === '.') continue;
        if (part === '..') parts.pop();
        else parts.push(part);
      }
      return normalize(parts.join('/'));
    };

    const nodesArr: GraphNode[] = flattened
      .filter(n => n.type === 'file')
      .map(n => ({
        ...n,
        type: 'file' as const,
        x: getRandomPos(),
        y: getRandomPos(),
        vx: 0,
        vy: 0,
        radius: 10,
      }));

    const fullPathMap = new Map<string, GraphNode>();
    const nameMap = new Map<string, GraphNode>();

    nodesArr.forEach(n => {
      const full = normalize(n.path);
      const name = getBasename(full);
      fullPathMap.set(full, n);
      nameMap.set(name, n);
    });

    const linksArr: GraphLink[] = [];
    const adj = new Map<string, Set<string>>();
    nodesArr.forEach(n => adj.set(n._id, new Set<string>()));

    nodesArr.forEach(node => {
      if (!node.content) return;

      let match: RegExpExecArray | null;
      LINK_REGEX.lastIndex = 0;

      while ((match = LINK_REGEX.exec(node.content)) !== null) {
        const rawLink = (match[1] || match[3] || '').split('|')[0].split('#')[0];
        const normalizedPath = normalize(rawLink);
        const resolvedPath = normalizedPath.startsWith('.') ? resolveRelative(node.path || '', normalizedPath) : normalizedPath;

        const resolvedName = getBasename(resolvedPath);
        const target = fullPathMap.get(resolvedPath) || nameMap.get(resolvedName);

        if (target && target._id !== node._id) {
          if (!adj.get(node._id)?.has(target._id)) {
            linksArr.push({ source: node, target });
            adj.get(node._id)?.add(target._id);
            adj.get(target._id)?.add(node._id);
          }
        }
      }
    });

    nodesArr.forEach(n => {
      const connections = adj.get(n._id)?.size || 0;
      n.radius = connections > 20 ? 25 : connections > 10 ? 18 : connections > 3 ? 14 : 10;
    });

    return { d3Nodes: nodesArr, d3Links: linksArr, adjacency: adj };
  }, [flattened]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || d3Nodes.length === 0) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let isMoving = false; // Flag to distinguish click from drag

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const simulation = forceSimulation<GraphNode>(d3Nodes)
      .alphaDecay(0.05)
      .alphaMin(0.001)
      .force('link', forceLink<GraphNode, GraphLink>(d3Links).distance(180).strength(0.1))
      .force('charge', forceManyBody<GraphNode>().strength(-400).distanceMax(1000))
      .force(
        'collision',
        forceCollide<GraphNode>()
          .radius(d => d.radius * 1.5)
          .iterations(1)
      )
      .force('center', forceCenter(canvas.width / 2, canvas.height / 2))
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

    // --- CLICK HANDLER ---
    canvas.onclick = e => {
      if (isMoving) return; // Ignore if it was a drag

      const coords = getWorldCoords(e.clientX, e.clientY);
      const hit = d3Nodes.find(n => {
        const dx = n.x - coords.x;
        const dy = n.y - coords.y;
        return dx * dx + dy * dy < n.radius * n.radius;
      });

      if (hit) {
        const node = flattened.find(n => n._id === hit._id);
        if (!node) return;

        useTabStore.getState().openTab(projectId, node, true);
        useNodeStore.getState().setActiveNode(node._id);
      }
    };

    const zoomBehavior = d3Zoom
      .zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([0.01, 8])
      .filter(event => {
        const coords = getWorldCoords(event.clientX, event.clientY);
        const hit = d3Nodes.find(n => {
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
        return d3Nodes.find(n => {
          const dx = n.x - coords.x;
          const dy = n.y - coords.y;
          return dx * dx + dy * dy < n.radius * n.radius;
        });
      })
      .on('start', event => {
        isMoving = false; // Reset on start
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      })
      .on('drag', event => {
        isMoving = true; // Mark as drag if mouse moves
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

    const sel = select(canvas);
    sel.call(zoomBehavior).call(dragBehavior);

    canvas.onmousemove = e => {
      const coords = getWorldCoords(e.clientX, e.clientY);
      const hit = d3Nodes.find(n => {
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
      const neighbors = hoverId ? adjacency.get(hoverId) : null;

      // COLORS
      const COLOR_PRIMARY = 'oklch(0.5337 0.2808 293.24)';
      const COLOR_NEIGHBOR = '#60a5fa';
      const COLOR_IDLE = 'rgba(200, 200, 200, 0.8)';
      const COLOR_MUTED = 'rgba(255, 255, 255, 0.05)';

      ctx.fillStyle = 'oklch(0.2293 0.0153 264.2095)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.scale(t.k, t.k);

      // Draw Links
      for (const l of d3Links) {
        const isRelated = hoverId && (l.source._id === hoverId || l.target._id === hoverId);
        ctx.beginPath();
        ctx.moveTo(l.source.x, l.source.y);
        ctx.lineTo(l.target.x, l.target.y);
        ctx.strokeStyle = hoverId ? (isRelated ? COLOR_NEIGHBOR : 'rgba(255, 255, 255, 0.01)') : 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = isRelated ? 2 / t.k : 0.8 / t.k;
        ctx.stroke();
      }

      // Draw Nodes
      for (const n of d3Nodes) {
        const isMain = hoverId === n._id;
        const isNeighbor = neighbors?.has(n._id);

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, 2 * Math.PI);

        if (!hoverId) {
          ctx.fillStyle = COLOR_IDLE;
        } else if (isMain) {
          ctx.fillStyle = COLOR_PRIMARY;
        } else if (isNeighbor) {
          ctx.fillStyle = COLOR_NEIGHBOR;
        } else {
          ctx.fillStyle = COLOR_MUTED;
        }

        if (isMain || (isNeighbor && n.radius >= 18)) {
          ctx.shadowBlur = 15;
          ctx.shadowColor = isMain ? COLOR_PRIMARY : COLOR_NEIGHBOR;
        }
        ctx.fill();
        ctx.shadowBlur = 0;

        // Labels
        if (t.k > 0.8 || (t.k <= 0.8 && isMain)) {
          const showLabel = !hoverId || isMain || isNeighbor;
          if (showLabel) {
            const isBig = isMain && t.k <= 0.8;
            const fontSize = isBig ? 22 / t.k : 12 / t.k;
            ctx.font = `${isMain ? 'bold' : 'normal'} ${fontSize}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillStyle = isMain ? '#ffffff' : isNeighbor ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)';
            ctx.fillText(n.title, n.x, n.y + n.radius + (isBig ? 35 : 15) / t.k);
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
  }, [d3Nodes, d3Links, adjacency, projectId, flattened]);

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
    <div className="relative h-full w-full bg-background overflow-hidden select-none">
      <canvas ref={canvasRef} className="block cursor-crosshair outline-none" />

      <div className="absolute bottom-6 left-6 flex items-end gap-4 pointer-events-none">
        <div className="flex flex-col gap-1 border-l border-blue-500/50 pl-4 py-1">
          <h2 className="text-[10px] font-bold text-blue-400/80 uppercase tracking-[0.2em]">Database Index</h2>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-light tracking-tighter text-white/90">{d3Nodes.length}</span>
            <span className="text-[10px] text-white/30 uppercase font-medium tracking-widest">Mapped Nodes</span>
          </div>
        </div>

        <div className="mb-1 flex items-center gap-2 bg-white/5 px-2 py-1 rounded-md border border-white/5 backdrop-blur-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[9px] text-white/40 font-mono uppercase tracking-tight">Synced</span>
        </div>
      </div>

      <div className="absolute top-6 right-6 flex flex-col gap-2">{/* You can put a 'Recenter' button here later */}</div>
    </div>
  );
}

export default React.memo(GraphViewSection, (prevProps, nextProps) => {
  return prevProps.activeTabId === nextProps.activeTabId;
});
