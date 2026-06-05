import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { useOverviewStore, OverviewNode } from '../../stores/useOverviewStore';
import { SidebarContextPortal } from '../Core/AppSidebar/SidebarContextPortal';
import { SidebarGroup, SidebarGroupLabel, SidebarGroupContent } from '../Core/ui/sidebar';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '../Core/ui/collapsible';
import { Button } from '../Core/ui/button';
import * as Icons from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';

import GridNode from './GridNode';
import OverviewSidebar from './OverviewSidebar';
import { 
  findPath, getPhysicalCoordinate, getEdgeAnchor, 
  bestSide, getRoutingGridPoint, roundedPathFromPoints, 
  Point
} from './routing';
import { CABLE_COLORS, DEFAULT_CABLE_COLOR } from '../../devices/cables';

const CELL_W = 280;
const CELL_H = 220;
const MARGIN = 60;

/**
 * Convert old-format layout nodes (x/y pixel coords) to new gridX/gridY format.
 */
function migrateNodesToGrid(oldNodes: Record<string, any>): Record<string, OverviewNode> {
  const entries = Object.entries(oldNodes);
  if (entries.length === 0) return {};

  const firstNode = entries[0]![1];
  if (firstNode && typeof firstNode.gridX === 'number') {
    return oldNodes as Record<string, OverviewNode>;
  }

  const sorted = entries.sort(([, a], [, b]) => {
    const rowA = Math.round((a.y ?? 0) / 300);
    const rowB = Math.round((b.y ?? 0) / 300);
    if (rowA !== rowB) return rowA - rowB;
    return (a.x ?? 0) - (b.x ?? 0);
  });

  const gridSize = Math.max(3, Math.ceil(Math.sqrt(sorted.length)));
  const result: Record<string, OverviewNode> = {};

  sorted.forEach(([id, node], idx) => {
    result[id] = {
      id: node.id,
      type: node.type,
      gridX: idx % gridSize,
      gridY: Math.floor(idx / gridSize),
      zIndex: node.zIndex ?? 1,
      isExpanded: node.isExpanded,
      isHardwareExpanded: node.isHardwareExpanded,
      overview: node.overview,
      logicalInChannel: node.logicalInChannel,
      logicalOutChannel: node.logicalOutChannel,
      circuitLogicalOuts: node.circuitLogicalOuts,
    };
  });

  return result;
}

function migrateConnections(oldConns: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [id, conn] of Object.entries(oldConns)) {
    const { startOffset, endOffset, midPoint, ...rest } = conn;
    result[id] = rest;
  }
  return result;
}

export default function OverviewTab() {
  const { 
    nodes, connections, gridSize, setGridSize, 
    selectedNodeId, setSelectedNodeId,
    setNodes, setConnections
  } = useOverviewStore();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const { setActiveMainView, sidebarSectionStates, setSidebarSectionState } = useUIStore();
  
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragHoverNodeId, setDragHoverNodeId] = useState<string | null>(null);

  // === DRAG PREVIEW STATE ===
  const previewNodes = useMemo(() => {
    if (!draggedNodeId || !dragHoverNodeId || draggedNodeId === dragHoverNodeId) return nodes;
    
    const newNodes = { ...nodes };
    const dragged = newNodes[draggedNodeId];
    const hover = newNodes[dragHoverNodeId];
    
    if (dragged && hover) {
      const draggedCopy = { ...dragged };
      const hoverCopy = { ...hover };
      
      const tempX = draggedCopy.gridX;
      const tempY = draggedCopy.gridY;
      draggedCopy.gridX = hoverCopy.gridX;
      draggedCopy.gridY = hoverCopy.gridY;
      hoverCopy.gridX = tempX;
      hoverCopy.gridY = tempY;
      
      newNodes[draggedNodeId] = draggedCopy;
      newNodes[dragHoverNodeId] = hoverCopy;
    }
    return newNodes;
  }, [nodes, draggedNodeId, dragHoverNodeId]);

  // === DATA LOADING ===
  const hardcodedLayouts = useMemo(() => {
    const modules = import.meta.glob('../../../layouts/*.json', { eager: true });
    return Object.values(modules).map((mod: any) => mod.default || mod);
  }, []);

  useEffect(() => {
    if (Object.keys(nodes).length > 0) return;

    const savedNodes = localStorage.getItem('alienmind_nodes_v5');
    const savedConns = localStorage.getItem('alienmind_connections_v5');

    if (savedNodes && savedConns) {
      try {
        setNodes(() => migrateNodesToGrid(JSON.parse(savedNodes)));
        setConnections(() => migrateConnections(JSON.parse(savedConns)));
        return;
      } catch (e) {
        console.error("Failed to load saved layout", e);
      }
    }

    const oldNodes = localStorage.getItem('alienmind_nodes_v4');
    const oldConns = localStorage.getItem('alienmind_connections_v4');
    if (oldNodes && oldConns) {
      try {
        setNodes(() => migrateNodesToGrid(JSON.parse(oldNodes)));
        setConnections(() => migrateConnections(JSON.parse(oldConns)));
        return;
      } catch (e) {
        console.error("Failed to load old layout", e);
      }
    }

    if (hardcodedLayouts.length > 0) {
      const layout = hardcodedLayouts[0];
      setNodes(() => migrateNodesToGrid(layout.nodes));
      setConnections(() => migrateConnections(layout.connections));
    }
  }, [hardcodedLayouts]);

  // === MINIMUM GRID SIZE ===
  // Never allow the grid to be smaller than what's needed to show all devices
  const nodeCount = Object.keys(nodes).length;
  const minGridSize = useMemo(() => Math.max(2, Math.ceil(Math.sqrt(nodeCount))), [nodeCount]);
  const effectiveGridSize = Math.max(gridSize, minGridSize);

  // === LAYOUT SIZING ===
  useEffect(() => {
    const measure = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const totalGridW = effectiveGridSize * CELL_W + (effectiveGridSize + 1) * MARGIN;
  const totalGridH = effectiveGridSize * CELL_H + (effectiveGridSize + 1) * MARGIN;
  
  const zoom = useMemo(() => {
    if (containerSize.width === 0 || containerSize.height === 0) return 1;
    const zoomX = containerSize.width / totalGridW;
    const zoomY = containerSize.height / totalGridH;
    return Math.min(zoomX, zoomY);
  }, [containerSize, totalGridW, totalGridH]);

  const panX = (containerSize.width - totalGridW * zoom) / 2;
  const panY = (containerSize.height - totalGridH * zoom) / 2;

  // Handle discrete zooming via Ctrl+Scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (e.deltaY > 0) {
          // Zoom out = more cells
          setGridSize(Math.min(10, effectiveGridSize + 1));
        } else if (e.deltaY < 0) {
          // Zoom in = fewer cells, but never below minimum
          setGridSize(Math.max(minGridSize, effectiveGridSize - 1));
        }
      }
    };
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [effectiveGridSize, minGridSize, setGridSize]);

  // === CABLE ROUTING ===
  const paths = useMemo(() => {
    const computed: { id: string; d: string; color: string }[] = [];
    
    Object.values(connections).forEach((conn) => {
      const source = previewNodes[conn.source];
      const target = previewNodes[conn.target];
      if (!source || !target) return;
      // Skip if either device is outside the visible grid
      if (source.gridX >= effectiveGridSize || source.gridY >= effectiveGridSize) return;
      if (target.gridX >= effectiveGridSize || target.gridY >= effectiveGridSize) return;

      // Determine best sides based on relative position
      const { sourceSide, targetSide } = bestSide(source.gridX, source.gridY, target.gridX, target.gridY);

      // Get routing grid points (in the margin lanes)
      const startRP = getRoutingGridPoint(source.gridX, source.gridY, sourceSide);
      const endRP = getRoutingGridPoint(target.gridX, target.gridY, targetSide);

      // Find path through margin lanes
      const pathGrid = findPath(startRP, endRP, effectiveGridSize, effectiveGridSize);
      if (!pathGrid || pathGrid.length === 0) return;

      // Build physical points: 
      // Start with the edge anchor on the source device
      const anchorStart = getEdgeAnchor(source.gridX, source.gridY, sourceSide, CELL_W, CELL_H, MARGIN);
      const anchorEnd = getEdgeAnchor(target.gridX, target.gridY, targetSide, CELL_W, CELL_H, MARGIN);
      
      // Convert routing grid path to physical coordinates
      const routePoints = pathGrid.map(p => getPhysicalCoordinate(p.rx, p.ry, CELL_W, CELL_H, MARGIN));
      
      // Full path: anchor -> route -> anchor
      const fullPoints: Point[] = [anchorStart, ...routePoints, anchorEnd];
      
      const d = roundedPathFromPoints(fullPoints, 12);
      
      // Match cable color by type (longest match first since keys are ordered by specificity)
      let color = DEFAULT_CABLE_COLOR;
      if (conn.type) {
        for (const [key, val] of Object.entries(CABLE_COLORS)) {
          if (conn.type.includes(key)) {
            color = val;
            break;
          }
        }
      }

      computed.push({ id: conn.id, d, color });
    });
    
    return computed;
  }, [previewNodes, connections, effectiveGridSize]);

  // === INTERACTION ===
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as Element).closest('.grid-node-container')) return;
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedNodeId(id);
    setDragHoverNodeId(null);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedNodeId && id !== draggedNodeId && id !== dragHoverNodeId) {
      setDragHoverNodeId(id);
    }
  };

  const handleDragLeave = () => {
    // Optional: we can clear dragHoverNodeId here if needed, but keeping it 
    // prevents flickering when moving between tightly packed cells.
  };

  const handleDragEnd = () => {
    setDraggedNodeId(null);
    setDragHoverNodeId(null);
  };

  const handleDrop = (e: React.DragEvent, targetNodeId: string) => {
    e.preventDefault();
    if (!draggedNodeId || draggedNodeId === targetNodeId) {
      handleDragEnd();
      return;
    }

    setNodes((prev) => {
      const newNodes = { ...prev };
      const draggedNode = newNodes[draggedNodeId];
      const targetNode = newNodes[targetNodeId];
      
      if (!draggedNode || !targetNode) return prev;

      const dragged = { ...draggedNode };
      const target = { ...targetNode };

      // Swap coordinates
      const tempX = dragged.gridX;
      const tempY = dragged.gridY;
      dragged.gridX = target.gridX;
      dragged.gridY = target.gridY;
      target.gridX = tempX;
      target.gridY = tempY;

      newNodes[draggedNodeId] = dragged;
      newNodes[targetNodeId] = target;
      return newNodes;
    });
    handleDragEnd();
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-neutral-950 overflow-hidden relative font-sans text-white">
      
      {/* Sidebar Integrations */}
      <SidebarContextPortal>
        <Collapsible 
          open={sidebarSectionStates['overview-grid'] ?? true}
          onOpenChange={(isOpen) => setSidebarSectionState('overview-grid', isOpen)}
          className="group/collapsible"
        >
          <SidebarGroup>
            <SidebarGroupLabel render={<CollapsibleTrigger className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer flex items-center justify-between w-full" />}>
              Grid Settings
              <Icons.ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <div className="flex flex-col gap-2 px-2 mt-2">
                  <div className="flex justify-between items-center text-xs text-neutral-400 px-1">
                    <span>Grid Size</span>
                    <span className="font-bold text-white">{effectiveGridSize}×{effectiveGridSize}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="secondary" className="flex-1" 
                      disabled={effectiveGridSize <= minGridSize}
                      onClick={() => setGridSize(Math.max(minGridSize, effectiveGridSize - 1))}
                    >
                      <Icons.ZoomIn size={16} className="mr-1" /> Zoom In
                    </Button>
                    <Button 
                      variant="secondary" className="flex-1" 
                      disabled={effectiveGridSize >= 10}
                      onClick={() => setGridSize(Math.min(10, effectiveGridSize + 1))}
                    >
                      <Icons.ZoomOut size={16} className="mr-1" /> Zoom Out
                    </Button>
                  </div>
                  <p className="text-[10px] text-neutral-500 px-1">
                    Ctrl+Scroll to zoom. {nodeCount} device{nodeCount !== 1 ? 's' : ''} on grid.
                    {effectiveGridSize <= minGridSize && <span className="text-amber-500 ml-1">(min size for {nodeCount} devices)</span>}
                  </p>
                </div>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContextPortal>

      {/* Main Canvas Area */}
      <div 
        ref={containerRef}
        className="flex-1 relative overflow-hidden cursor-default"
        style={{ background: 'radial-gradient(circle at 50% 50%, #1a1a2e 0%, #0d0d14 100%)' }}
        onClick={handleCanvasClick}
      >
        {/* Subtle dot grid background */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
            backgroundPosition: `${panX}px ${panY}px`
          }}
        />

        {/* Transform Container */}
        <div 
          className="absolute origin-top-left"
          style={{ 
            transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
            width: totalGridW,
            height: totalGridH,
            transition: 'transform 0.3s ease-out'
          }}
        >
          {/* SVG Routing Layer */}
          <svg 
            className="absolute inset-0 pointer-events-none z-0" 
            width={totalGridW} 
            height={totalGridH}
          >
            <defs>
              <filter id="cableGlow">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over"/>
              </filter>
            </defs>
            {paths.map(path => (
              <path 
                key={path.id} 
                d={path.d} 
                fill="none" 
                stroke={path.color} 
                strokeWidth={3} 
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#cableGlow)"
                opacity={0.85}
              />
            ))}
          </svg>

          {/* Nodes Layer */}
          <div className="absolute inset-0 z-10">
            {Object.values(previewNodes).map(node => {
              if (node.gridX >= effectiveGridSize || node.gridY >= effectiveGridSize) return null;
              
              const isDragged = draggedNodeId === node.id;
              const isHovered = dragHoverNodeId === node.id && draggedNodeId !== null;
              
              return (
                <div 
                  key={node.id} 
                  draggable
                  onDragStart={(e) => handleDragStart(e, node.id)}
                  onDragEnd={handleDragEnd}
                  className={`grid-node-container absolute 
                    ${isDragged ? 'opacity-0 scale-95 z-20 pointer-events-none' : ''}
                    ${isHovered ? 'opacity-80 scale-[1.02] ring-2 ring-cyan-500/50' : ''}
                  `}
                  style={{ 
                    left: MARGIN + node.gridX * (CELL_W + MARGIN), 
                    top: MARGIN + node.gridY * (CELL_H + MARGIN),
                    width: CELL_W,
                    height: CELL_H,
                    transition: 'left 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), top 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.2s ease, transform 0.2s ease'
                  }}
                >
                  <GridNode 
                    node={node} 
                    isSelected={selectedNodeId === node.id}
                    onSelect={() => setSelectedNodeId(node.id)}
                    onNavigate={() => setActiveMainView(node.type as any)}
                  />
                </div>
              );
            })}
          </div>

          {/* Stable Drop Zones Layer (Active only during drag) */}
          {draggedNodeId && (
            <div className="absolute inset-0 z-30">
              {Object.values(nodes).map(node => {
                if (node.gridX >= effectiveGridSize || node.gridY >= effectiveGridSize) return null;
                return (
                  <div 
                    key={`dropzone-${node.id}`}
                    onDragOver={(e) => handleDragOver(e, node.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, node.id)}
                    className="absolute"
                    style={{ 
                      left: MARGIN + node.gridX * (CELL_W + MARGIN), 
                      top: MARGIN + node.gridY * (CELL_H + MARGIN),
                      width: CELL_W,
                      height: CELL_H,
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Empty state */}
        {nodeCount === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-neutral-500">
              <Icons.LayoutGrid size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No devices on the grid</p>
              <p className="text-sm mt-1">Add devices from the sidebar to get started</p>
            </div>
          </div>
        )}
      </div>

      {/* Properties Sidebar (Overlay) */}
      <div className={`absolute left-0 top-0 h-full transition-transform duration-300 z-50 ${selectedNodeId ? 'translate-x-0' : '-translate-x-full'}`}>
        <OverviewSidebar onClose={() => setSelectedNodeId(null)} />
      </div>

    </div>
  );
}