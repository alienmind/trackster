import { create } from 'zustand';
import * as React from 'react';
import { useUIStore } from './useUIStore';

export type NodeType = 'circuit' | 'grind' | 's1' | 'minifreak' | 'flow8' | 'daw' | string;

export type AudioPortType = 'XLR' | 'TRS' | 'TR' | 'MINIJACK' | 'MIDI_5PIN' | 'USB_A' | 'USB_B' | 'USB_C' | 'POWER';

export interface PortDef {
  id: string;
  type: AudioPortType;
}

export interface HardwareDeviceData {
  id: string;
  longName: string;
  brand: string;
  model: string;
  tagline: string;
  width: number;
  theme: {
    border: string;
    header: string;
    title: string;
    badge: string;
  };
  ports: PortDef[];
  hideFromToolbar?: boolean;
  requiresMount?: boolean;
  /** Optional override for the folder under /devices/* that holds device.png and assets. Defaults to the blueprint id. */
  assetFolder?: string;
}

export interface HardwareBlueprint extends HardwareDeviceData {
  visual?: () => React.ReactNode;
  layoutComponent?: React.LazyExoticComponent<any> | React.ComponentType<any>;
}

export interface OverviewNode {
  id: string;
  type: NodeType;
  gridX: number;
  gridY: number;
  zIndex: number;
  isExpanded?: boolean;
  isHardwareExpanded?: boolean;
  overview?: string;
  logicalInChannel?: number | null;
  logicalOutChannel?: number | null;
  circuitLogicalOuts?: { synth1?: number | null, synth2?: number | null, midi1?: number | null, midi2?: number | null };
}

export interface OverviewConnection {
  id: string;
  source: string;
  target: string;
  type: string;
  label?: string;
  sourcePort?: string;
  targetPort?: string;
}

export type RoutingMode = 'physical' | 'logical';

interface OverviewState {
  routingMode: RoutingMode;
  nodes: Record<string, OverviewNode>;
  connections: Record<string, OverviewConnection>;
  gridSize: number;
  selectedNodeId: string | null;
  selectedConnectionId: string | null;
  /** Per-render mapping connectionId -> { from: dotNumber, to: dotNumber }.
   *  Written by OverviewTab after each cable layout pass; consumed by the sidebar. */
  cableDotNumbers: Record<string, { from: number; to: number }>;

  setGridSize: (size: number) => void;
  setSelectedNodeId: (id: string | null) => void;
  setSelectedConnectionId: (id: string | null) => void;
  setCableDotNumbers: (m: Record<string, { from: number; to: number }>) => void;
  setRoutingMode: (mode: RoutingMode) => void;
  setNodes: (updater: (prev: Record<string, OverviewNode>) => Record<string, OverviewNode>) => void;
  setConnections: (updater: (prev: Record<string, OverviewConnection>) => Record<string, OverviewConnection>) => void;
  addNode: (id: string, node: OverviewNode) => void;
  removeNode: (id: string) => void;
  /** Returns a fresh (gridX, gridY) — center cell when the grid is empty,
   *  otherwise the first row-major free cell starting from the centre. */
  findNextFreeCell: () => { gridX: number; gridY: number };
  resetLayout: (nodes: Record<string, OverviewNode>, connections: Record<string, OverviewConnection>) => void;
  saveLayout: () => void;
  copyLayout: () => void;
  
  customLayouts: Array<{ id: string; name: string; nodes: Record<string, OverviewNode>; connections: Record<string, OverviewConnection> }>;
  presetLayouts: Array<{ id: string; name: string; nodes: Record<string, OverviewNode>; connections: Record<string, OverviewConnection> }>;
  saveCustomLayout: (name: string) => void;
  removeCustomLayout: (id: string) => void;
  loadCustomLayouts: (layouts: any[]) => void;
  loadPresetLayouts: (layouts: { id: string; name: string; nodes: Record<string, OverviewNode>; connections: Record<string, OverviewConnection> }[]) => void;
  applyLayout: (nodes: Record<string, OverviewNode>, connections: Record<string, OverviewConnection>) => void;
  clearLayout: () => void;
}

export const useOverviewStore = create<OverviewState>((set, get) => ({
  routingMode: 'physical',
  nodes: {},
  connections: {},
  customLayouts: [],
  presetLayouts: [],
  gridSize: 3,
  selectedNodeId: null,
  selectedConnectionId: null,
  cableDotNumbers: {},

  setGridSize: (size) => set({ gridSize: size }),
  setSelectedNodeId: (id) => set({ selectedNodeId: id, selectedConnectionId: null }),
  setSelectedConnectionId: (id) => set({ selectedConnectionId: id }),
  setCableDotNumbers: (m) => set({ cableDotNumbers: m }),
  loadPresetLayouts: (layouts) => set({ presetLayouts: layouts }),
  applyLayout: (nodes, connections) => set({ nodes, connections, selectedNodeId: null, selectedConnectionId: null }),
  clearLayout: () => set({ nodes: {}, connections: {}, selectedNodeId: null, selectedConnectionId: null }),
  setRoutingMode: (mode) => set({ routingMode: mode }),
  setNodes: (updater) => set((state) => ({ nodes: updater(state.nodes) })),
  setConnections: (updater) => set((state) => ({ connections: updater(state.connections) })),

  addNode: (id, node) => set((state) => ({
    nodes: { ...state.nodes, [id]: node }
  })),

  findNextFreeCell: () => {
    const { nodes, gridSize } = get();
    const occupied = new Set(Object.values(nodes).map(n => `${n.gridX},${n.gridY}`));
    const N = Math.max(gridSize, Math.ceil(Math.sqrt(Object.keys(nodes).length + 1)));
    const cx = Math.floor(N / 2);
    const cy = Math.floor(N / 2);
    if (!occupied.has(`${cx},${cy}`)) return { gridX: cx, gridY: cy };
    // Row-major scan from top-left
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        if (!occupied.has(`${x},${y}`)) return { gridX: x, gridY: y };
      }
    }
    // Should never happen — grid auto-expands via Overview's minGridSize
    return { gridX: 0, gridY: 0 };
  },

  removeNode: (id) => set((state) => {
    const newNodes = { ...state.nodes };
    delete newNodes[id];

    const newConnections: Record<string, OverviewConnection> = {};
    for (const [connId, conn] of Object.entries(state.connections)) {
      if (conn.source !== id && conn.target !== id) {
        newConnections[connId] = conn;
      }
    }

    return { nodes: newNodes, connections: newConnections };
  }),

  resetLayout: (defaultNodes, defaultConnections) => {
    set({ nodes: defaultNodes, connections: defaultConnections });
  },

  saveLayout: () => {
    const { nodes, connections } = get();
    localStorage.setItem('alienmind_nodes_v5', JSON.stringify(nodes));
    localStorage.setItem('alienmind_connections_v5', JSON.stringify(connections));
    useUIStore.getState().addNotification({ type: 'success', message: 'Current workspace saved successfully!' });
  },

  copyLayout: () => {
    const { nodes, connections } = get();
    navigator.clipboard.writeText(JSON.stringify({ nodes, connections }, null, 2)).then(() => {
      useUIStore.getState().addNotification({ type: 'success', message: 'Layout copied to clipboard!' });
    });
  },
  
  loadCustomLayouts: (layouts) => {
    set({ customLayouts: layouts });
  },
  
  saveCustomLayout: (name: string) => {
    const { nodes, connections, customLayouts } = get();
    const id = `custom_${Date.now()}`;
    const newLayout = { id, name, nodes, connections };
    const updated = [...customLayouts, newLayout];
    set({ customLayouts: updated });
    localStorage.setItem('alienmind_custom_layouts_v5', JSON.stringify(updated));
    useUIStore.getState().addNotification({ type: 'success', message: `Layout "${name}" saved!` });
  },
  
  removeCustomLayout: (id: string) => {
    const { customLayouts } = get();
    const updated = customLayouts.filter(l => l.id !== id);
    set({ customLayouts: updated });
    localStorage.setItem('alienmind_custom_layouts_v5', JSON.stringify(updated));
    useUIStore.getState().addNotification({ type: 'success', message: 'Layout deleted.' });
  }
}));
