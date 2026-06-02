import { create } from 'zustand';
import * as React from 'react';
import { useUIStore } from './useUIStore';

export type NodeType = 'circuit' | 'grind' | 's1' | 'minifreak' | 'flow8' | 'ableton' | string;

export type AudioPortType = 'XLR' | 'TRS' | 'TR' | 'MINIJACK' | 'MIDI_5PIN' | 'USB_A' | 'USB_B' | 'USB_C' | 'POWER';

export interface PortDef {
  id: string;
  type: AudioPortType;
}

export interface HardwareDeviceData {
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
}

export interface HardwareBlueprint extends HardwareDeviceData {
  visual: () => React.ReactNode;
}

export interface OverviewNode {
  id: string;
  type: NodeType;
  x: number;
  y: number;
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
  startOffset: { x: number; y: number };
  endOffset: { x: number; y: number };
  midPoint?: { x: number; y: number };
  sourcePort?: string;
  targetPort?: string;
}

export type RoutingMode = 'physical' | 'logical';

interface OverviewState {
  routingMode: RoutingMode;
  nodes: Record<string, OverviewNode>;
  connections: Record<string, OverviewConnection>;
  setRoutingMode: (mode: RoutingMode) => void;
  setNodes: (updater: (prev: Record<string, OverviewNode>) => Record<string, OverviewNode>) => void;
  setConnections: (updater: (prev: Record<string, OverviewConnection>) => Record<string, OverviewConnection>) => void;
  addNode: (id: string, node: OverviewNode) => void;
  removeNode: (id: string) => void;
  autoArrange: (hardwareWidths: Record<string, number>) => void;
  resetLayout: (nodes: Record<string, OverviewNode>, connections: Record<string, OverviewConnection>) => void;
  saveLayout: () => void;
  copyLayout: () => void;
  
  customLayouts: Array<{ id: string; name: string; nodes: Record<string, OverviewNode>; connections: Record<string, OverviewConnection> }>;
  saveCustomLayout: (name: string) => void;
  removeCustomLayout: (id: string) => void;
  loadCustomLayouts: (layouts: any[]) => void;
}

export const useOverviewStore = create<OverviewState>((set, get) => ({
  routingMode: 'physical',
  nodes: {},
  connections: {},
  customLayouts: [],
  
  setRoutingMode: (mode) => set({ routingMode: mode }),
  setNodes: (updater) => set((state) => ({ nodes: updater(state.nodes) })),
  setConnections: (updater) => set((state) => ({ connections: updater(state.connections) })),

  addNode: (id, node) => set((state) => ({
    nodes: { ...state.nodes, [id]: node }
  })),

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

  autoArrange: (hardwareWidths) => {
    set((state) => {
      const newNodes = { ...state.nodes };
      let currentX = 50;
      const currentY = 100;
      
      const nodeOrder = ['n_ableton', 'n_flow8', 'n_circuit', 'n_minifreak', 'n_s1', 'n_grind'];
      
      nodeOrder.forEach((nodeId) => {
        if (newNodes[nodeId]) {
          newNodes[nodeId] = { ...newNodes[nodeId], x: currentX, y: currentY };
          const hType = newNodes[nodeId].type;
          const width = hardwareWidths[hType] || 350;
          currentX += width + 50;
        }
      });
      return { nodes: newNodes };
    });
  },

  resetLayout: (defaultNodes, defaultConnections) => {
    set({ nodes: defaultNodes, connections: defaultConnections });
  },

  saveLayout: () => {
    const { nodes, connections } = get();
    localStorage.setItem('alienmind_nodes_v4', JSON.stringify(nodes));
    localStorage.setItem('alienmind_connections_v4', JSON.stringify(connections));
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
    localStorage.setItem('alienmind_custom_layouts_v4', JSON.stringify(updated));
    useUIStore.getState().addNotification({ type: 'success', message: `Layout "${name}" saved!` });
  },
  
  removeCustomLayout: (id: string) => {
    const { customLayouts } = get();
    const updated = customLayouts.filter(l => l.id !== id);
    set({ customLayouts: updated });
    localStorage.setItem('alienmind_custom_layouts_v4', JSON.stringify(updated));
    useUIStore.getState().addNotification({ type: 'success', message: 'Layout deleted.' });
  }
}));
