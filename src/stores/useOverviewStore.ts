import { create } from 'zustand';
import { useUIStore } from './useUIStore';

export type NodeType = 'circuit' | 'grind' | 's1' | 'minifreak' | 'flow8' | 'ableton';

export interface OverviewNode {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  zIndex: number;
  isExpanded?: boolean;
  isHardwareExpanded?: boolean;
  overview?: string;
  audioIn?: string;
  audioOut?: string;
  midiIn?: string;
  midiOut?: string;
  midiThru?: string;
}

export interface OverviewConnection {
  id: string;
  source: string;
  target: string;
  type: string;
  label?: string;
  startOffset: { x: number; y: number };
  endOffset: { x: number; y: number };
}

interface OverviewState {
  nodes: Record<string, OverviewNode>;
  connections: Record<string, OverviewConnection>;
  setNodes: (updater: (prev: Record<string, OverviewNode>) => Record<string, OverviewNode>) => void;
  setConnections: (updater: (prev: Record<string, OverviewConnection>) => Record<string, OverviewConnection>) => void;
  autoArrange: (hardwareWidths: Record<string, number>) => void;
  resetLayout: (defaultNodes: Record<string, OverviewNode>, defaultConnections: Record<string, OverviewConnection>) => void;
  saveLayout: () => void;
  copyLayout: () => void;
}

export const useOverviewStore = create<OverviewState>((set, get) => ({
  nodes: {},
  connections: {},
  setNodes: (updater) => set((state) => ({ nodes: updater(state.nodes) })),
  setConnections: (updater) => set((state) => ({ connections: updater(state.connections) })),

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
    useUIStore.getState().addNotification({ type: 'success', message: 'Layout Saved successfully!' });
  },

  copyLayout: () => {
    const { nodes, connections } = get();
    navigator.clipboard.writeText(JSON.stringify({ nodes, connections }, null, 2)).then(() => {
      useUIStore.getState().addNotification({ type: 'success', message: 'Layout copied to clipboard!' });
    });
  }
}));
