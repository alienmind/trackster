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
  hideFromToolbar?: boolean;
}

export interface HardwareBlueprint extends HardwareDeviceData {
  visual?: () => React.ReactNode;
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
  autoArrange: () => void;
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

  autoArrange: () => {
    set((state) => {
      const newNodes = JSON.parse(JSON.stringify(state.nodes));
      const nodesArr = Object.values(newNodes) as any[];
      const conns = Object.values(state.connections);
      
      if (nodesArr.length === 0) return state;
      
      const iterations = 150;
      const K = 400; // Optimal distance
      
      for (let i = 0; i < iterations; i++) {
        // Calculate repulsive forces
        nodesArr.forEach(n1 => {
           n1.dx = 0; n1.dy = 0;
           nodesArr.forEach(n2 => {
              if (n1.id === n2.id) return;
              let dx = n1.x - n2.x;
              let dy = n1.y - n2.y;
              let distance = Math.hypot(dx, dy);
              if (distance === 0) { dx = Math.random() - 0.5; dy = Math.random() - 0.5; distance = Math.hypot(dx, dy); }
              const force = (K * K) / Math.max(1, distance);
              n1.dx += (dx / distance) * force;
              n1.dy += (dy / distance) * force;
           });
           
           // Slight gravity to center to avoid drifting
           n1.dx += (500 - n1.x) * 0.1;
           n1.dy += (500 - n1.y) * 0.1;
        });
        
        // Calculate attractive forces (springs)
        conns.forEach(conn => {
           const n1 = newNodes[conn.source];
           const n2 = newNodes[conn.target];
           if (!n1 || !n2) return;
           const dx = n1.x - n2.x;
           const dy = n1.y - n2.y;
           const distance = Math.hypot(dx, dy);
           if (distance === 0) return;
           const force = (distance * distance) / K;
           const fx = (dx / distance) * force;
           const fy = (dy / distance) * force;
           
           n1.dx -= fx;
           n1.dy -= fy;
           n2.dx += fx;
           n2.dy += fy;
        });
        
        // Apply forces
        const temperature = Math.max(5, 150 * (1 - i / iterations));
        nodesArr.forEach(n => {
           const d = Math.hypot(n.dx, n.dy);
           if (d > 0) {
             n.x += (n.dx / d) * Math.min(d, temperature);
             n.y += (n.dy / d) * Math.min(d, temperature);
           }
        });
      }
      
      // Ensure positive coordinates and remove temporary dx/dy
      let minX = Infinity, minY = Infinity;
      nodesArr.forEach(n => {
         delete n.dx;
         delete n.dy;
         if (n.x < minX) minX = n.x;
         if (n.y < minY) minY = n.y;
      });
      nodesArr.forEach(n => {
         n.x = n.x - minX + 100;
         n.y = n.y - minY + 100;
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
