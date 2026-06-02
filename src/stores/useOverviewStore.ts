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
  resetLayout: (defaultNodes: Record<string, OverviewNode>, defaultConnections: Record<string, OverviewConnection>) => void;
  saveLayout: () => void;
  copyLayout: () => void;
}

export const DEFAULT_NODES: Record<string, OverviewNode> = {
  n_circuit: { id: "n_circuit", type: "circuit", x: 2039.5137111517367, y: -26.822669104204806, zIndex: 37, isExpanded: true, circuitLogicalOuts: { synth1: 3, synth2: 4, midi1: 1, midi2: 2 } },
  n_grind: { id: "n_grind", type: "grind", x: 1175.400365630713, y: 337.0658135283363, zIndex: 40, isExpanded: true, logicalInChannel: 1 },
  n_s1: { id: "n_s1", type: "s1", x: 1647.4405850091407, y: 565.6946983546618, zIndex: 36, isExpanded: true, logicalInChannel: 2 },
  n_minifreak: { id: "n_minifreak", type: "minifreak", x: 747.4058500914077, y: -12.405850091407686, zIndex: 38, isExpanded: true, logicalInChannel: 3 },
  n_flow8: { id: "n_flow8", type: "flow8", x: 2648.4076782449724, y: -112.27239488117004, zIndex: 42, isExpanded: true },
  n_ableton: { id: "n_ableton", type: "ableton", x: 3144.4040219378426, y: 226.21023765996344, zIndex: 43, isExpanded: true }
};

export const DEFAULT_CONNECTIONS: Record<string, OverviewConnection> = {
  c_grind_audio: { id: "c_grind_audio", source: "n_grind", target: "n_circuit", type: "audio_jack_to_minijack", label: "Jack 6.35 to Mini Jack 3.5", startOffset: { x: 300, y: 100 }, endOffset: { x: 0, y: 50 }, sourcePort: "audioOut", targetPort: "audioIn1" },
  c_s1_audio: { id: "c_s1_audio", source: "n_s1", target: "n_circuit", type: "audio_jack_to_minijack", label: "Jack 6.35 to Mini Jack 3.5", startOffset: { x: 230, y: 50 }, endOffset: { x: 0, y: 100 }, sourcePort: "audioOut", targetPort: "audioIn2" },
  c_circuit_audio: { id: "c_circuit_audio", source: "n_circuit", target: "n_flow8", type: "audio_minijack_to_dual_trs", label: "Mini Jack to TRS Left/Right (Y cable)", startOffset: { x: 350, y: 50 }, endOffset: { x: 0, y: 150 }, sourcePort: "audioOut", targetPort: "audioIn", midPoint: { x: 2475.840036563071, y: -6.667276051188296 } },
  c_mf_audio: { id: "c_mf_audio", source: "n_minifreak", target: "n_flow8", type: "audio_trs_to_xlr", label: "TRS to XLR", startOffset: { x: 300, y: 100 }, endOffset: { x: 0, y: 100 }, sourcePort: "audioOut", targetPort: "audioIn", midPoint: { x: 1752.4853747714806, y: -74.10786106032907 } },
  c_flow_usb: { id: "c_flow_usb", source: "n_flow8", target: "n_ableton", type: "midi_usb", label: "USB Type-B to Type-A", startOffset: { x: 300, y: 100 }, endOffset: { x: 0, y: 50 }, sourcePort: "usbOut", targetPort: "usbIn", midPoint: { x: 3000.136197440585, y: 257.6563071297989 } },
  c_midi_master: { id: "c_midi_master", source: "n_circuit", target: "n_minifreak", type: "midi_din", label: "5-Pin MIDI DIN", startOffset: { x: 350, y: 150 }, endOffset: { x: 0, y: 200 }, sourcePort: "midiOut", targetPort: "midiIn" },
  c_midi_2: { id: "c_midi_2", source: "n_minifreak", target: "n_grind", type: "midi_din", label: "5-Pin MIDI DIN", startOffset: { x: 300, y: 150 }, endOffset: { x: 0, y: 150 }, sourcePort: "midiOut", targetPort: "midiIn" },
  c_midi_3: { id: "c_midi_3", source: "n_grind", target: "n_s1", type: "midi_din_to_trs", label: "MIDI DIN to TRS Type A", startOffset: { x: 300, y: 150 }, endOffset: { x: 0, y: 150 }, sourcePort: "midiOut", targetPort: "midiIn", midPoint: { x: 1648.0612431444242, y: 474.1188299817185 } }
};


export const useOverviewStore = create<OverviewState>((set, get) => ({
  routingMode: 'physical',
  nodes: {},
  connections: {},
  
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
    useUIStore.getState().addNotification({ type: 'success', message: 'Layout Saved successfully!' });
  },

  copyLayout: () => {
    const { nodes, connections } = get();
    navigator.clipboard.writeText(JSON.stringify({ nodes, connections }, null, 2)).then(() => {
      useUIStore.getState().addNotification({ type: 'success', message: 'Layout copied to clipboard!' });
    });
  }
}));
