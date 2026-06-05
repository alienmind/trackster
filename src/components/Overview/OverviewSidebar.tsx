import { useState, useEffect } from 'react';
import { useOverviewStore, OverviewConnection } from '../../stores/useOverviewStore';
import { HARDWARE_LIBRARY } from '../../devices';
import { CABLE_COLORS, CABLE_OPTIONS, DEFAULT_CABLE_COLOR } from '../../devices/cables';
import { Button } from '../Core/ui/button';
import * as Icons from 'lucide-react';

interface OverviewSidebarProps {
  onClose: () => void;
}

export default function OverviewSidebar({ onClose }: OverviewSidebarProps) {
  const { selectedNodeId, nodes, connections, setConnections, removeNode, selectedConnectionId, cableDotNumbers, setSelectedConnectionId } = useOverviewStore();
  const [activeNodeId, setActiveNodeId] = useState(selectedNodeId);

  // Keep the active node ID around so it can animate out smoothly when selectedNodeId becomes null
  useEffect(() => {
    if (selectedNodeId) {
      setActiveNodeId(selectedNodeId);
    }
  }, [selectedNodeId]);

  const displayNodeId = selectedNodeId || activeNodeId;
  
  if (!displayNodeId) return null;
  const node = nodes[displayNodeId];
  if (!node) return null;
  
  const blueprint = HARDWARE_LIBRARY[node.type];
  
  // Find connections related to this node
  const relatedConns = Object.values(connections).filter(c => c.source === displayNodeId || c.target === displayNodeId);
  const outgoing = relatedConns.filter(c => c.source === displayNodeId);
  const incoming = relatedConns.filter(c => c.target === displayNodeId);


  const colorFor = (type?: string) => {
    if (!type) return DEFAULT_CABLE_COLOR;
    for (const [k, v] of Object.entries(CABLE_COLORS)) {
      if (type.includes(k)) return v;
    }
    return DEFAULT_CABLE_COLOR;
  };

  // Inline numbered dot — visually identical to the on-canvas connector dot.
  const DotChip = ({ n, color, role }: { n?: number; color: string; role: 'src' | 'dst' }) => (
    <button
      type="button"
      title={`Cable ${role === 'src' ? 'source' : 'target'} connector ${n ?? '?'}`}
      onClick={(e) => {
        e.stopPropagation();
        // Find the connection this dot belongs to and select it
      }}
      className="flex-shrink-0 inline-flex items-center justify-center rounded-full text-[10px] font-bold"
      style={{
        width: 18,
        height: 18,
        background: color,
        color: '#000',
        border: '1px solid rgba(0,0,0,0.6)',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.9) inset',
      }}
    >
      {n ?? '?'}
    </button>
  );

  const updateConnection = (connId: string, updates: Partial<OverviewConnection>) => {
    setConnections(prev => {
      const existing = prev[connId];
      if (!existing) return prev;
      return {
        ...prev,
        [connId]: { ...existing, ...updates }
      };
    });
  };

  const deleteConnection = (connId: string) => {
    setConnections(prev => {
      const next = { ...prev };
      delete next[connId];
      return next;
    });
  };

  const addConnection = (direction: 'incoming' | 'outgoing') => {
    const otherNodes = Object.values(nodes).filter(n => n.id !== displayNodeId);
    if (otherNodes.length === 0) return;
    
    const targetNode = otherNodes[0];
    if (!targetNode) return;
    const newId = `c_${Date.now()}`;
    
    setConnections(prev => ({
      ...prev,
      [newId]: {
        id: newId,
        source: direction === 'outgoing' ? displayNodeId : targetNode.id,
        target: direction === 'outgoing' ? targetNode.id : displayNodeId,
        type: 'default',
        sourcePort: 'out',
        targetPort: 'in'
      }
    }));
  };

  const availableDevices = Object.values(nodes).filter(n => n.id !== displayNodeId);

  return (
    <div
      className="h-full w-80 bg-neutral-900 border-r border-neutral-800 shadow-2xl flex flex-col"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between p-4 border-b border-neutral-800">
        <div>
          <h2 className="text-lg font-bold text-white">{blueprint?.model || 'Unknown Device'}</h2>
          <p className="text-xs text-neutral-400 uppercase tracking-widest">{blueprint?.brand}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onClose(); }} className="text-neutral-400 hover:text-white">
          <Icons.X size={18} />
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Device Info */}
        <section>
          <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Details</h3>
          <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 text-sm text-neutral-300">
            <p><span className="text-neutral-500 mr-2">Type:</span> {blueprint?.tagline || 'Device'}</p>
          </div>
        </section>

        {/* Connections */}
        <section>
          <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Connectivity</h3>
          
          <div className="space-y-4">
            {/* INCOMING */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-medium text-neutral-400 flex items-center gap-1">
                  <Icons.ArrowRightToLine size={14} className="text-emerald-500" /> Incoming
                </h4>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => addConnection('incoming')}>
                  <Icons.Plus size={14} />
                </Button>
              </div>
              
              {incoming.length === 0 ? (
                <p className="text-[10px] text-neutral-600 italic">No incoming connections</p>
              ) : (
                <div className="space-y-2">
                  {incoming.map(c => (
                    <div
                      key={c.id}
                      onClick={() => setSelectedConnectionId(c.id)}
                      className={`p-2 rounded border text-xs flex flex-col gap-2 relative group cursor-pointer ${selectedConnectionId === c.id ? 'bg-cyan-950/40 border-cyan-500/60 ring-1 ring-cyan-400/40' : 'bg-neutral-950 border-neutral-800'}`}>
                      <div className="flex items-start gap-2 pr-6">
                        <div className="flex flex-col gap-1 pt-0.5">
                          <DotChip n={cableDotNumbers[c.id]?.from} color={colorFor(c.type)} role="src" />
                          <DotChip n={cableDotNumbers[c.id]?.to}   color={colorFor(c.type)} role="dst" />
                        </div>
                        <div className="flex flex-col gap-1 flex-1 min-w-0">
                          <select 
                            className="bg-neutral-900 border border-neutral-700 rounded text-xs p-1 text-white w-full"
                            value={c.source}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => updateConnection(c.id, { source: e.target.value })}
                          >
                            {availableDevices.map(n => (
                              <option key={n.id} value={n.id}>{HARDWARE_LIBRARY[n.type]?.model || n.type}</option>
                            ))}
                          </select>
                          <select 
                            className="bg-neutral-900 border border-neutral-700 rounded text-xs p-1 text-white w-full"
                            value={c.type || 'default'}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => updateConnection(c.id, { type: e.target.value })}
                          >
                            {CABLE_OPTIONS.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <button 
                        className="absolute right-2 top-2 text-neutral-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => deleteConnection(c.id)}
                      >
                        <Icons.Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* OUTGOING */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-medium text-neutral-400 flex items-center gap-1">
                  <Icons.ArrowRightFromLine size={14} className="text-cyan-500" /> Outgoing
                </h4>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => addConnection('outgoing')}>
                  <Icons.Plus size={14} />
                </Button>
              </div>

              {outgoing.length === 0 ? (
                <p className="text-[10px] text-neutral-600 italic">No outgoing connections</p>
              ) : (
                <div className="space-y-2">
                  {outgoing.map(c => (
                    <div
                      key={c.id}
                      onClick={() => setSelectedConnectionId(c.id)}
                      className={`p-2 rounded border text-xs flex flex-col gap-2 relative group cursor-pointer ${selectedConnectionId === c.id ? 'bg-cyan-950/40 border-cyan-500/60 ring-1 ring-cyan-400/40' : 'bg-neutral-950 border-neutral-800'}`}>
                      <div className="flex items-start gap-2 pr-6">
                        <div className="flex flex-col gap-1 pt-0.5">
                          <DotChip n={cableDotNumbers[c.id]?.from} color={colorFor(c.type)} role="src" />
                          <DotChip n={cableDotNumbers[c.id]?.to}   color={colorFor(c.type)} role="dst" />
                        </div>
                        <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <select 
                          className="bg-neutral-900 border border-neutral-700 rounded text-xs p-1 text-white w-full"
                          onClick={(e) => e.stopPropagation()}
                          value={c.target}
                          onChange={(e) => updateConnection(c.id, { target: e.target.value })}
                        >
                          {availableDevices.map(n => (
                            <option key={n.id} value={n.id}>{HARDWARE_LIBRARY[n.type]?.model || n.type}</option>
                          ))}
                        </select>
                        <select 
                          className="bg-neutral-900 border border-neutral-700 rounded text-xs p-1 text-white w-full"
                          value={c.type || 'default'}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => updateConnection(c.id, { type: e.target.value })}
                        >
                          {CABLE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        </div>
                      </div>
                      <button 
                        className="absolute right-2 top-2 text-neutral-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); deleteConnection(c.id); }}
                      >
                        <Icons.Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      <div className="p-4 border-t border-neutral-800">
        <Button 
          variant="destructive" 
          className="w-full flex items-center justify-center gap-2"
          onClick={() => {
            removeNode(displayNodeId);
            onClose();
          }}
        >
          <Icons.Trash2 size={16} /> Remove Device
        </Button>
      </div>
    </div>
  );
}
