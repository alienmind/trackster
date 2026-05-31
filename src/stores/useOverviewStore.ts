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

export const DEFAULT_NODES: Record<string, OverviewNode> = {
  n_circuit: { id: 'n_circuit', type: 'circuit', x: 1486, y: 484, zIndex: 38, isExpanded: true, overview: 'Brain. Sequences drums & handles sidechain ducking.', audioIn: 'S-1 / Grind (Mono)', audioOut: 'Flow8 Ch 3/4', midiIn: '-', midiOut: 'Thru chain', midiThru: '-' },
  n_grind: { id: 'n_grind', type: 'grind', x: 87, y: 688, zIndex: 40, isExpanded: true, overview: 'Aggressive bass/lead synth. Needs sidechain.', audioIn: '-', audioOut: 'Circuit In 1', midiIn: 'From MiniFreak', midiOut: '-', midiThru: 'To S-1' },
  n_s1: { id: 'n_s1', type: 's1', x: 1002, y: 744, zIndex: 41, isExpanded: true, overview: 'Sub bass or portable chord stabber.', audioIn: '-', audioOut: 'Circuit In 2', midiIn: 'From Grind Thru', midiOut: '-', midiThru: '-' },
  n_minifreak: { id: 'n_minifreak', type: 'minifreak', x: 81, y: 38, zIndex: 42, isExpanded: true, overview: 'Polyphonic pads. Keeps full stereo image.', audioIn: '-', audioOut: 'Flow8 Ch 1/2', midiIn: 'From Circuit', midiOut: '-', midiThru: 'To Grind' },
  n_flow8: { id: 'n_flow8', type: 'flow8', x: 2090, y: 225, zIndex: 37, isExpanded: true, overview: 'Central mixer. Maintains stereo & EQs.', audioIn: 'Synths + Circuit', audioOut: 'USB Multitrack', midiIn: '-', midiOut: '-', midiThru: '-' },
  n_ableton: { id: 'n_ableton', type: 'ableton', x: 2730, y: 282, zIndex: 36, isExpanded: true, overview: 'Final recording, FX, and mastering.', audioIn: 'USB Flow8', audioOut: 'Master', midiIn: '-', midiOut: '-', midiThru: '-' },
};

export const DEFAULT_CONNECTIONS: Record<string, OverviewConnection> = {
  c_grind_audio: { id: 'c_grind_audio', source: 'n_grind', target: 'n_circuit', type: 'audio_ts', label: 'Audio TS', startOffset: {x:300,y:100}, endOffset: {x:20,y:20} },
  c_s1_audio: { id: 'c_s1_audio', source: 'n_s1', target: 'n_circuit', type: 'audio_ts', label: 'Audio TS', startOffset: {x:230,y:50}, endOffset: {x:20,y:50} },
  c_circuit_audio: { id: 'c_circuit_audio', source: 'n_circuit', target: 'n_flow8', type: 'audio_sidechain', label: 'Stereo (Pump)', startOffset: {x:260,y:50}, endOffset: {x:20,y:150} },
  c_mf_audio: { id: 'c_mf_audio', source: 'n_minifreak', target: 'n_flow8', type: 'audio_trs', label: 'Stereo (Clean)', startOffset: {x:280,y:100}, endOffset: {x:20,y:50} },
  c_flow_usb: { id: 'c_flow_usb', source: 'n_flow8', target: 'n_ableton', type: 'midi_usb', label: 'Multitrack', startOffset: {x:230,y:100}, endOffset: {x:20,y:50} },
  c_midi_master: { id: 'c_midi_master', source: 'n_circuit', target: 'n_minifreak', type: 'midi_din', label: 'Clock/Notes', startOffset: {x:140,y:10}, endOffset: {x:150,y:200} },
  c_midi_2: { id: 'c_midi_2', source: 'n_minifreak', target: 'n_grind', type: 'midi_din', label: 'Thru', startOffset: {x:20,y:150}, endOffset: {x:20,y:50} },
  c_midi_3: { id: 'c_midi_3', source: 'n_grind', target: 'n_s1', type: 'midi_din', label: 'Thru', startOffset: {x:40,y:200}, endOffset: {x:40,y:20} },
};

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
