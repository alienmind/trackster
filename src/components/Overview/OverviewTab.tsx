
/* 
 * ALIENMIND HYBRID SETUP BUILDER (v4.0)
 * -------------------------------------
 * Features & Specifications:
 * 1. Interactive Node Architecture: Drag and drop hardware nodes around the canvas.
 * 2. Dynamic Cable Routing: Cables have draggable start and end points. Drop them on a node to snap.
 * 3. Color-Coded Technical Cables: Audio TS, Audio TRS, Sidechain Pump, MIDI DIN, and MIDI USB.
 * 4. Editable Overviews & I/O: Each node has a collapsible panel to document Audio/MIDI ins and outs.
 * 5. Inline Cable Labels: Double-click any cable label floating in the middle of the wire to edit its text.
 * 6. Local Storage Persistence: Save your layout (positions, routes, text) and restore it later.
 * 7. High-Fidelity Vector Graphics: SVG/CSS accurate representations of specific hardware (Stellar, Grind, S-1, etc).
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { OverviewConnection, OverviewNode } from '../../stores/useOverviewStore';
import { HARDWARE_LIBRARY } from '../../devices';
import { Circle, Square, ChevronDown, ChevronRight } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { useOverviewStore, DEFAULT_NODES, DEFAULT_CONNECTIONS } from '../../stores/useOverviewStore';
import { Button } from '../Core/ui/button';
import RemoveButton from '../Core/ui/RemoveButton';
import * as Icons from 'lucide-react';

// Technical Cable Dictionary
const CABLE_TYPES: Record<string, any> = {
  audio_ts: { label: "Jack 6.35 to Jack 6.35 (Mono)", category: "audio", color: "#f97316", stroke: 3, dash: "none", marker: "url(#arrowOrange)", filter: "url(#glowOrange)" },
  audio_trs: { label: "TRS to TRS (Stereo)", category: "audio", color: "#06b6d4", stroke: 4, dash: "none", marker: "url(#arrowCyan)", filter: "url(#glowCyan)" },
  audio_jack_to_minijack: { label: "Jack 6.35 to Mini Jack 3.5", category: "audio", color: "#a855f7", stroke: 3, dash: "none", marker: "url(#arrowPurple)", filter: "url(#glowPurple)" },
  audio_minijack_to_dual_trs: { label: "Mini Jack to TRS Left/Right (Y cable)", category: "audio", color: "#f472b6", stroke: 4, dash: "none", marker: "url(#arrowPink)", filter: "none" },
  audio_trs_to_xlr: { label: "TRS to XLR", category: "audio", color: "#2dd4bf", stroke: 4, dash: "none", marker: "url(#arrowTeal)", filter: "none" },
  audio_xlr_to_xlr: { label: "XLR to XLR", category: "audio", color: "#fb7185", stroke: 4, dash: "none", marker: "url(#arrowRose)", filter: "none" },
  midi_din: { label: "5-Pin MIDI DIN", category: "midi", color: "#10b981", stroke: 3, dash: "6 4", marker: "url(#arrowEmerald)", filter: "none" },
  midi_din_to_trs: { label: "MIDI DIN to TRS Type A", category: "midi", color: "#34d399", stroke: 3, dash: "6 4", marker: "url(#arrowEmerald)", filter: "none" },
  midi_usb: { label: "USB Type-B to Type-A", category: "midi", color: "#3b82f6", stroke: 3, dash: "3 3", marker: "url(#arrowBlue)", filter: "none" }
};

// Logical MIDI Cables
const LOGICAL_CABLE_TYPES: Record<string, any> = {
  channel_1: { label: "Ch 1", category: "logical", color: "#f87171", stroke: 3, dash: "4 4", marker: "url(#arrowRed)", filter: "none" },
  channel_2: { label: "Ch 2", category: "logical", color: "#fb923c", stroke: 3, dash: "4 4", marker: "url(#arrowOrange)", filter: "none" },
  channel_3: { label: "Ch 3", category: "logical", color: "#fbbf24", stroke: 3, dash: "4 4", marker: "url(#arrowYellow)", filter: "none" },
  channel_4: { label: "Ch 4", category: "logical", color: "#a3e635", stroke: 3, dash: "4 4", marker: "url(#arrowLime)", filter: "none" },
  channel_5: { label: "Ch 5", category: "logical", color: "#4ade80", stroke: 3, dash: "4 4", marker: "url(#arrowGreen)", filter: "none" },
  channel_6: { label: "Ch 6", category: "logical", color: "#34d399", stroke: 3, dash: "4 4", marker: "url(#arrowEmerald)", filter: "none" },
  channel_7: { label: "Ch 7", category: "logical", color: "#2dd4bf", stroke: 3, dash: "4 4", marker: "url(#arrowTeal)", filter: "none" },
  channel_8: { label: "Ch 8", category: "logical", color: "#22d3ee", stroke: 3, dash: "4 4", marker: "url(#arrowCyan)", filter: "none" },
  channel_9: { label: "Ch 9", category: "logical", color: "#38bdf8", stroke: 3, dash: "4 4", marker: "url(#arrowSky)", filter: "none" },
  channel_10: { label: "Ch 10", category: "logical", color: "#60a5fa", stroke: 3, dash: "4 4", marker: "url(#arrowBlue)", filter: "none" },
  channel_11: { label: "Ch 11", category: "logical", color: "#818cf8", stroke: 3, dash: "4 4", marker: "url(#arrowIndigo)", filter: "none" },
  channel_12: { label: "Ch 12", category: "logical", color: "#a78bfa", stroke: 3, dash: "4 4", marker: "url(#arrowViolet)", filter: "none" },
  channel_13: { label: "Ch 13", category: "logical", color: "#c084fc", stroke: 3, dash: "4 4", marker: "url(#arrowPurple)", filter: "none" },
  channel_14: { label: "Ch 14", category: "logical", color: "#e879f9", stroke: 3, dash: "4 4", marker: "url(#arrowFuchsia)", filter: "none" },
  channel_15: { label: "Ch 15", category: "logical", color: "#f472b6", stroke: 3, dash: "4 4", marker: "url(#arrowPink)", filter: "none" },
  channel_16: { label: "Ch 16", category: "logical", color: "#fb7185", stroke: 3, dash: "4 4", marker: "url(#arrowRose)", filter: "none" },
};


const getPortsForNode = (blueprint: any) => {
  if (!blueprint || !blueprint.ports) return [];
  // Resolve side and offset into x,y coordinates relative to node top-left
  return blueprint.ports.map((p: any) => {
    let x = 0;
    let y = 0;
    if (p.side === 'left') {
      x = 0;
      y = p.offset;
    } else if (p.side === 'right') {
      x = blueprint.width;
      y = p.offset;
    } else if (p.side === 'top') {
      x = p.offset;
      y = 0;
    } else if (p.side === 'bottom') {
      x = p.offset;
      // rough estimate of height since it's variable. Let's assume nodes are visually ~150px-200px tall. We'll stick to left/right for now for reliability.
      y = 150; 
    }
    return { ...p, x, y };
  });
};

export default function OverviewTab() {

  useEffect(() => {
    // Initialize if empty
    const savedNodes = localStorage.getItem('alienmind_nodes_v4');
    const savedConnections = localStorage.getItem('alienmind_connections_v4');
    if (Object.keys(nodes).length === 0) {
       if (savedNodes) setNodes(() => JSON.parse(savedNodes));
       else setNodes(() => DEFAULT_NODES);
       if (savedConnections) setConnections(() => JSON.parse(savedConnections));
       else setConnections(() => DEFAULT_CONNECTIONS);
    }
  }, []);

  const { setActiveMainView } = useUIStore();
  const { nodes, connections, routingMode, setNodes, setConnections, setRoutingMode, resetLayout, autoArrange, saveLayout, copyLayout, removeNode } = useOverviewStore();
  const [draggingNode, setDraggingNode] = useState<any>(null);
  const [draggedCable, setDraggedCable] = useState<any>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const computedLogicalConnections = useMemo(() => {
    if (routingMode !== 'logical') return {};
    const conns: Record<string, OverviewConnection> = {};
    Object.values(nodes).forEach(sourceNode => {
      let outs: { id: string, name: string, channel: number | null }[] = [];
      if (sourceNode.type === 'circuit' && sourceNode.circuitLogicalOuts) {
        outs = [
          { id: 'synth1', name: 'Synth 1', channel: sourceNode.circuitLogicalOuts.synth1 ?? null },
          { id: 'synth2', name: 'Synth 2', channel: sourceNode.circuitLogicalOuts.synth2 ?? null },
          { id: 'midi1', name: 'MIDI 1', channel: sourceNode.circuitLogicalOuts.midi1 ?? null },
          { id: 'midi2', name: 'MIDI 2', channel: sourceNode.circuitLogicalOuts.midi2 ?? null }
        ];
      } else if (sourceNode.logicalOutChannel) {
        outs = [{ id: 'out1', name: 'Output', channel: sourceNode.logicalOutChannel }];
      }
      
      outs.forEach(out => {
        if (!out.channel) return;
        Object.values(nodes).forEach(targetNode => {
          if (targetNode.id === sourceNode.id) return;
          if (targetNode.logicalInChannel === out.channel) {
             const cId = `lc_${sourceNode.id}_${targetNode.id}_${out.channel}`;
             conns[cId] = {
               id: cId,
               source: sourceNode.id,
               target: targetNode.id,
               type: `channel_${out.channel}`,
               label: out.name,
               startOffset: { x: 100, y: 50 },
               endOffset: { x: 50, y: 50 }
             };
          }
        });
      });
    });
    return conns;
  }, [nodes, routingMode]);
  const [pan, setPan] = useState<{x: number, y: number}>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<any>(null);
  const [maxZIndex, setMaxZIndex] = useState(30);
  const [editingLabel, setEditingLabel] = useState<any>(null);
  const [draggedLabel, setDraggedLabel] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(zoom);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  const panRef = useRef(pan);
  useEffect(() => { panRef.current = pan; }, [pan]);

  // Touch gesture & pointer tracking
  const activePointers = useRef<Map<number, PointerEvent>>(new Map());
  const [isPinching, setIsPinching] = useState(false);
  const isPinchingRef = useRef(isPinching);
  useEffect(() => { isPinchingRef.current = isPinching; }, [isPinching]);
  const pinchStartRef = useRef<{
    distance: number;
    zoom: number;
    pan: { x: number; y: number };
    midpoint: { x: number; y: number };
  } | null>(null);

  // Auto-fit function to adjust zoom/pan to fit all nodes on screen
  const fitToContainer = () => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const containerWidth = rect.width;
    const containerHeight = rect.height;

    if (containerWidth === 0 || containerHeight === 0) return;

    const activeNodes = Object.values(nodes);
    if (activeNodes.length === 0) return;

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    activeNodes.forEach(node => {
      const blueprint = HARDWARE_LIBRARY[node.type];
      const width = blueprint?.width || 300;
      const height = 400; // estimated height
      
      if (node.x < minX) minX = node.x;
      if (node.x + width > maxX) maxX = node.x + width;
      if (node.y < minY) minY = node.y;
      if (node.y + height > maxY) maxY = node.y + height;
    });

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    const padding = 60;
    const targetWidth = contentWidth + padding * 2;
    const targetHeight = contentHeight + padding * 2;

    const zoomX = containerWidth / targetWidth;
    const zoomY = containerHeight / targetHeight;
    const newZoom = Math.max(0.1, Math.min(3, Math.min(zoomX, zoomY)));

    const newPanX = (containerWidth - contentWidth * newZoom) / 2 - minX * newZoom;
    const newPanY = (containerHeight - contentHeight * newZoom) / 2 - minY * newZoom;

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  // Run fit once initially on load
  const initialFitRef = useRef(false);
  useEffect(() => {
    if (Object.keys(nodes).length > 0 && containerRef.current && !initialFitRef.current) {
      const timer = setTimeout(() => {
        fitToContainer();
        initialFitRef.current = true;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [nodes]);

  // Maintain fitting on resize
  useEffect(() => {
    const handleResize = () => {
      if (initialFitRef.current) {
        fitToContainer();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [nodes]);

  // Global tracking of pointer events to coordinate gestures properly
  useEffect(() => {
    const handleGlobalPointerDown = (e: PointerEvent) => {
      activePointers.current.set(e.pointerId, e);

      if (activePointers.current.size === 2) {
        // Cancel ongoing node/cable drags
        setDraggingNode(null);
        setDraggedCable(null);
        setDraggedLabel(null);
        setIsPanning(false);
        setHoveredNodeId(null);
        
        setIsPinching(true);
        
        const pointers = Array.from(activePointers.current.values());
        const p1 = pointers[0]!;
        const p2 = pointers[1]!;
        const dx = p1.clientX - p2.clientX;
        const dy = p1.clientY - p2.clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const midpoint = {
          x: (p1.clientX + p2.clientX) / 2,
          y: (p1.clientY + p2.clientY) / 2
        };

        pinchStartRef.current = {
          distance,
          zoom: zoomRef.current,
          pan: { ...panRef.current },
          midpoint
        };
      }
    };

    const handleGlobalPointerUp = (e: PointerEvent) => {
      activePointers.current.delete(e.pointerId);
      
      if (activePointers.current.size < 2) {
        setIsPinching(false);
        pinchStartRef.current = null;
      }
      
      if (activePointers.current.size === 0) {
        setIsPanning(false);
        setPanStart(null);
      } else if (activePointers.current.size === 1) {
        // If we were pinching, transition the remaining pointer to panning
        if (isPinchingRef.current) {
          const remainingPointer = Array.from(activePointers.current.values())[0]!;
          setIsPanning(true);
          setPanStart({
            x: remainingPointer.clientX - panRef.current.x,
            y: remainingPointer.clientY - panRef.current.y
          });
        }
      }
    };

    window.addEventListener('pointerdown', handleGlobalPointerDown);
    window.addEventListener('pointerup', handleGlobalPointerUp, { capture: true });
    window.addEventListener('pointercancel', handleGlobalPointerUp, { capture: true });

    return () => {
      window.removeEventListener('pointerdown', handleGlobalPointerDown);
      window.removeEventListener('pointerup', handleGlobalPointerUp, { capture: true });
      window.removeEventListener('pointercancel', handleGlobalPointerUp, { capture: true });
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const prevZoom = zoomRef.current;
        const prevPan = panRef.current;
        const zoomDelta = -e.deltaY * 0.01;
        const newZoom = Math.max(0.1, Math.min(3, prevZoom * Math.exp(zoomDelta)));
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const newPanX = mouseX - (mouseX - prevPan.x) * (newZoom / prevZoom);
        const newPanY = mouseY - (mouseY - prevPan.y) * (newZoom / prevZoom);
        setZoom(newZoom);
        setPan({ x: newPanX, y: newPanY });
      }
    };
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  // Load from local storage
  useEffect(() => {
    const savedNodes = localStorage.getItem('alienmind_nodes_v4');
    const savedConns = localStorage.getItem('alienmind_connections_v4');
    if (savedNodes && savedConns) {
      try {
        setNodes(JSON.parse(savedNodes));
        setConnections(JSON.parse(savedConns));
      } catch (e: any) {
        console.error("Failed to load layout");
      }
    }
  }, []);

  const getConnectedNode = (nodeId: string, portType: string) => {
     const conns = Object.values(connections);
     if (portType === 'audioIn') {
        const c = conns.find(c => c.target === nodeId && c.type.includes('audio'));
        return c ? c.source : "";
     }
     if (portType === 'audioOut') {
        const c = conns.find(c => c.source === nodeId && c.type.includes('audio'));
        return c ? c.target : "";
     }
     if (portType === 'midiIn') {
        const c = conns.find(c => c.target === nodeId && c.type.includes('midi'));
        return c ? c.source : "";
     }
     if (portType === 'midiOut') {
        const c = conns.find(c => c.source === nodeId && c.type.includes('midi'));
        return c ? c.target : "";
     }
     return "";
  };

  const handlePortSelect = (nodeId: string, portType: string, selectedNodeId: string) => {
    setConnections(prev => {
      const newConns = { ...prev };
      
      let existingId = null;
      for (const [id, c] of Object.entries(newConns)) {
         if (portType === 'audioIn' && c.target === nodeId && c.type.includes('audio')) { existingId = id; break; }
         if (portType === 'audioOut' && c.source === nodeId && c.type.includes('audio')) { existingId = id; break; }
         if (portType === 'midiIn' && c.target === nodeId && c.type.includes('midi')) { existingId = id; break; }
         if (portType === 'midiOut' && c.source === nodeId && c.type.includes('midi')) { existingId = id; break; }
      }

      if (!selectedNodeId) {
         if (existingId) delete newConns[existingId];
      } else {
         if (existingId) {
            if (portType.includes('In')) newConns[existingId]!.source = selectedNodeId;
            if (portType.includes('Out')) newConns[existingId]!.target = selectedNodeId;
         } else {
            const newId = `c_auto_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            const isAudio = portType.includes('audio');
            const cableType = isAudio ? 'audio_ts' : 'midi_din';
            newConns[newId] = {
               id: newId,
               source: portType.includes('In') ? selectedNodeId : nodeId,
               target: portType.includes('In') ? nodeId : selectedNodeId,
               type: cableType,
               label: CABLE_TYPES[cableType].label,
               startOffset: { x: 50, y: 50 },
               endOffset: { x: 50, y: 50 }
            };
         }
      }
      return newConns;
    });
  };
  const handleNodeMouseDown = (nodeId: string, e: React.PointerEvent) => {
    if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'svg', 'path', 'circle'].includes((e.target as Element).tagName) || (e.target as Element).closest('button')) return;
    
    e.stopPropagation();
    const newZIndex = maxZIndex + 1;
    setMaxZIndex(newZIndex);
    
    setDraggingNode({
      id: nodeId,
      startX: e.clientX,
      startY: e.clientY,
      initialNodeX: nodes[nodeId]!.x,
      initialNodeY: nodes[nodeId]!.y,
    });
    setNodes(prev => ({ ...prev, [nodeId]: { ...prev[nodeId]! as OverviewNode, zIndex: newZIndex } }));
  };

  const handleNodeDoubleClick = (nodeId: string, e: React.MouseEvent) => {
    if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'svg', 'path', 'circle'].includes((e.target as Element).tagName) || (e.target as Element).closest('button')) return;
    
    e.stopPropagation();
    const nodeState = nodes[nodeId]!;
    if (nodeState.type === 'circuit') {
       setActiveMainView('circuit');
    } else {
       alert(`The configuration panel for the ${HARDWARE_LIBRARY[nodeState.type]?.model} is not yet implemented.`);
    }
  };

  const toggleExpand = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNodes(prev => ({...prev, [nodeId]: {...prev[nodeId]! as OverviewNode, isExpanded: !prev[nodeId]!.isExpanded}}));
  };

  const toggleHardwareExpand = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNodes(prev => ({...prev, [nodeId]: {...prev[nodeId]! as OverviewNode, isHardwareExpanded: prev[nodeId]!.isHardwareExpanded === false ? true : false}}));
  };

  const handleCableDragStart = (e: React.PointerEvent, connId: string, endpoint: string) => {
    if (routingMode === 'logical') return;
    e.stopPropagation();
    const rect = containerRef.current!.getBoundingClientRect();
    setDraggedCable({
        id: connId,
        endpoint: endpoint,
        x: (e.clientX - rect.left - pan.x) / zoomRef.current,
        y: (e.clientY - rect.top - pan.y) / zoomRef.current
    });
  };

  const handleMouseMove = (e: any) => {
    // Keep track of moving touch points
    if (activePointers.current.has(e.pointerId)) {
      activePointers.current.set(e.pointerId, e);
    }

    // Handle 2-finger pinch gesture calculations
    if (isPinchingRef.current && pinchStartRef.current && activePointers.current.size === 2) {
      const pointers = Array.from(activePointers.current.values());
      const p1 = pointers[0]!;
      const p2 = pointers[1]!;
      
      const dx = p1.clientX - p2.clientX;
      const dy = p1.clientY - p2.clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      const midpoint = {
        x: (p1.clientX + p2.clientX) / 2,
        y: (p1.clientY + p2.clientY) / 2
      };

      const scale = distance / pinchStartRef.current.distance;
      const newZoom = Math.max(0.1, Math.min(3, pinchStartRef.current.zoom * scale));

      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        const localX = midpoint.x - rect.left;
        const localY = midpoint.y - rect.top;
        
        const midDeltaX = midpoint.x - pinchStartRef.current.midpoint.x;
        const midDeltaY = midpoint.y - pinchStartRef.current.midpoint.y;

        const zoomRatio = newZoom / pinchStartRef.current.zoom;
        const newPanX = localX - (localX - (pinchStartRef.current.pan.x + midDeltaX)) * zoomRatio;
        const newPanY = localY - (localY - (pinchStartRef.current.pan.y + midDeltaY)) * zoomRatio;

        setZoom(newZoom);
        setPan({ x: newPanX, y: newPanY });
      }
      return;
    }

    if (draggedLabel && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left - pan.x) / zoomRef.current;
        const mouseY = (e.clientY - rect.top - pan.y) / zoomRef.current;
        setConnections(prev => {
            if (!prev[draggedLabel]) return prev;
            return {
                ...prev,
                [draggedLabel]: {
                    ...prev[draggedLabel] as OverviewConnection,
                    midPoint: { x: mouseX, y: mouseY }
                }
            };
        });
        return;
    }

    if (isPanning && panStart) {
       setPan({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y
       });
       return;
    }

    if (draggingNode) {
      setNodes(prev => ({
        ...prev,
        [draggingNode.id]: {
          ...prev[draggingNode.id],
          x: draggingNode.initialNodeX + (e.clientX - draggingNode.startX) / zoomRef.current,
          y: draggingNode.initialNodeY + (e.clientY - draggingNode.startY) / zoomRef.current
        }
      }));
    } else if (draggedCable && containerRef.current) {
      const rect = containerRef.current!.getBoundingClientRect();
      setDraggedCable((prev: any) => ({
          ...prev,
          x: (e.clientX - rect.left - pan.x) / zoomRef.current,
          y: (e.clientY - rect.top - pan.y) / zoomRef.current
      }));

      const elements = document.elementsFromPoint(e.clientX, e.clientY);
      const hitNodeEl = elements.find(el => el.classList && el.classList.contains('hardware-node'));
      if (hitNodeEl) {
         setHoveredNodeId(hitNodeEl.getAttribute('data-id'));
      } else {
         setHoveredNodeId(null);
      }
    }
  };

  const handleMouseUp = (e: any) => {
    // Register touch release
    activePointers.current.delete(e.pointerId);

    // If another pointer is still active (e.g. multi-touch), don't end interaction yet
    if (activePointers.current.size > 0) {
      if (activePointers.current.size === 1 && isPinchingRef.current) {
        // Transition remaining pointer to panning
        const remainingPointer = Array.from(activePointers.current.values())[0]!;
        setIsPanning(true);
        setPanStart({
          x: remainingPointer.clientX - panRef.current.x,
          y: remainingPointer.clientY - panRef.current.y
        });
        setIsPinching(false);
        pinchStartRef.current = null;
      }
      return;
    }

    // Handle cable drop target assignment
    if (routingMode !== 'logical' && draggedCable && containerRef.current) {
       const elements = document.elementsFromPoint(e.clientX, e.clientY);
       const hitNodeEl = elements.find(el => el.classList && el.classList.contains('hardware-node'));
       
       if (hitNodeEl) {
           const nodeId = hitNodeEl.getAttribute('data-id');
           if (nodeId) {
               const rect = containerRef.current.getBoundingClientRect();
               const canvasX = e.clientX - rect.left - pan.x;
               const canvasY = e.clientY - rect.top - pan.y;
               
                setConnections(prev => {
                    const newConns = { ...prev };
                    const conn = { ...newConns[draggedCable.id] };
                    const targetNode = nodes[nodeId]!;
                    const blueprint = HARDWARE_LIBRARY[targetNode.type];
                    
                    let closestPort = null;
                    let minDistance = Infinity;
                    if (blueprint) {
                        const ports = getPortsForNode(blueprint);
                        for (const p of ports) {
                           const px = targetNode.x + p.x;
                           const py = targetNode.y + p.y;
                           const dist = Math.hypot(px - canvasX, py - canvasY);
                           if (dist < minDistance) {
                               minDistance = dist;
                               closestPort = p;
                           }
                        }
                    }
                    
                    if (draggedCable.endpoint === 'source') {
                        conn.source = nodeId;
                        if (closestPort && minDistance < 50) {
                            conn.sourcePort = closestPort.id;
                            conn.startOffset = { x: closestPort.x, y: closestPort.y };
                        } else {
                            conn.sourcePort = undefined;
                            conn.startOffset = { x: canvasX - targetNode.x, y: canvasY - targetNode.y };
                        }
                    } else {
                        conn.target = nodeId;
                        if (closestPort && minDistance < 50) {
                            conn.targetPort = closestPort.id;
                            conn.endOffset = { x: closestPort.x, y: closestPort.y };
                        } else {
                            conn.targetPort = undefined;
                            conn.endOffset = { x: canvasX - targetNode.x, y: canvasY - targetNode.y };
                        }
                    }
                    newConns[draggedCable.id] = conn as OverviewConnection;
                   return newConns;
               });
           }
       }
    }

    // Unconditionally clean up ALL mouse interaction states
    setDraggedLabel(null);
    setDraggedCable(null);
    setIsPanning(false);
    setPanStart(null);
    setHoveredNodeId(null);
    setDraggingNode(null);
    setIsPinching(false);
    pinchStartRef.current = null;
  };

  const handleMouseMoveRef = useRef(handleMouseMove);
  const handleMouseUpRef = useRef(handleMouseUp);
  
  useEffect(() => {
    handleMouseMoveRef.current = handleMouseMove;
    handleMouseUpRef.current = handleMouseUp;
  });

  useEffect(() => {
    if (draggingNode || draggedCable || draggedLabel || isPanning || isPinching) {
      document.body.style.userSelect = 'none';
      const moveHandler = (e: any) => handleMouseMoveRef.current(e);
      const upHandler = (e: any) => handleMouseUpRef.current(e);
      
      window.addEventListener('pointermove', moveHandler);
      window.addEventListener('pointerup', upHandler);
      window.addEventListener('pointercancel', upHandler);
      
      return () => {
        document.body.style.userSelect = '';
        window.removeEventListener('pointermove', moveHandler);
        window.removeEventListener('pointerup', upHandler);
        window.removeEventListener('pointercancel', upHandler);
      };
    }
  }, [!!draggingNode, !!draggedCable, !!draggedLabel, isPanning, isPinching]);

  const handleCanvasMouseDown = (e: any) => {
    if ((e.target as Element).closest('.hardware-node') || (e.target as Element).closest('header') || (e.target as Element).closest('button')) return;
    
    // Disable pointer capture for touch events to avoid scrolling interference
    if (e.pointerType === 'touch') {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }
    
    if (activePointers.current.size <= 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-neutral-900 overflow-hidden text-neutral-800 dark:text-neutral-200">
      <div className="flex flex-1 min-h-0">
        
        {/* Left Panel */}
        <div className="w-64 bg-card border-r border-border p-4 flex flex-col gap-4 overflow-y-auto z-10 shrink-0 text-card-foreground">
          <div className="flex flex-col gap-2">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Routing Mode</h2>
            <Button
              variant={routingMode === 'physical' ? 'default' : 'secondary'}
              onClick={() => setRoutingMode('physical')}
              className="w-full justify-start font-semibold shadow-md"
            >
              <Icons.Cable className="mr-2" size={16} />
              Physical Cabling
            </Button>
            <Button
              variant={routingMode === 'logical' ? 'default' : 'secondary'}
              onClick={() => setRoutingMode('logical')}
              className="w-full justify-start font-semibold shadow-md"
            >
              <Icons.Network className="mr-2" size={16} />
              Logical MIDI
            </Button>
          </div>

          <hr className="border-border my-2" />

          <div className="flex flex-col gap-2">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Layout Actions</h2>
            <Button variant="secondary" onClick={() => resetLayout(DEFAULT_NODES, DEFAULT_CONNECTIONS)} className="w-full justify-start shadow-sm">
              <Icons.RefreshCw size={14} className="mr-2" /> Reset
            </Button>
            <Button variant="secondary" onClick={() => autoArrange({ circuit: 350, grind: 200, s1: 300, minifreak: 400, flow8: 300, ableton: 350 })} className="w-full justify-start shadow-sm">
              <Icons.LayoutGrid size={14} className="mr-2" /> Rearrange
            </Button>
            <Button variant="default" onClick={saveLayout} onDoubleClick={copyLayout} className="w-full justify-start shadow-md">
              <Icons.Save size={14} className="mr-2" /> Save
            </Button>
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 w-full bg-neutral-100 dark:bg-neutral-900 p-6 font-sans flex flex-col items-center selection:bg-cyan-500/30">
          <div 
            ref={containerRef}
            className="relative flex-1 w-full bg-white/50 dark:bg-neutral-950/50 rounded-xl border border-black/5 dark:border-white/5 shadow-2xl overflow-hidden touch-none text-black/5 dark:text-white/5"
            onPointerDown={handleCanvasMouseDown}
            style={{
              backgroundImage: 'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)',
              backgroundPosition: `${pan.x}px ${pan.y}px`,
              backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
              cursor: isPanning ? 'grabbing' : 'grab'
            }}
          >
            <div className="absolute inset-0 w-full h-full pointer-events-none" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0' }}>
        
        {/* SVG Canvas for Cables */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ overflow: 'visible' }}>
          <defs>
            {/* Enlarged Marker sizes for clearer arrows */}
            <marker id="arrowCyan" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#06b6d4" /></marker>
            <marker id="arrowOrange" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#f97316" /></marker>
            <marker id="arrowPurple" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#a855f7" /></marker>
            <marker id="arrowBlue" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#3b82f6" /></marker>
            <marker id="arrowEmerald" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#10b981" /></marker>
            <marker id="arrowRed" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#f87171" /></marker>
            <marker id="arrowYellow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#fbbf24" /></marker>
            <marker id="arrowLime" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#a3e635" /></marker>
            <marker id="arrowGreen" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#4ade80" /></marker>
            <marker id="arrowTeal" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#2dd4bf" /></marker>
            <marker id="arrowSky" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#38bdf8" /></marker>
            <marker id="arrowIndigo" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#818cf8" /></marker>
            <marker id="arrowViolet" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#a78bfa" /></marker>
            <marker id="arrowFuchsia" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#e879f9" /></marker>
            <marker id="arrowPink" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#f472b6" /></marker>
            <marker id="arrowRose" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#fb7185" /></marker>
            
            <filter id="glowCyan"><feGaussianBlur stdDeviation="2" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over"/></filter>
            <filter id="glowOrange"><feGaussianBlur stdDeviation="2" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over"/></filter>
            <filter id="glowPurple"><feGaussianBlur stdDeviation="3" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over"/></filter>
          </defs>

          {[
            ...Object.entries(connections).map(([id, conn]) => ({ id, conn: conn as OverviewConnection, isLogical: false, isActive: routingMode === 'physical' })),
            ...Object.entries(computedLogicalConnections).map(([id, conn]) => ({ id, conn: conn as OverviewConnection, isLogical: true, isActive: routingMode === 'logical' }))
          ].map(({ id, conn, isLogical, isActive }) => {
            const isDraggingStart = draggedCable?.id === id && draggedCable?.endpoint === 'source';
            const isDraggingEnd = draggedCable?.id === id && draggedCable?.endpoint === 'target';

            const sourceNode = nodes[conn.source];
            const targetNode = nodes[conn.target];
            if (!sourceNode || !targetNode) return null;

            const sourcePorts = getPortsForNode(HARDWARE_LIBRARY[sourceNode.type]);
            const targetPorts = getPortsForNode(HARDWARE_LIBRARY[targetNode.type]);

            const sourcePortDef = conn.sourcePort ? sourcePorts.find((p: any) => p.id === conn.sourcePort) : null;
            const targetPortDef = conn.targetPort ? targetPorts.find((p: any) => p.id === conn.targetPort) : null;

            const startX = isDraggingStart ? draggedCable.x : sourceNode.x + (sourcePortDef ? sourcePortDef.x : conn.startOffset.x);
            const startY = isDraggingStart ? draggedCable.y : sourceNode.y + (sourcePortDef ? sourcePortDef.y : conn.startOffset.y);
            const endX = isDraggingEnd ? draggedCable.x : targetNode.x + (targetPortDef ? targetPortDef.x : conn.endOffset.x);
            const endY = isDraggingEnd ? draggedCable.y : targetNode.y + (targetPortDef ? targetPortDef.y : conn.endOffset.y);
            
            if(startX === undefined || endX === undefined) return null;

            let pathData = "";
            if (conn.midPoint) {
               const cx = 2 * conn.midPoint.x - 0.5 * startX - 0.5 * endX;
               const cy = 2 * conn.midPoint.y - 0.5 * startY - 0.5 * endY;
               pathData = `M ${startX} ${startY} Q ${cx} ${cy}, ${endX} ${endY}`;
            } else {
               // Dynamic control points based on port side
               const startSide = sourcePortDef ? sourcePortDef.side : 'right';
               const endSide = targetPortDef ? targetPortDef.side : 'left';

               const startControlX = startX + (startSide === 'left' ? -100 : startSide === 'right' ? 100 : 0);
               const startControlY = startY + (startSide === 'top' ? -100 : startSide === 'bottom' ? 100 : 0);
               
               const endControlX = endX + (endSide === 'left' ? -100 : endSide === 'right' ? 100 : 0);
               const endControlY = endY + (endSide === 'top' ? -100 : endSide === 'bottom' ? 100 : 0);
               
               pathData = `M ${startX} ${startY} C ${startControlX} ${startControlY}, ${endControlX} ${endControlY}, ${endX} ${endY}`;
            }
            
            const style = isLogical ? LOGICAL_CABLE_TYPES[conn.type] : CABLE_TYPES[conn.type];
            if (!style) return null;
            return (
              <g key={`cable-${id}`} style={{ opacity: isActive ? 1 : 0.15, pointerEvents: isActive ? "auto" : "none", transition: "opacity 0.3s" }}>
                <path d={pathData} stroke={style.color} strokeWidth={style.stroke} fill="none" markerEnd={isDraggingEnd ? "" : style.marker} filter={style.filter} strokeDasharray={style.dash} className={style.animate ? "animate-pulse" : ""} />
                {/* Draggable Handles */}
                <circle cx={startX} cy={startY} r="6" fill={style.color} className="cursor-move hover:scale-150 transition-transform shadow-lg drop-shadow-md" style={{pointerEvents: 'auto'}} onPointerDown={(e: any) => handleCableDragStart(e, id, 'source')} />
                <circle cx={endX} cy={endY} r="6" fill={style.color} className="cursor-move hover:scale-150 transition-transform shadow-lg drop-shadow-md" style={{pointerEvents: 'auto'}} onPointerDown={(e: any) => handleCableDragStart(e, id, 'target')} />
              </g>
            );
          })}
          {draggedCable && (
             <circle cx={draggedCable.x} cy={draggedCable.y} r="5" fill="#06b6d4" />
          )}
        </svg>

        {/* Cable Labels (Editable) */}
        {[
            ...Object.entries(connections).map(([id, conn]) => ({ id, conn, isLogical: false, isActive: routingMode === 'physical' })),
            ...Object.entries(computedLogicalConnections).map(([id, conn]) => ({ id, conn, isLogical: true, isActive: routingMode === 'logical' }))
          ].map(({ id, conn, isLogical }) => {
            const isDraggingStart = draggedCable?.id === id && draggedCable?.endpoint === 'source';
            const isDraggingEnd = draggedCable?.id === id && draggedCable?.endpoint === 'target';
            const startX = isDraggingStart ? draggedCable.x : nodes[conn.source]!.x + conn.startOffset.x;
            const startY = isDraggingStart ? draggedCable.y : nodes[conn.source]!.y + conn.startOffset.y;
            const endX = isDraggingEnd ? draggedCable.x : nodes[conn.target]!.x + conn.endOffset.x;
            const endY = isDraggingEnd ? draggedCable.y : nodes[conn.target]!.y + conn.endOffset.y;
            if(startX === undefined || endX === undefined) return null;

            const getBezier = (t: number, p0: number, p1: number, p2: number, p3: number) => {
               const mt = 1 - t;
               return mt*mt*mt*p0 + 3*mt*mt*t*p1 + 3*mt*t*t*p2 + t*t*t*p3;
            };

            let midX, midY;
            if (conn.midPoint) {
                midX = conn.midPoint.x;
                midY = conn.midPoint.y;
            } else if (conn.type.includes('midi')) {
               const controlY = startY - 100;
               midX = getBezier(0.5, startX, startX, endX, endX);
               midY = getBezier(0.5, startY, controlY, controlY, endY);
            } else {
               midX = getBezier(0.5, startX, startX + 100, endX - 100, endX);
               midY = getBezier(0.5, startY, startY, endY, endY);
            }
            
            const style = isLogical ? LOGICAL_CABLE_TYPES[conn.type] : CABLE_TYPES[conn.type];
            if (!style) return null;

            return (
              <div key={`label-${id}`} className="absolute z-20 pointer-events-none" style={{ left: midX, top: midY, transform: 'translate(-50%, -50%)' }}>
                 {editingLabel === id ? (
                   <input
                     autoFocus
                     defaultValue={conn.label}
                     className="bg-neutral-900 text-white text-xs px-2 py-1 rounded border border-neutral-500 outline-none w-28 text-center pointer-events-auto"
                     onBlur={(e: any) => {
                       setConnections(prev => ({...prev, [id]: {...prev[id]! as OverviewConnection, label: e.target.value}}));
                       setEditingLabel(null);
                     }}
                     onKeyDown={(e: any) => e.key === 'Enter' && e.target.blur()}
                   />
                 ) : (
                   <div 
                     onPointerDown={(e) => { e.stopPropagation(); setDraggedLabel(id); }}
                     onDoubleClick={() => setEditingLabel(id)}
                     className="px-2 py-1 rounded border backdrop-blur-sm text-[10px] font-bold cursor-move hover:scale-110 transition-transform whitespace-nowrap pointer-events-auto"
                     style={{ color: style.color, borderColor: style.color, backgroundColor: 'rgba(20,20,20,0.8)' }}
                   >
                     {conn.label}
                   </div>
                 )}
              </div>
            );
        })}

        {/* Hardware Nodes Rendering */}
        {Object.keys(nodes).map(nodeId => {
          const nodeState = nodes[nodeId]!;
          const blueprint = HARDWARE_LIBRARY[nodeState.type];
          if (!blueprint) return null;
          const isExpanded = nodeState.isExpanded !== false;
          const isHardwareExpanded = nodeState.isHardwareExpanded !== false;

          return (
            <div 
              key={nodeId}
              data-id={nodeId}
              className={`hardware-node group pointer-events-auto absolute bg-neutral-900 rounded-xl border-t-4 shadow-2xl flex flex-col cursor-grab active:cursor-grabbing transition-transform duration-200 ${hoveredNodeId === nodeId ? 'ring-4 ring-cyan-500 shadow-[0_0_40px_rgba(6,182,212,0.6)] scale-[1.02] z-[100]' : 'hover:ring-2 ring-white/10'} ${blueprint.theme.border}`}
              style={{ left: nodeState.x, top: nodeState.y, zIndex: hoveredNodeId === nodeId ? 100 : nodeState.zIndex, width: blueprint.width }}
              onPointerDown={(e: any) => handleNodeMouseDown(nodeId, e)}
              onDoubleClick={(e: any) => handleNodeDoubleClick(nodeId, e)}
            >
              <RemoveButton onClick={() => removeNode(nodeId)} title="Remove Device" />

              {/* Port Dots */}
              {getPortsForNode(blueprint).map((port: any) => (
                 <div 
                   key={port.id}
                   className="absolute w-3 h-3 rounded-full border-2 border-neutral-900 z-50 pointer-events-none shadow-md"
                   style={{
                     backgroundColor: port.color,
                     left: port.side === 'left' ? -6 : (port.side === 'top' || port.side === 'bottom') ? port.x - 6 : 'auto',
                     right: port.side === 'right' ? -6 : 'auto',
                     top: port.side === 'top' ? -6 : (port.side === 'left' || port.side === 'right') ? port.y - 6 : 'auto',
                     bottom: port.side === 'bottom' ? -6 : 'auto'
                   }}
                   title={port.title}
                 />
              ))}

              {/* Header */}
              <div className={`p-2 flex justify-between items-center rounded-t-lg ${blueprint.theme.header}`}>
                <div>
                  <h3 className={`font-black tracking-tight leading-none ${blueprint.theme.title}`}>{blueprint.model}</h3>
                  <span className="text-[10px] text-neutral-400">{blueprint.brand}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold tracking-widest whitespace-nowrap ${blueprint.theme.badge}`}>{blueprint.tagline}</span>
                  <button onClick={(e: any) => toggleHardwareExpand(nodeId, e)} className="text-neutral-400 hover:text-white transition-colors focus:outline-none ml-1">
                    {isHardwareExpanded ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                  </button>
                </div>
              </div>

              {/* Graphic SVG Component */}
              {isHardwareExpanded && (
                <div className="p-3 bg-neutral-800">
                  <blueprint.visual />
                </div>
              )}

              {/* Collapsible I/O Data */}
              <div className="bg-neutral-950 flex flex-col">
                 <button 
                    onClick={(e: any) => toggleExpand(nodeId, e)}
                    className="w-full flex items-center justify-between p-2 px-3 text-[10px] text-neutral-400 hover:text-neutral-200 hover:bg-white/5 transition-colors border-t border-neutral-800 focus:outline-none"
                 >
                    <span className="font-bold uppercase tracking-wider">Routing & I/O Data</span>
                    {isExpanded ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                 </button>
                 
                 {isExpanded && (
                     <div className="p-3 pt-1 text-xs flex flex-col gap-2">
                         <div className="flex flex-col gap-1">
                            <label className="text-[9px] text-neutral-500 uppercase font-bold">Overview / Notes</label>
                            <textarea 
                                className="w-full bg-neutral-900 border border-neutral-800 rounded p-1 text-neutral-300 resize-none h-12 outline-none focus:border-neutral-500"
                                value={nodeState.overview}
                                onChange={(e: any) => setNodes(p => ({...p, [nodeId]: {...p[nodeId]! as OverviewNode, overview: e.target.value}}))}
                            />
                         </div>
                         {routingMode === 'physical' ? (
                             <>
                                 <div className="grid grid-cols-2 gap-2 mt-1">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[9px] text-cyan-600 uppercase font-bold flex items-center gap-1"><Circle size={8}/> Audio IN</label>
                                        <select className="w-full bg-neutral-900 border border-neutral-800 rounded p-1 text-neutral-300 outline-none text-[10px]" value={getConnectedNode(nodeId, 'audioIn')} onChange={(e: any) => handlePortSelect(nodeId, 'audioIn', e.target.value)}>
                                           <option value="">- None -</option>
                                           {Object.keys(nodes).filter(id => id !== nodeId).map(id => <option key={id} value={id}>{HARDWARE_LIBRARY[nodes[id]!.type]?.model}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[9px] text-orange-500 uppercase font-bold flex items-center gap-1"><Circle size={8}/> Audio OUT</label>
                                        <select className="w-full bg-neutral-900 border border-neutral-800 rounded p-1 text-neutral-300 outline-none text-[10px]" value={getConnectedNode(nodeId, 'audioOut')} onChange={(e: any) => handlePortSelect(nodeId, 'audioOut', e.target.value)}>
                                           <option value="">- None -</option>
                                           {Object.keys(nodes).filter(id => id !== nodeId).map(id => <option key={id} value={id}>{HARDWARE_LIBRARY[nodes[id]!.type]?.model}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[9px] text-emerald-600 uppercase font-bold flex items-center gap-1"><Square size={8}/> MIDI IN</label>
                                        <select className="w-full bg-neutral-900 border border-neutral-800 rounded p-1 text-neutral-300 outline-none text-[10px]" value={getConnectedNode(nodeId, 'midiIn')} onChange={(e: any) => handlePortSelect(nodeId, 'midiIn', e.target.value)}>
                                           <option value="">- None -</option>
                                           {Object.keys(nodes).filter(id => id !== nodeId).map(id => <option key={id} value={id}>{HARDWARE_LIBRARY[nodes[id]!.type]?.model}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[9px] text-blue-500 uppercase font-bold flex items-center gap-1"><Square size={8}/> MIDI OUT/THRU</label>
                                        <select className="w-full bg-neutral-900 border border-neutral-800 rounded p-1 text-neutral-300 outline-none text-[10px]" value={getConnectedNode(nodeId, 'midiOut')} onChange={(e: any) => handlePortSelect(nodeId, 'midiOut', e.target.value)}>
                                           <option value="">- None -</option>
                                           {Object.keys(nodes).filter(id => id !== nodeId).map(id => <option key={id} value={id}>{HARDWARE_LIBRARY[nodes[id]!.type]?.model}</option>)}
                                        </select>
                                     </div>
                                 </div>
                                 
                                 {/* Origin Cable Managers */}
                                 <div className="mt-2 pt-2 border-t border-neutral-800 flex flex-col gap-1">
                                    <label className="text-[9px] text-neutral-500 uppercase font-bold">Outgoing Cables Manager</label>
                                    {Object.entries(connections).filter(([_, conn]) => conn.source === nodeId).map(([cId, conn]) => (
                                        <select 
                                            key={cId}
                                            value={conn.type}
                                            onChange={(e: any) => setConnections(p => ({...p, [cId]: {...p[cId]! as OverviewConnection, type: e.target.value}}))}
                                            className="bg-neutral-900 border border-neutral-700 text-[10px] p-1 rounded text-neutral-300 outline-none w-full"
                                            style={{ color: CABLE_TYPES[conn.type]?.color }}
                                        >
                                            {Object.entries(CABLE_TYPES).map(([typeId, typeData]) => (
                                                <option key={typeId} value={typeId}>{conn.label} ➜ {typeData.label}</option>
                                            ))}
                                        </select>
                                    ))}
                                 </div>
                             </>
                         ) : (
                             <>
                                 <div className="mt-2 pt-2 border-t border-neutral-800 flex flex-col gap-2">
                                    <label className="text-[9px] text-indigo-400 uppercase font-bold">Logical MIDI Configuration</label>
                                    <div className="flex flex-col gap-1">
                                       <label className="text-[9px] text-neutral-400 uppercase font-bold">Input Channel (Receives)</label>
                                       <select className="bg-neutral-900 border border-neutral-700 text-[10px] p-1 rounded text-neutral-300 outline-none w-full"
                                               value={nodeState.logicalInChannel || ''}
                                               onChange={(e: any) => setNodes(p => ({...p, [nodeId]: {...p[nodeId], logicalInChannel: e.target.value ? parseInt(e.target.value) : null} as OverviewNode}))}>
                                           <option value="">- None -</option>
                                           {[...Array(16)].map((_, i) => <option key={i+1} value={i+1}>Ch {i+1}</option>)}
                                       </select>
                                       {nodeState.logicalInChannel ? (() => {
                                          const senders: string[] = [];
                                          Object.values(nodes).forEach(n => {
                                             if (n.id === nodeId) return;
                                             if (n.type === 'circuit' && n.circuitLogicalOuts) {
                                                if (n.circuitLogicalOuts.synth1 === nodeState.logicalInChannel) senders.push(`${HARDWARE_LIBRARY[n.type]?.model} (Synth 1)`);
                                                if (n.circuitLogicalOuts.synth2 === nodeState.logicalInChannel) senders.push(`${HARDWARE_LIBRARY[n.type]?.model} (Synth 2)`);
                                                if (n.circuitLogicalOuts.midi1 === nodeState.logicalInChannel) senders.push(`${HARDWARE_LIBRARY[n.type]?.model} (MIDI 1)`);
                                                if (n.circuitLogicalOuts.midi2 === nodeState.logicalInChannel) senders.push(`${HARDWARE_LIBRARY[n.type]?.model} (MIDI 2)`);
                                             } else if (n.logicalOutChannel === nodeState.logicalInChannel) {
                                                senders.push(`${HARDWARE_LIBRARY[n.type]?.model}`);
                                             }
                                          });
                                          return senders.length > 0 ? 
                                            <div className="text-[9px] text-green-500 font-medium">Receiving from: {senders.join(', ')}</div> :
                                            <div className="text-[9px] text-red-500 font-medium">No device sending on Ch {nodeState.logicalInChannel}</div>;
                                       })() : null}
                                    </div>

                                    {nodeState.type === 'circuit' ? (
                                        <div className="flex flex-col gap-2 mt-1">
                                           {['synth1', 'synth2', 'midi1', 'midi2'].map((outKey) => {
                                               const ch = nodeState.circuitLogicalOuts?.[outKey as keyof typeof nodeState.circuitLogicalOuts] || null;
                                               return (
                                                   <div key={outKey} className="flex flex-col gap-1 bg-black/20 p-1 rounded">
                                                       <label className="text-[9px] text-neutral-400 uppercase font-bold capitalize">{outKey.replace(/([A-Za-z]+)(\d+)/, "$1 $2")} Output</label>
                                                       <select className="bg-neutral-900 border border-neutral-700 text-[10px] p-1 rounded text-neutral-300 outline-none w-full"
                                                               value={ch || ''}
                                                               onChange={(e: any) => setNodes(p => ({...p, [nodeId]: {...p[nodeId], circuitLogicalOuts: {...(p[nodeId] as OverviewNode).circuitLogicalOuts, [outKey]: e.target.value ? parseInt(e.target.value) : null}} as OverviewNode}))}>
                                                           <option value="">- None -</option>
                                                           {[...Array(16)].map((_, i) => <option key={i+1} value={i+1}>Ch {i+1}</option>)}
                                                       </select>
                                                       {ch ? (() => {
                                                           const listeners = Object.values(nodes).filter(n => n.id !== nodeId && n.logicalInChannel === ch);
                                                           return listeners.length > 0 ? 
                                                               <div className="text-[9px] text-green-500 font-medium">Sending to: {listeners.map(l => HARDWARE_LIBRARY[l.type]?.model).join(', ')}</div> :
                                                               <div className="text-[9px] text-red-500 font-medium">No device listening on Ch {ch}</div>;
                                                       })() : null}
                                                   </div>
                                               )
                                           })}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-1 mt-1">
                                           <label className="text-[9px] text-neutral-400 uppercase font-bold">Output Channel (Sends)</label>
                                           <select className="bg-neutral-900 border border-neutral-700 text-[10px] p-1 rounded text-neutral-300 outline-none w-full"
                                                   value={nodeState.logicalOutChannel || ''}
                                                   onChange={(e: any) => setNodes(p => ({...p, [nodeId]: {...p[nodeId], logicalOutChannel: e.target.value ? parseInt(e.target.value) : null} as OverviewNode}))}>
                                               <option value="">- None -</option>
                                               {[...Array(16)].map((_, i) => <option key={i+1} value={i+1}>Ch {i+1}</option>)}
                                           </select>
                                           {nodeState.logicalOutChannel ? (() => {
                                              const listeners = Object.values(nodes).filter(n => n.id !== nodeId && n.logicalInChannel === nodeState.logicalOutChannel);
                                              return listeners.length > 0 ? 
                                                <div className="text-[9px] text-green-500 font-medium">Sending to: {listeners.map(l => HARDWARE_LIBRARY[l.type]?.model).join(', ')}</div> :
                                                <div className="text-[9px] text-red-500 font-medium">No device listening on Ch {nodeState.logicalOutChannel}</div>;
                                           })() : null}
                                        </div>
                                    )}
                                 </div>
                             </>
                         )}
                     </div>
                 )}
              </div>
            </div>
          );
        })}
        </div>
        {/* Zoom Controls */}
        <div className="absolute bottom-6 right-6 flex items-center gap-1 bg-neutral-900/90 text-white rounded-lg shadow-xl border border-neutral-700/50 p-1 backdrop-blur z-50 pointer-events-auto">
          <button onClick={() => {
            const z = Math.max(0.1, zoom * 0.8);
            const rect = containerRef.current!.getBoundingClientRect();
            const cx = rect.width / 2; const cy = rect.height / 2;
            setPan({ x: cx - (cx - pan.x) * (z / zoom), y: cy - (cy - pan.y) * (z / zoom) });
            setZoom(z);
          }} className="w-8 h-8 flex items-center justify-center hover:bg-neutral-800 rounded transition-colors text-neutral-400 hover:text-white font-bold" title="Zoom Out">-</button>
          <span className="text-[10px] font-mono w-10 text-center cursor-pointer hover:text-cyan-400 font-bold" onClick={fitToContainer} title="Reset View & Fit to Screen">{Math.round(zoom * 100)}%</span>
          <button onClick={() => {
            const z = Math.min(3, zoom * 1.2);
            const rect = containerRef.current!.getBoundingClientRect();
            const cx = rect.width / 2; const cy = rect.height / 2;
            setPan({ x: cx - (cx - pan.x) * (z / zoom), y: cy - (cy - pan.y) * (z / zoom) });
            setZoom(z);
          }} className="w-8 h-8 flex items-center justify-center hover:bg-neutral-800 rounded transition-colors text-neutral-400 hover:text-white font-bold" title="Zoom In">+</button>
        </div>

        </div>
      </div>
    </div>
  </div>
);
}