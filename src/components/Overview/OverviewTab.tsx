import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { useOverviewStore, OverviewNode, OverviewConnection } from '../../stores/useOverviewStore';
import { SidebarContextPortal } from '../Core/AppSidebar/SidebarContextPortal';
import { SidebarGroup, SidebarGroupLabel, SidebarGroupContent } from '../Core/ui/sidebar';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '../Core/ui/collapsible';
import { Button } from '../Core/ui/button';
import * as Icons from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';

import GridNode from './GridNode';
import OverviewSidebar from './OverviewSidebar';
import { 
  findPath, getPhysicalCoordinate, getDistributedEdgeAnchor, 
  bestSide, getRoutingGridPoint, roundedPathFromPoints, 
  Point, MAX_CABLES_PER_SIDE
} from './routing';
import { CABLE_CATEGORIES, CABLE_COLORS, DEFAULT_CABLE_COLOR } from '../../devices/cables';
import NewDeviceModal from '../Core/NewDeviceModal/NewDeviceModal';
import { HARDWARE_LIBRARY } from '../../devices';
import PromptModal from '../Core/PromptModal/PromptModal';
import ConfirmModal from '../Core/ConfirmModal/ConfirmModal';
import OscilloscopeDrawer from '../Core/OscilloscopeDrawer/OscilloscopeDrawer';

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
    selectedConnectionId, setSelectedConnectionId, setCableDotNumbers,
    setNodes,
    routingMode, setRoutingMode,
    presetLayouts, loadPresetLayouts, applyLayout,
    customLayouts, saveCustomLayout, removeCustomLayout, loadCustomLayouts,
    clearLayout
  } = useOverviewStore();
  const [newDeviceOpen, setNewDeviceOpen] = useState(false);
  // === Cable legend lives in a grid cell, just like any device ===
  type LegendCell = { gridX: number; gridY: number; collapsed: boolean };
  const [legendCell, setLegendCell] = useState<LegendCell>(() => {
    try {
      const raw = localStorage.getItem('alienmind_legend_cell');
      if (raw) {
        const parsed = JSON.parse(raw) as LegendCell;
        if (typeof parsed?.gridX === 'number' && typeof parsed?.gridY === 'number') return parsed;
      }
    } catch {}
    return { gridX: 0, gridY: 0, collapsed: false };
  });
  const persistLegendCell = (cell: LegendCell) => {
    setLegendCell(cell);
    try { localStorage.setItem('alienmind_legend_cell', JSON.stringify(cell)); } catch {}
  };
  // Profile/layout modal state
  const [newProfileOpen, setNewProfileOpen] = useState(false);
  const [saveLayoutOpen, setSaveLayoutOpen] = useState(false);
  const [deleteProfileId, setDeleteProfileId] = useState<string | null>(null);
  const [clearGridOpen, setClearGridOpen] = useState(false);
  
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

  // Register built-in presets (e.g. "AlienMind Setup") but DO NOT auto-apply.
  // Default state is empty; user picks a preset or adds devices from the catalog.
  useEffect(() => {
    const alienMindPreset = hardcodedLayouts.map((layout: any) => ({
      id: layout.id ?? `preset_${layout.name ?? 'unnamed'}`,
      name: 'AlienMind',
      nodes: migrateNodesToGrid(layout.nodes ?? {}),
      connections: migrateConnections(layout.connections ?? {}),
    }));
    const presets = [
      { id: 'preset_default_empty', name: 'Default (empty)', nodes: {} as Record<string, OverviewNode>, connections: {} as Record<string, OverviewConnection> },
      ...alienMindPreset,
    ];
    loadPresetLayouts(presets);

    // Restore user's saved custom layouts (do NOT auto-apply any).
    let custom: typeof presets = [];
    try {
      const raw = localStorage.getItem('alienmind_custom_layouts_v5');
      if (raw) {
        custom = JSON.parse(raw);
        loadCustomLayouts(custom);
      }
    } catch (e) {
      console.error("Failed to load custom layouts", e);
    }

    // Restore the last active profile (if any). Only on first boot (nodes empty).
    if (Object.keys(nodes).length > 0) return;
    try {
      const activeId = localStorage.getItem('alienmind_active_profile');
      if (!activeId) return;
      const all = [...presets, ...custom];
      const match = all.find(p => p.id === activeId);
      if (match) applyLayout(match.nodes, match.connections, match.id);
    } catch (e) {
      console.error("Failed to restore active profile", e);
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

  // Reserve space for the properties drawer (320px = w-80) on the RIGHT
  // so the grid never sits behind it.
  const SIDEBAR_W = 320;
  const sidebarOffset = selectedNodeId ? SIDEBAR_W : 0;

  const zoom = useMemo(() => {
    if (containerSize.width === 0 || containerSize.height === 0) return 1;
    const availW = Math.max(1, containerSize.width - sidebarOffset);
    const zoomX = availW / totalGridW;
    const zoomY = containerSize.height / totalGridH;
    return Math.min(zoomX, zoomY);
  }, [containerSize, totalGridW, totalGridH, sidebarOffset]);

  const availW = Math.max(1, containerSize.width - sidebarOffset);
  const panX = (availW - totalGridW * zoom) / 2;
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

  // === CABLE ROUTING (orthogonal — only 90deg turns, parallel-lane offsetting) ===
  const { paths, dots, connDotMap } = useMemo(() => {
    type Side = 'left' | 'right' | 'top' | 'bottom';
    interface CableEndpoint { connId: string; deviceId: string; role: 'source' | 'target'; side: Side }

    // In LOGICAL mode the connections array is ignored; instead synthesise
    // edges from devices that share a MIDI channel. Omni ('*') devices both
    // listen to everything and broadcast to everything; we deliberately do NOT
    // render those wires (would explode the canvas).
    type ConnLike = { id: string; source: string; target: string; type: string };

    // Helper - collect the (trackId, out-channel) pairs that a device broadcasts on.
    // Falls back to the legacy logicalOutChannel field when no midiTracks are defined.
    const broadcastChannels = (node: OverviewNode): Array<{ trackId: string; ch: number | '*' }> => {
      const bp = HARDWARE_LIBRARY[node.type];
      const tracks = bp?.midiTracks ?? [];
      const out: Array<{ trackId: string; ch: number | '*' }> = [];
      if (tracks.length > 0) {
        for (const t of tracks) {
          if (t.direction === 'in') continue;
          const ch = node.midiTrackChannels?.[t.id]?.out;
          if (ch != null) out.push({ trackId: t.id, ch });
        }
      } else if (node.logicalOutChannel != null) {
        out.push({ trackId: 'default', ch: node.logicalOutChannel });
      }
      return out;
    };
    // Helper - collect the (trackId, in-channel) pairs that a device listens on.
    const listenChannels = (node: OverviewNode): Array<{ trackId: string; ch: number | '*' }> => {
      const bp = HARDWARE_LIBRARY[node.type];
      const tracks = bp?.midiTracks ?? [];
      const out: Array<{ trackId: string; ch: number | '*' }> = [];
      if (tracks.length > 0) {
        for (const t of tracks) {
          if (t.direction === 'out') continue;
          const ch = node.midiTrackChannels?.[t.id]?.in;
          if (ch != null) out.push({ trackId: t.id, ch });
        }
      } else if (node.logicalInChannel != null) {
        out.push({ trackId: 'default', ch: node.logicalInChannel });
      }
      return out;
    };

    const connList: ConnLike[] = routingMode === 'logical'
      ? (() => {
          const list: ConnLike[] = [];
          const arr = Object.values(previewNodes);
          for (const a of arr) {
            const aOuts = broadcastChannels(a);
            if (aOuts.length === 0) continue;
            for (const b of arr) {
              if (a.id === b.id) continue;
              const bIns = listenChannels(b);
              if (bIns.length === 0) continue;
              for (const ao of aOuts) {
                if (ao.ch === '*') continue; // omni broadcasters - don't render
                for (const bi of bIns) {
                  if (bi.ch === '*') continue; // omni listeners - don't render
                  if (ao.ch !== bi.ch) continue;
                  list.push({
                    id: `logical_${a.id}.${ao.trackId}_to_${b.id}.${bi.trackId}_ch${ao.ch}`,
                    source: a.id,
                    target: b.id,
                    type: `logical_ch${ao.ch}`,
                  });
                }
              }
            }
          }
          return list;
        })()
      : (Object.values(connections) as ConnLike[]);
    const endpoints: CableEndpoint[] = [];

    for (const conn of connList) {
      const src = previewNodes[conn.source];
      const tgt = previewNodes[conn.target];
      if (!src || !tgt) continue;
      if (src.gridX >= effectiveGridSize || src.gridY >= effectiveGridSize) continue;
      if (tgt.gridX >= effectiveGridSize || tgt.gridY >= effectiveGridSize) continue;
      const { sourceSide, targetSide } = bestSide(src.gridX, src.gridY, tgt.gridX, tgt.gridY);
      endpoints.push({ connId: conn.id, deviceId: conn.source, role: 'source', side: sourceSide });
      endpoints.push({ connId: conn.id, deviceId: conn.target, role: 'target', side: targetSide });
    }

    // Group + redistribute overflow
    const sideGroups = new Map<string, CableEndpoint[]>();
    for (const ep of endpoints) {
      const key = `${ep.deviceId}-${ep.side}`;
      if (!sideGroups.has(key)) sideGroups.set(key, []);
      sideGroups.get(key)!.push(ep);
    }
    const SIDES: Side[] = ['right', 'bottom', 'left', 'top'];
    for (const [, group] of sideGroups) {
      if (group.length <= MAX_CABLES_PER_SIDE) continue;
      const deviceId = group[0]!.deviceId;
      const overflow = group.splice(MAX_CABLES_PER_SIDE);
      for (const ep of overflow) {
        let placed = false;
        for (const alt of SIDES) {
          if (alt === ep.side) continue;
          const altKey = `${deviceId}-${alt}`;
          const altG = sideGroups.get(altKey);
          if (!altG || altG.length < MAX_CABLES_PER_SIDE) {
            ep.side = alt;
            if (!sideGroups.has(altKey)) sideGroups.set(altKey, []);
            sideGroups.get(altKey)!.push(ep);
            placed = true; break;
          }
        }
        if (!placed) group.push(ep);
      }
    }
    const anchorInfo = new Map<string, { side: Side; index: number; total: number }>();
    for (const [, group] of sideGroups) {
      group.forEach((ep, idx) => {
        anchorInfo.set(`${ep.connId}-${ep.role}`, { side: ep.side, index: idx, total: group.length });
      });
    }

    // First pass — compute grid paths and tally usage of each lane segment
    interface CableData {
      conn: typeof connList[number];
      anchorStart: Point;
      anchorEnd: Point;
      pathGrid: { rx: number; ry: number }[];
      routePoints: Point[];
      color: string;
    }
    const cables: CableData[] = [];
    const segmentTally = new Map<string, string[]>();
    const segKey = (a: { rx: number; ry: number }, b: { rx: number; ry: number }) => {
      const k1 = `${a.rx},${a.ry}`;
      const k2 = `${b.rx},${b.ry}`;
      return k1 < k2 ? `${k1}|${k2}` : `${k2}|${k1}`;
    };

    for (const conn of connList) {
      const src = previewNodes[conn.source];
      const tgt = previewNodes[conn.target];
      if (!src || !tgt) continue;
      if (src.gridX >= effectiveGridSize || src.gridY >= effectiveGridSize) continue;
      if (tgt.gridX >= effectiveGridSize || tgt.gridY >= effectiveGridSize) continue;
      const sa = anchorInfo.get(`${conn.id}-source`);
      const ta = anchorInfo.get(`${conn.id}-target`);
      if (!sa || !ta) continue;
      const anchorStart = getDistributedEdgeAnchor(src.gridX, src.gridY, sa.side, sa.index, sa.total, CELL_W, CELL_H, MARGIN);
      const anchorEnd   = getDistributedEdgeAnchor(tgt.gridX, tgt.gridY, ta.side, ta.index, ta.total, CELL_W, CELL_H, MARGIN);
      const startRP = getRoutingGridPoint(src.gridX, src.gridY, sa.side);
      const endRP   = getRoutingGridPoint(tgt.gridX, tgt.gridY, ta.side);
      const pathGrid = findPath(startRP, endRP, effectiveGridSize, effectiveGridSize);
      if (!pathGrid || pathGrid.length === 0) continue;
      for (let i = 0; i < pathGrid.length - 1; i++) {
        const k = segKey(pathGrid[i]!, pathGrid[i + 1]!);
        if (!segmentTally.has(k)) segmentTally.set(k, []);
        const arr = segmentTally.get(k)!;
        if (!arr.includes(conn.id)) arr.push(conn.id);
      }
      const routePoints = pathGrid.map(p => getPhysicalCoordinate(p.rx, p.ry, CELL_W, CELL_H, MARGIN));
      let color = DEFAULT_CABLE_COLOR;
      if (conn.type) {
        for (const [key, val] of Object.entries(CABLE_COLORS)) {
          if (conn.type.includes(key)) { color = val; break; }
        }
      }
      cables.push({ conn, anchorStart, anchorEnd, pathGrid, routePoints, color });
    }

    // Second pass — apply ORTHOGONAL parallel-lane offset.
    // For each route segment (always horizontal OR vertical because the routing grid is axis-aligned),
    // shift the two endpoints along the perpendicular axis. Each point may get up to one X-offset
    // and one Y-offset, taken from its adjacent horizontal & vertical segments respectively.
    const LANE_SPACING = 7;
    const computedPaths: { id: string; d: string; color: string }[] = [];
    // Numbered dot registry — every unique anchor position gets a stable index.
    // The number is shown on-screen inside each dot and emitted in the diagnostic log.
    const dotMap = new Map<string, { num: number; x: number; y: number; color: string }>();
    const dotNumberFor = (px: number, py: number, color: string): number => {
      const key = `${Math.round(px)},${Math.round(py)}`;
      const existing = dotMap.get(key);
      if (existing) return existing.num;
      const num = dotMap.size + 1; // 1-based, unique per render
      dotMap.set(key, { num, x: px, y: py, color });
      return num;
    };
    const connDotMap: Record<string, { from: number; to: number }> = {};

    for (const cable of cables) {
      const n = cable.pathGrid.length;
      const pts = cable.routePoints.map(p => ({ ...p }));
      const xShifted = new Array(n).fill(false);
      const yShifted = new Array(n).fill(false);
      for (let i = 0; i < n - 1; i++) {
        const a = cable.pathGrid[i]!;
        const b = cable.pathGrid[i + 1]!;
        const lane = segmentTally.get(segKey(a, b));
        if (!lane || lane.length < 2) continue;
        const idx = lane.indexOf(cable.conn.id);
        if (idx < 0) continue;
        const offset = (idx - (lane.length - 1) / 2) * LANE_SPACING;
        const horizontal = a.ry === b.ry;
        if (horizontal) {
          // Shift Y of both endpoints
          if (!yShifted[i])     { pts[i]!.y     += offset; yShifted[i] = true; }
          if (!yShifted[i + 1]) { pts[i + 1]!.y += offset; yShifted[i + 1] = true; }
        } else {
          // Vertical → shift X
          if (!xShifted[i])     { pts[i]!.x     += offset; xShifted[i] = true; }
          if (!xShifted[i + 1]) { pts[i + 1]!.x += offset; xShifted[i + 1] = true; }
        }
      }

      // Stitch anchor → first routePoint → ... → last routePoint → anchor.
      // To guarantee strict orthogonality at both ends, snap the first/last
      // routePoint to align with the anchor on the axis perpendicular to the
      // device side. e.g. if exiting "right", first routePoint.y must equal anchorStart.y.
      const sa = anchorInfo.get(`${cable.conn.id}-source`)!;
      const ta = anchorInfo.get(`${cable.conn.id}-target`)!;
      if (pts.length > 0) {
        const first = pts[0]!;
        if (sa.side === 'left' || sa.side === 'right') first.y = cable.anchorStart.y;
        else first.x = cable.anchorStart.x;
        const last = pts[pts.length - 1]!;
        if (ta.side === 'left' || ta.side === 'right') last.y = cable.anchorEnd.y;
        else last.x = cable.anchorEnd.x;
      }

      const full: Point[] = [cable.anchorStart, ...pts, cable.anchorEnd];
      // Insert intermediate corner points wherever two consecutive points
      // differ in BOTH x AND y (would otherwise create a diagonal segment).
      const orthogonal: Point[] = [full[0]!];
      for (let i = 1; i < full.length; i++) {
        const prev = orthogonal[orthogonal.length - 1]!;
        const next = full[i]!;
        if (prev.x !== next.x && prev.y !== next.y) {
          // Choose corner: continue along the dominant axis of the previous segment
          // For first/last we use the entry/exit side to decide; otherwise pick horizontal corner.
          let corner: Point;
          if (i === 1) {
            // From anchor: continue along the anchor's perpendicular axis first
            if (sa.side === 'left' || sa.side === 'right') corner = { x: next.x, y: prev.y };
            else corner = { x: prev.x, y: next.y };
          } else if (i === full.length - 1) {
            if (ta.side === 'left' || ta.side === 'right') corner = { x: prev.x, y: next.y };
            else corner = { x: next.x, y: prev.y };
          } else {
            corner = { x: next.x, y: prev.y };
          }
          orthogonal.push(corner);
        }
        orthogonal.push(next);
      }

      const d = roundedPathFromPoints(orthogonal, 8);
      computedPaths.push({ id: cable.conn.id, d, color: cable.color });
      const numA = dotNumberFor(cable.anchorStart.x, cable.anchorStart.y, cable.color);
      const numB = dotNumberFor(cable.anchorEnd.x,   cable.anchorEnd.y,   cable.color);
      connDotMap[cable.conn.id] = { from: numA, to: numB };
    }

    return { paths: computedPaths, dots: Array.from(dotMap.values()), connDotMap };
  }, [previewNodes, connections, effectiveGridSize, routingMode]);

  // Publish dot numbering so the properties sidebar can show legends.
  useEffect(() => {
    setCableDotNumbers(connDotMap);
  }, [connDotMap, setCableDotNumbers]);

  // === INTERACTION ===
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    const t = e.target as Element;
    if (t.closest('.grid-node-container')) return;
    if (t.closest('.overview-cable')) return;       // cable click handles itself
    if (t.closest('.overview-floating-ui')) return; // toolbar/legend/zoom
    setSelectedNodeId(null);
    setSelectedConnectionId(null);
  }, [setSelectedNodeId, setSelectedConnectionId]);

  // ---- Pointer-events drag (document-level listeners → reliable inside transformed canvas) ----
  const dragStateRef = useRef<{
    id: string; startX: number; startY: number; moved: boolean; pointerId: number;
  } | null>(null);
  const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(null);

  // Convert client coords → grid cell under pointer (accounts for zoom/pan)
  const pointerToCell = useCallback((clientX: number, clientY: number) => {
    const container = containerRef.current;
    if (!container) return null;
    const rect = container.getBoundingClientRect();
    const localX = (clientX - rect.left - panX) / zoom;
    const localY = (clientY - rect.top  - panY) / zoom;
    const strideX = CELL_W + MARGIN;
    const strideY = CELL_H + MARGIN;
    const gx = Math.floor((localX - MARGIN / 2) / strideX);
    const gy = Math.floor((localY - MARGIN / 2) / strideY);
    if (gx < 0 || gy < 0 || gx >= effectiveGridSize || gy >= effectiveGridSize) return null;
    return { gx, gy };
  }, [panX, panY, zoom, effectiveGridSize]);

  const findNodeAtCell = useCallback((gx: number, gy: number): string | null => {
    for (const n of Object.values(nodes)) {
      if (n.gridX === gx && n.gridY === gy) return n.id;
    }
    return null;
  }, [nodes]);

  // Attach move/up to the document while a drag is in progress so we keep
  // receiving updates regardless of which element is under the cursor.
  useEffect(() => {
    const onMove = (ev: PointerEvent) => {
      const ds = dragStateRef.current;
      if (!ds) return;
      if (!ds.moved) {
        const dx = Math.abs(ev.clientX - ds.startX);
        const dy = Math.abs(ev.clientY - ds.startY);
        if (dx < 6 && dy < 6) return;
        ds.moved = true;
        setDraggedNodeId(ds.id);
        document.body.classList.add('overview-dragging');
      }
      // Update ghost position (in container-local pixels)
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        setGhostPos({ x: ev.clientX - rect.left, y: ev.clientY - rect.top });
      }
      const cell = pointerToCell(ev.clientX, ev.clientY);
      if (!cell) { setDragHoverNodeId(null); return; }
      const overId = findNodeAtCell(cell.gx, cell.gy);
      if (overId && overId !== ds.id) {
        if (overId !== dragHoverNodeId) setDragHoverNodeId(overId);
      } else {
        if (dragHoverNodeId) setDragHoverNodeId(null);
      }
    };

    const onUp = (ev: PointerEvent) => {
      const ds = dragStateRef.current;
      dragStateRef.current = null;
      document.body.classList.remove('overview-dragging');
      setGhostPos(null);
      if (!ds || !ds.moved) { setDraggedNodeId(null); setDragHoverNodeId(null); return; }

      const cell = pointerToCell(ev.clientX, ev.clientY);
      const targetId = cell ? findNodeAtCell(cell.gx, cell.gy) : null;

      // -- Legend drag --------------------------------------------------
      if (ds.id === '__LEGEND__') {
        if (cell) {
          // If a device is in the target cell, swap it into the legend's old cell.
          const oldX = legendCell.gridX, oldY = legendCell.gridY;
          if (targetId) {
            setNodes(prev => {
              const moved = prev[targetId];
              if (!moved) return prev;
              return { ...prev, [targetId]: { ...moved, gridX: oldX, gridY: oldY } };
            });
          }
          persistLegendCell({ ...legendCell, gridX: cell.gx, gridY: cell.gy });
        }
        setDraggedNodeId(null);
        setDragHoverNodeId(null);
        return;
      }

      // -- Device drag --------------------------------------------------
      // If the device would land on the legend's cell, push the legend to the device's old cell.
      const draggedNode = nodes[ds.id];
      if (cell && draggedNode && legendCell.gridX === cell.gx && legendCell.gridY === cell.gy) {
        persistLegendCell({ ...legendCell, gridX: draggedNode.gridX, gridY: draggedNode.gridY });
      }

      if (targetId && targetId !== ds.id) {
        setNodes((prev) => {
          const newNodes = { ...prev };
          const dragged = newNodes[ds.id];
          const target  = newNodes[targetId];
          if (!dragged || !target) return prev;
          const tx = dragged.gridX, ty = dragged.gridY;
          newNodes[ds.id]    = { ...dragged, gridX: target.gridX, gridY: target.gridY };
          newNodes[targetId] = { ...target,  gridX: tx,           gridY: ty };
          return newNodes;
        });
      } else if (cell) {
        setNodes((prev) => {
          const dragged = prev[ds.id];
          if (!dragged) return prev;
          return { ...prev, [ds.id]: { ...dragged, gridX: cell.gx, gridY: cell.gy } };
        });
      }
      setDraggedNodeId(null);
      setDragHoverNodeId(null);
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
    };
  }, [pointerToCell, findNodeAtCell, dragHoverNodeId, setNodes]);

  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    if (e.button !== 0) return;
    dragStateRef.current = {
      id, startX: e.clientX, startY: e.clientY, moved: false, pointerId: e.pointerId
    };
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-background overflow-hidden relative font-sans text-foreground">
      
      {/* Sidebar Integrations — Profiles */}
      <SidebarContextPortal>
        <Collapsible 
          open={sidebarSectionStates['overview-profiles'] ?? true}
          onOpenChange={(isOpen) => setSidebarSectionState('overview-profiles', isOpen)}
          className="group/collapsible"
        >
          <SidebarGroup>
            <SidebarGroupLabel render={<CollapsibleTrigger className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer flex items-center justify-between w-full" />}>
              Profiles
              <Icons.ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <div className="flex flex-col gap-2 px-2 mt-2 group-data-[collapsible=icon]:px-0">
                  {/* Built-in presets */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground px-1 group-data-[collapsible=icon]:hidden">Built-in</span>
                    {presetLayouts.length === 0 && (
                      <p className="text-[10px] text-muted-foreground px-1 italic group-data-[collapsible=icon]:hidden">No presets available.</p>
                    )}
                    {presetLayouts.map(p => (
                      <div key={p.id} className="flex items-center gap-1 group/row">
                        <Button variant="ghost" className="flex-1 justify-start text-xs h-8"
                          onClick={() => applyLayout(p.nodes, p.connections, p.id)}
                          title={`Apply "${p.name}"`}>
                          <Icons.Sparkles size={14} className="mr-2 text-cyan-400" /> {p.name}
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="h-px bg-border my-1" />

                  {/* Custom profiles */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground px-1 group-data-[collapsible=icon]:hidden">My Profiles</span>
                    {customLayouts.length === 0 && (
                      <p className="text-[10px] text-muted-foreground px-1 italic group-data-[collapsible=icon]:hidden">No saved profiles. Save the current layout below.</p>
                    )}
                    {customLayouts.map(p => (
                      <div key={p.id} className="flex items-center gap-1 group/row">
                        <Button variant="ghost" className="flex-1 justify-start text-xs h-8"
                          onClick={() => applyLayout(p.nodes, p.connections, p.id)}
                          title={`Apply "${p.name}"`}>
                          <Icons.LayoutGrid size={14} className="mr-2 text-muted-foreground" /> {p.name}
                        </Button>
                        <button
                          className="opacity-0 group-hover/row:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1"
                          onClick={() => setDeleteProfileId(p.id)}
                          title="Delete profile"
                        >
                          <Icons.Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="h-px bg-border my-1" />

                  {/* Actions */}
                  <div className="flex flex-col gap-1">
                    <Button variant="ghost" className="justify-start text-xs h-8"
                      onClick={() => setNewProfileOpen(true)}
                      title="Start a new empty profile">
                      <Icons.FilePlus size={14} className="mr-2" /> New Profile
                    </Button>
                    <Button variant="ghost" className="justify-start text-xs h-8"
                      onClick={() => setSaveLayoutOpen(true)}
                      disabled={nodeCount === 0}
                      title={nodeCount === 0 ? 'Add devices first' : 'Save current layout'}>
                      <Icons.Save size={14} className="mr-2" /> Save Current
                    </Button>
                    <Button variant="ghost" className="justify-start text-xs h-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setClearGridOpen(true)}
                      disabled={nodeCount === 0}>
                      <Icons.Eraser size={14} className="mr-2" /> Clear Grid
                    </Button>
                  </div>
                </div>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContextPortal>

      {/* Main Canvas Area */}
      <div 
        ref={containerRef}
        className="flex-1 relative overflow-hidden cursor-default bg-background"
        onClick={handleCanvasClick}
      >
        <OscilloscopeDrawer />
        {/* Profile Selector Dropdown */}
        <div className="absolute top-4 left-4 z-50 overview-floating-ui">
          <div className="flex items-center gap-2 bg-card/80 backdrop-blur border border-border rounded px-2 py-1 shadow-lg">
            <Icons.LayoutGrid size={14} className="text-muted-foreground" />
            <select 
              className="bg-transparent text-sm text-foreground outline-none cursor-pointer border-none"
              onChange={(e) => {
                if (!e.target.value) return;
                const id = e.target.value;
                const all = [...presetLayouts, ...customLayouts];
                const match = all.find(p => p.id === id);
                if (match) applyLayout(match.nodes, match.connections, match.id);
                e.target.value = ''; // Reset back to placeholder
              }}
              defaultValue=""
            >
              <option value="" disabled hidden>Load Profile...</option>
              {presetLayouts.length > 0 && <optgroup label="Built-in">
                {presetLayouts.map(p => <option key={p.id} value={p.id} className="bg-card text-foreground">{p.name}</option>)}
              </optgroup>}
              {customLayouts.length > 0 && <optgroup label="My Profiles">
                {customLayouts.map(p => <option key={p.id} value={p.id} className="bg-card text-foreground">{p.name}</option>)}
              </optgroup>}
            </select>
          </div>
        </div>

        {/* Subtle dot grid background */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)',
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
          {/* Single overlay SVG (z-30, above device divs at z-10).
              Paint order is deterministic inside an SVG (document order):
                1) cable hit-areas (invisible)
                2) cable strokes
                3) dots + numbers (on top)
              This guarantees short straight cables between adjacent devices
              are always visible — no z-index stacking ambiguity, no blur. */}
          <svg
            className="absolute inset-0 z-30"
            style={{ pointerEvents: 'none' }}
            width={totalGridW}
            height={totalGridH}
          >
            {/* Cable hit-areas (re-enable pointer events just for these) */}
            {paths.map(path => (
              <path
                key={`hit-${path.id}`}
                className="overview-cable"
                d={path.d}
                fill="none"
                stroke="transparent"
                strokeWidth={18}
                style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                onClick={(e) => {
                  e.stopPropagation();
                  // Logical cables are synthetic; just select the source device.
                  const conn = connections[path.id];
                  if (conn) {
                    setSelectedConnectionId(path.id);
                    setSelectedNodeId(conn.source);
                  } else if (path.id.startsWith('logical_')) {
                    const m = path.id.match(/^logical_(.+?)_to_/);
                    if (m && m[1]) setSelectedNodeId(m[1]);
                  }
                }}
              />
            ))}
            {/* Visible cable strokes */}
            {paths.map(path => {
              const isSel = selectedConnectionId === path.id;
              return (
                <path
                  key={`cable-${path.id}`}
                  d={path.d}
                  fill="none"
                  stroke={path.color}
                  strokeWidth={isSel ? 5 : 3.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={path.id.startsWith('logical_') ? '6 5' : undefined}
                  opacity={1}
                />
              );
            })}
            {/* Numbered connector dots — drawn last so they sit on top */}
            {dots.map((dot) => (
              <g key={`dot-${dot.num}`}>
                <circle cx={dot.x} cy={dot.y} r={7.5} fill="rgba(0,0,0,0.6)" />
                <circle
                  cx={dot.x}
                  cy={dot.y}
                  r={6}
                  fill={dot.color}
                  stroke="#ffffff"
                  strokeWidth={1}
                />
                <text
                  x={dot.x}
                  y={dot.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={7.5}
                  fontWeight={700}
                  fill="#000"
                  style={{ paintOrder: 'stroke', stroke: '#fff', strokeWidth: 1.5 }}
                >
                  {dot.num}
                </text>
              </g>
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
                  onPointerDown={(e) => handlePointerDown(e, node.id)}
                  className={`grid-node-container absolute select-none 
                    ${isDragged ? 'opacity-30 scale-[0.97] z-20 pointer-events-none ring-2 ring-cyan-400/40' : ''}
                    ${isHovered ? 'opacity-80 scale-[1.02] ring-2 ring-cyan-500/50' : ''}
                    ${draggedNodeId && !isDragged && !isHovered ? 'opacity-50 saturate-50' : ''}
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
                    onSelect={() => setSelectedNodeId(selectedNodeId === node.id ? null : node.id)}
                    onNavigate={() => setActiveMainView(node.type as any)}
                  />
                </div>
              );
            })}
          </div>

          {/* Cable legend — occupies one grid cell, drag to move */}
          {(() => {
            // Clamp legend cell into the visible grid, in case grid shrank.
            const gx = Math.min(legendCell.gridX, effectiveGridSize - 1);
            const gy = Math.min(legendCell.gridY, effectiveGridSize - 1);
            const isLegendDragged = draggedNodeId === '__LEGEND__';
            return (
              <div
                className={`absolute select-none z-20 flex items-center justify-center ${isLegendDragged ? 'opacity-30 scale-[0.97] pointer-events-none' : ''}`}
                onPointerDown={(e) => handlePointerDown(e as React.PointerEvent<HTMLDivElement>, '__LEGEND__')}
                style={{
                  // Occupy the cell footprint (so it claims a grid slot for drag/swap)
                  left: MARGIN + gx * (CELL_W + MARGIN),
                  top:  MARGIN + gy * (CELL_H + MARGIN),
                  width: CELL_W,
                  height: CELL_H,
                  transition: 'left 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), top 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.2s ease',
                }}
              >
                <div className="bg-card/90 backdrop-blur border border-border/60 rounded-lg shadow-lg flex flex-col w-[200px] overflow-hidden">
                  <div className="bg-muted p-2 flex justify-between items-center cursor-move border-b border-border/50">
                    <h3 className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Cable Legend</h3>
                    <button
                      type="button"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => { e.stopPropagation(); persistLegendCell({ ...legendCell, collapsed: !legendCell.collapsed }); }}
                      title={legendCell.collapsed ? 'Expand legend' : 'Collapse legend'}
                      className="text-muted-foreground hover:text-foreground transition"
                    >
                      {legendCell.collapsed ? <Icons.ChevronDown size={14} /> : <Icons.ChevronUp size={14} />}
                    </button>
                  </div>
                  {!legendCell.collapsed && (
                    <div className="flex-1 overflow-auto px-3 py-2">
                      <div className="flex flex-col gap-1.5 text-[12px]">
                        {CABLE_CATEGORIES.filter(cat => cat.legend).map(cat => (
                          <div key={cat.id} className="flex items-center gap-2 text-foreground">
                            <div className="w-6 h-1.5 rounded" style={{ background: cat.color }} />
                            <span className="truncate">{cat.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Floating drag ghost — follows the cursor */}
          {draggedNodeId && ghostPos && (() => {
            const node = nodes[draggedNodeId];
            if (!node) return null;
            return (
              <div
                className="absolute pointer-events-none z-40 grid-node-container"
                style={{
                  // ghost is positioned in screen-space (un-transformed) inside the canvas container
                  left: 0, top: 0,
                  width: CELL_W,
                  height: CELL_H,
                  transform: `translate(${(ghostPos.x - (CELL_W * zoom) / 2 - panX) / zoom}px, ${(ghostPos.y - (CELL_H * zoom) / 2 - panY) / zoom}px)`,
                  opacity: 0.85,
                  filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.5))'
                }}
              >
                <GridNode node={node} isSelected={false} onSelect={() => {}} onNavigate={() => {}} />
              </div>
            );
          })()}

        </div>

        {/* Empty state */}
        {nodeCount === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-muted-foreground pointer-events-auto">
              <Icons.LayoutGrid size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium mb-4 text-foreground">No devices on the grid</p>
              <Button
                size="lg"
                variant="secondary"
                className="bg-card/90 backdrop-blur border border-border/60 hover:bg-muted text-foreground"
                onClick={() => setNewDeviceOpen(true)}
              >
                <Icons.Plus size={16} className="mr-2" /> New Device
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* In-grid floating UI (toolbar, zoom, legend) */}
      <div className="overview-floating-ui">
        {/* Top toolbar - routing mode toggle + New Device */}
        <div className="absolute top-4 right-4 z-40 flex gap-2 items-center pointer-events-auto">
          {/* Physical vs Logical mode toggle */}
          <div className="flex bg-card/90 backdrop-blur border border-border/60 rounded-md p-0.5 select-none">
            <button
              onClick={() => setRoutingMode('physical')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${routingMode === 'physical' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              title="Physical cable routing"
            >
              Physical
            </button>
            <button
              onClick={() => setRoutingMode('logical')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${routingMode === 'logical' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              title="Logical MIDI routing"
            >
              Logical
            </button>
          </div>
          <Button
            size="sm"
            variant="secondary"
            className="bg-card/90 backdrop-blur border border-border/60 hover:bg-muted text-foreground"
            onClick={() => setNewDeviceOpen(true)}
          >
            <Icons.Plus size={14} className="mr-1" /> New Device
          </Button>
        </div>

        {/* Zoom controls — bottom-right */}
        <div className="absolute bottom-4 right-4 z-40 flex items-center gap-1 bg-card/90 backdrop-blur border border-border/60 rounded-lg p-1 pointer-events-auto">
          <button
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
            disabled={effectiveGridSize >= 10}
            onClick={() => setGridSize(Math.min(10, effectiveGridSize + 1))}
            title="Zoom out (larger grid)"
          >−</button>
          <span className="text-[10px] font-mono w-12 text-center text-muted-foreground select-none">
            {effectiveGridSize}×{effectiveGridSize}
          </span>
          <button
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
            disabled={effectiveGridSize <= minGridSize}
            onClick={() => setGridSize(Math.max(minGridSize, effectiveGridSize - 1))}
            title="Zoom in (smaller grid)"
          >+</button>
        </div>

      </div>

      {/* New Device modal */}
      <NewDeviceModal isOpen={newDeviceOpen} onClose={() => setNewDeviceOpen(false)} />

      {/* Profile / layout modals */}
      <PromptModal
        isOpen={newProfileOpen}
        title="New Profile"
        description="This will clear the current grid and start a fresh profile."
        placeholder="Profile name"
        confirmText="Create"
        onCancel={() => setNewProfileOpen(false)}
        onConfirm={(name) => {
          setNewProfileOpen(false);
          clearLayout();
          // Save after clearLayout state propagates
          setTimeout(() => saveCustomLayout(name), 0);
        }}
      />
      <PromptModal
        isOpen={saveLayoutOpen}
        title="Save Profile"
        description="Save the current grid as a named profile."
        placeholder="Profile name"
        confirmText="Save"
        onCancel={() => setSaveLayoutOpen(false)}
        onConfirm={(name) => {
          setSaveLayoutOpen(false);
          saveCustomLayout(name);
        }}
      />
      <ConfirmModal
        isOpen={deleteProfileId !== null}
        title="Delete Profile"
        description={
          <span>
            Delete profile{' '}
            <span className="font-semibold">
              "{customLayouts.find(l => l.id === deleteProfileId)?.name ?? ''}"
            </span>
            ? This cannot be undone.
          </span>
        }
        confirmText="Delete"
        destructive
        onCancel={() => setDeleteProfileId(null)}
        onConfirm={() => {
          if (deleteProfileId) removeCustomLayout(deleteProfileId);
          setDeleteProfileId(null);
        }}
      />
      <ConfirmModal
        isOpen={clearGridOpen}
        title="Clear Grid"
        description="Remove all devices and connections from the current grid?"
        confirmText="Clear"
        destructive
        onCancel={() => setClearGridOpen(false)}
        onConfirm={() => { setClearGridOpen(false); clearLayout(); }}
      />

      {/* Properties Sidebar (Overlay) — anchored to the RIGHT */}
      <div
        className={`absolute right-0 top-0 h-full w-80 transition-transform duration-300 ease-out z-50 ${selectedNodeId ? 'translate-x-0' : 'translate-x-full pointer-events-none'}`}
      >
        <OverviewSidebar onClose={() => setSelectedNodeId(null)} />
      </div>

    </div>
  );
}