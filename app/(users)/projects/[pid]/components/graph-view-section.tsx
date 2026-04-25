'use client';

import React, { useEffect, useRef, useState } from 'react';
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
import { useTabStore } from '@/features/editor/stores/tabs';
import { useNodeStore } from '@/features/editor/stores/nodes';
import { GraphNode, GraphViewResponse } from '@/lib/client/api/projectClient';
import { INode } from '@/types';
import { GraphSettings } from './graph-settings';
import { useFilteredGraph } from '@/utils/client/use-filtered-graph';
import { normalizeGraphPath } from '@/utils/client/graph-helpers';

type GraphLink = {
  source: string | GraphNode;
  target: string | GraphNode;
};

function GraphViewSection({
  projectId,
  data,
  isLoading,
}: {
  projectId: string;
  data: GraphViewResponse | undefined;
  isLoading: boolean;
  activeTabId: string | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const transformRef = useRef(d3Zoom.zoomIdentity);
  const simRef = useRef<Simulation<GraphNode, GraphLink> | null>(null);
  const hoveredNodeIdRef = useRef<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const [showOrphans, setShowOrphans] = useState(true);
  const [showTags, setShowTags] = useState(false);

  const [centerForce, setCenterForce] = useState(1);
  const [repelForce, setRepelForce] = useState(1000);
  const [linkForce, setLinkForce] = useState(1);
  const [linkDistance, setLinkDistance] = useState(200);

  const handleReset = () => {
    setSearchQuery('');
    setShowOrphans(true);
    setShowTags(false);
    setCenterForce(1);
    setRepelForce(1000);
    setLinkForce(1);
    setLinkDistance(200);
  };

  const { filteredNodes, filteredLinks, adjacency } = useFilteredGraph(data, searchQuery, showOrphans, showTags);

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
      const styles = getComputedStyle(document.documentElement);
      const accent = styles.getPropertyValue('--editor-accent-color').trim();
      const font = styles.getPropertyValue('--editor-font-text').trim();
      const bg = styles.getPropertyValue('--background').trim();
      const mutedForeground = styles.getPropertyValue('--muted-foreground').trim();
      const foreground = styles.getPropertyValue('--foreground').trim();

      const COLOR_PRIMARY = accent;
      const COLOR_NEIGHBOR = mutedForeground;
      const COLOR_TAG = '#fbbf24';
      const COLOR_IDLE = `color-mix(in oklch, ${foreground} 50%, transparent)`;
      const COLOR_MUTED = `color-mix(in oklch, ${mutedForeground} 50%, transparent)`;

      ctx.fillStyle = bg;
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
          ctx.strokeStyle = isRelated ? (isTagLink ? COLOR_TAG : accent) : COLOR_MUTED;
        } else {
          ctx.strokeStyle = COLOR_MUTED;
        }

        ctx.lineWidth = isRelated ? 0.5 / t.k : 0.25 / t.k;
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
            ctx.font = `${isMain ? 'bold' : 'normal'} ${fontSize}px ${font}`;
            ctx.textAlign = 'center';

            if (isMain) {
              ctx.fillStyle = foreground;
            } else if (isNeighbor) {
              ctx.fillStyle = isTag ? COLOR_TAG : foreground;
            } else {
              ctx.fillStyle = COLOR_MUTED;
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

      if (!simRef.current || !data || !data.d3Nodes) return;

      const sim = simRef.current;
      const currentNodes = sim.nodes();

      const allFilesMap = new Map<string, GraphNode>();
      data.d3Nodes.forEach(n => allFilesMap.set(normalizeGraphPath(n.title), n));

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
        rawLink = normalizeGraphPath(rawLink.replace(/\s+["'].*?["']$/, ''));

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

      if (nodesChanged) sim.nodes(currentNodes);

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
          <div className="w-8 h-8 border-2 border-(--editor-accent-color/30 border-t-(--editor-accent-color) rounded-full animate-spin" />
          <span className="text-xs font-mono tracking-tighter uppercase">Initializing Graph...</span>
        </div>
      </div>
    );

  return (
    <div className="relative h-full w-full overflow-hidden select-none">
      <GraphSettings
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showTags={showTags}
        setShowTags={setShowTags}
        showOrphans={showOrphans}
        setShowOrphans={setShowOrphans}
        centerForce={centerForce}
        setCenterForce={setCenterForce}
        repelForce={repelForce}
        setRepelForce={setRepelForce}
        linkForce={linkForce}
        setLinkForce={setLinkForce}
        linkDistance={linkDistance}
        setLinkDistance={setLinkDistance}
        handleReset={handleReset}
      />

      <canvas ref={canvasRef} className="block cursor-crosshair outline-none" />

      <div className="absolute bottom-6 left-6 flex items-end gap-4 pointer-events-none z-10">
        <div className="flex flex-col gap-1 border-l border-(--editor-accent-color)/50 pl-4 py-1 bg-background/20 backdrop-blur-sm rounded-r-md">
          <h2 className="text-[10px] font-bold text-(--editor-accent-color) uppercase tracking-[0.2em]">Database Index</h2>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-light tracking-tighter text-foreground">{filteredNodes.length}</span>
            <span className="text-[10px] text-muted-foreground uppercase font-medium tracking-widest">Visible Nodes</span>
          </div>
        </div>

        <div className="mb-1 flex items-center gap-2 bg-secondary/50 px-2 py-1 rounded-md border border-white/5 backdrop-blur-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-(--editor-accent-color) animate-pulse" />
          <span className="text-[9px] text-muted-foreground font-mono uppercase tracking-tight">Synced</span>
        </div>
      </div>
    </div>
  );
}

export default React.memo(GraphViewSection, (prevProps, nextProps) => {
  return prevProps.activeTabId === nextProps.activeTabId;
});
