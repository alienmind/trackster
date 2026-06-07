import { useState, useEffect, useMemo } from 'react';
import { useOverviewStore, OverviewConnection, PortDef, MidiTrackDef } from '../../stores/useOverviewStore';
import { HARDWARE_LIBRARY } from '../../devices';
import { CABLE_COLORS, CABLE_OPTIONS, DEFAULT_CABLE_COLOR } from '../../devices/cables';
import { Button } from '../Core/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../Core/ui/dialog';
import * as Icons from 'lucide-react';

interface OverviewSidebarProps {
  onClose: () => void;
}

function humanisePortId(id: string): string {
  // Insert spaces before capital letters and uppercase the first letter
  return id
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, c => c.toUpperCase())
    .trim();
}

export default function OverviewSidebar({ onClose }: OverviewSidebarProps) {
  const {
    selectedNodeId, nodes, connections, setConnections, setNodes, removeNode,
    selectedConnectionId, setSelectedConnectionId, cableDotNumbers,
    routingMode,
  } = useOverviewStore();
  const [activeNodeId, setActiveNodeId] = useState(selectedNodeId);
  const [addOpen, setAddOpen] = useState(false);
  const [pendingPortId, setPendingPortId] = useState<string | null>(null);
  const [pendingRemoteId, setPendingRemoteId] = useState<string | null>(null);
  const [pendingRemotePortId, setPendingRemotePortId] = useState<string | null>(null);

  // Keep the active node ID around so it can animate out smoothly when selectedNodeId becomes null
  useEffect(() => {
    if (selectedNodeId) setActiveNodeId(selectedNodeId);
  }, [selectedNodeId]);

  const displayNodeId = selectedNodeId || activeNodeId;
  const node = displayNodeId ? nodes[displayNodeId] : undefined;
  const blueprint = node ? HARDWARE_LIBRARY[node.type] : undefined;
  const allPorts: PortDef[] = (blueprint?.ports ?? []) as PortDef[];

  // ---- Helpers ----
  const colorFor = (type?: string) => {
    if (!type) return DEFAULT_CABLE_COLOR;
    for (const [k, v] of Object.entries(CABLE_COLORS)) {
      if (type.includes(k)) return v;
    }
    return DEFAULT_CABLE_COLOR;
  };

  const updateConnection = (connId: string, updates: Partial<OverviewConnection>) => {
    setConnections(prev => {
      const existing = prev[connId];
      if (!existing) return prev;
      return { ...prev, [connId]: { ...existing, ...updates } };
    });
  };

  const deleteConnection = (connId: string) => {
    setConnections(prev => {
      const next = { ...prev };
      delete next[connId];
      return next;
    });
  };

  const addConnectionForPort = (port: PortDef, remoteNodeId?: string, remotePortIdHint?: string) => {
    if (!displayNodeId) return;
    const otherNodes = Object.values(nodes).filter(n => n.id !== displayNodeId);
    if (otherNodes.length === 0) return;
    const targetNode = (remoteNodeId && nodes[remoteNodeId]) || otherNodes[0];
    if (!targetNode) return;
    const targetBp = HARDWARE_LIBRARY[targetNode.type];
    // For in/out (bidirectional) ports, treat as outgoing from the current device by default.
    const treatAsOut = port.direction === 'out' || port.direction === 'in_out';
    // Prefer the explicit hint, otherwise pick a sensible compatible port on the other end.
    const remotePort =
      (remotePortIdHint && (targetBp?.ports as PortDef[] | undefined)?.find(p => p.id === remotePortIdHint)) ||
      (targetBp?.ports as PortDef[] | undefined)?.find(p =>
        p.direction === 'in_out' ||
        (treatAsOut ? p.direction === 'in' : p.direction === 'out')
      ) ||
      targetBp?.ports?.[0];

    const newId = `c_${Date.now()}`;
    setConnections(prev => ({
      ...prev,
      [newId]: {
        id: newId,
        source: treatAsOut ? displayNodeId : targetNode.id,
        target: treatAsOut ? targetNode.id : displayNodeId,
        sourcePort: treatAsOut ? port.id : (remotePort?.id ?? 'out'),
        targetPort: treatAsOut ? (remotePort?.id ?? 'in') : port.id,
        type: 'default',
      }
    }));
  };

  // Group every connection that touches this device by the device's own port.
  // Self-healing: if a stored sourcePort/targetPort id no longer exists on the
  // device blueprint (e.g. ports were renamed), snap it to a sensible port
  // (first port whose id has a common prefix, or first opposite-direction port).
  const connectionsByPort = useMemo(() => {
    const map: Record<string, OverviewConnection[]> = {};
    const portIds = new Set(allPorts.map(p => p.id));
    for (const port of allPorts) map[port.id] = [];

    // Pick a fallback port: prefer same prefix (audioIn -> audioIn3), then
    // first port matching the expected direction, otherwise first port.
    const pickFallback = (storedId: string | undefined, wantDirection: 'in' | 'out'): string | undefined => {
      if (allPorts.length === 0) return undefined;
      if (storedId) {
        const prefix = storedId.replace(/\d+$/, '');
        const byPrefix = allPorts.find(p => p.id.startsWith(prefix));
        if (byPrefix) return byPrefix.id;
      }
      const byDir = allPorts.find(p => p.direction === wantDirection || p.direction === 'in_out');
      return byDir?.id ?? allPorts[0]?.id;
    };

    for (const conn of Object.values(connections)) {
      if (conn.source === displayNodeId) {
        let pid = conn.sourcePort;
        if (!pid || !portIds.has(pid)) pid = pickFallback(pid, 'out');
        if (pid && map[pid]) map[pid]!.push(conn);
      } else if (conn.target === displayNodeId) {
        let pid = conn.targetPort;
        if (!pid || !portIds.has(pid)) pid = pickFallback(pid, 'in');
        if (pid && map[pid]) map[pid]!.push(conn);
      }
    }
    return map;
  }, [connections, displayNodeId, allPorts]);

  // Healing effect: write back any auto-fixed port ids so future renders / saves use the correct value.
  useEffect(() => {
    if (!displayNodeId || allPorts.length === 0) return;
    const portIds = new Set(allPorts.map(p => p.id));
    const updates: Record<string, Partial<OverviewConnection>> = {};
    for (const conn of Object.values(connections)) {
      if (conn.source === displayNodeId && (!conn.sourcePort || !portIds.has(conn.sourcePort))) {
        const prefix = (conn.sourcePort ?? '').replace(/\d+$/, '');
        const byPrefix = allPorts.find(p => p.id.startsWith(prefix));
        const fixed = byPrefix ?? allPorts.find(p => p.direction === 'out' || p.direction === 'in_out');
        if (fixed && fixed.id !== conn.sourcePort) updates[conn.id] = { ...(updates[conn.id] ?? {}), sourcePort: fixed.id };
      }
      if (conn.target === displayNodeId && (!conn.targetPort || !portIds.has(conn.targetPort))) {
        const prefix = (conn.targetPort ?? '').replace(/\d+$/, '');
        const byPrefix = allPorts.find(p => p.id.startsWith(prefix));
        const fixed = byPrefix ?? allPorts.find(p => p.direction === 'in' || p.direction === 'in_out');
        if (fixed && fixed.id !== conn.targetPort) updates[conn.id] = { ...(updates[conn.id] ?? {}), targetPort: fixed.id };
      }
    }
    const ids = Object.keys(updates);
    if (ids.length === 0) return;
    setConnections(prev => {
      const next = { ...prev };
      for (const id of ids) {
        if (next[id]) next[id] = { ...next[id], ...updates[id] } as OverviewConnection;
      }
      return next;
    });
  }, [displayNodeId, allPorts, connections, setConnections]);

  // Bail out AFTER all hooks have run, so hook order stays stable across renders
  if (!displayNodeId || !node) return null;

  // Visible groups: General (bidirectional, e.g. USB), Outputs, Inputs.
  // ONLY ports that currently have at least one connection are rendered, to
  // avoid wasting vertical space. Use the "+ Add connection" button to wire
  // an unused port.
  const isUsed = (p: PortDef) => (connectionsByPort[p.id]?.length ?? 0) > 0;
  const generalPorts = allPorts.filter(p => p.direction === 'in_out' && isUsed(p));
  const outputPorts  = allPorts.filter(p => p.direction === 'out'    && isUsed(p));
  const inputPorts   = allPorts.filter(p => p.direction === 'in'     && isUsed(p));
  const unusedPorts  = allPorts.filter(p => !isUsed(p));
  const availableDevices = Object.values(nodes).filter(n => n.id !== displayNodeId);

  // Inline numbered dot — visually identical to the on-canvas connector dot.
  // `local=true` adds a cyan halo to highlight that this dot belongs to the
  // currently selected device (the one whose properties are showing).
  const DotChip = ({ n, color, local = false }: { n?: number; color: string; local?: boolean }) => (
    <span
      className="flex-shrink-0 inline-flex items-center justify-center rounded-full text-[10px] font-bold"
      style={{
        width: 18, height: 18,
        background: color, color: '#000',
        border: '1px solid rgba(0,0,0,0.6)',
        boxShadow: local
          ? '0 0 0 1px rgba(255,255,255,0.9) inset, 0 0 0 2px rgba(8,8,8,0.9), 0 0 0 4px rgba(34,211,238,0.85), 0 0 8px rgba(34,211,238,0.5)'
          : '0 0 0 1px rgba(255,255,255,0.9) inset',
      }}
    >
      {n ?? '?'}
    </span>
  );

  const PortRow = ({ port }: { port: PortDef }) => {
    const conns = connectionsByPort[port.id] ?? [];
    const label = port.label ?? humanisePortId(port.id);
    const dirIcon = port.direction === 'out'
      ? <Icons.ArrowRightFromLine size={12} className="text-cyan-500" />
      : port.direction === 'in'
      ? <Icons.ArrowRightToLine size={12} className="text-emerald-500" />
      : <Icons.ArrowLeftRight size={12} className="text-amber-500" />;
    return (
      <div className="flex gap-2">
        {/* Port label column - rotated 90deg counter-clockwise so text reads bottom-to-top */}
        <div className="w-7 flex-shrink-0 flex items-center justify-center py-1">
          <div
            className="flex items-center gap-1 whitespace-nowrap text-[11px] font-medium text-white"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            title={`${label} (${port.type})`}
          >
            {dirIcon}
            <span>{label}</span>
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground">{port.type}</span>
          </div>
        </div>

        {/* Connections column */}
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          {conns.length === 0 ? null : (
            <>
              {conns.map(c => {
                // For each row, the "remote" device is the OTHER end.
                const remoteId = c.source === displayNodeId ? c.target : c.source;
                const remoteBp = HARDWARE_LIBRARY[nodes[remoteId]?.type ?? ''];
                const remotePortField: keyof OverviewConnection =
                  c.source === displayNodeId ? 'targetPort' : 'sourcePort';
                const remoteNodeField: keyof OverviewConnection =
                  c.source === displayNodeId ? 'target' : 'source';
                const remotePortId = (c as any)[remotePortField] as string | undefined;
                const remotePorts = (remoteBp?.ports as PortDef[] | undefined) ?? [];

                const dotFrom = cableDotNumbers[c.id]?.from;
                const dotTo   = cableDotNumbers[c.id]?.to;
                const myDotNum     = c.source === displayNodeId ? dotFrom : dotTo;
                const remoteDotNum = c.source === displayNodeId ? dotTo   : dotFrom;
                const isSel = selectedConnectionId === c.id;

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedConnectionId(c.id)}
                    className={`p-1.5 rounded border text-xs flex items-start gap-1.5 cursor-pointer relative group ${
                      isSel ? 'bg-cyan-950/40 border-cyan-500/60 ring-1 ring-cyan-400/40' : 'bg-muted/30 border-border hover:border-foreground/30'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1.5 pt-1 pb-1 px-0.5">
                      {/* Remote end (other device) */}
                      <DotChip n={remoteDotNum} color={colorFor(c.type)} />
                      {/* Direction arrow: points TOWARDS this device */}
                      <Icons.ArrowDown
                        size={12}
                        className="text-muted-foreground"
                        aria-hidden
                      />
                      {/* Local end (this device) — highlighted with cyan halo */}
                      <DotChip n={myDotNum} color={colorFor(c.type)} local />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col gap-1 pr-4">
                      {/* Remote device picker */}
                      <select
                        className="bg-background border border-border rounded text-[11px] p-0.5 text-foreground w-full"
                        value={remoteId}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => updateConnection(c.id, { [remoteNodeField]: e.target.value } as Partial<OverviewConnection>)}
                      >
                        {availableDevices.map(n => (
                          <option key={n.id} value={n.id}>{HARDWARE_LIBRARY[n.type]?.model ?? n.type}</option>
                        ))}
                      </select>
                      {/* Remote port picker (only show ports of opposite direction) */}
                      {remotePorts.length > 0 && (
                        <select
                          className="bg-background border border-border rounded text-[10px] p-0.5 text-muted-foreground w-full"
                          value={remotePortId ?? ''}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => updateConnection(c.id, { [remotePortField]: e.target.value } as Partial<OverviewConnection>)}
                        >
                          <option value="">(any port)</option>
                          {remotePorts
                            .filter(rp => port.direction === 'in_out' || rp.direction === 'in_out' || rp.direction !== port.direction)
                            .map(rp => (
                              <option key={rp.id} value={rp.id}>
                                {(rp.label ?? humanisePortId(rp.id))} - {rp.type}
                              </option>
                            ))}
                        </select>
                      )}
                      {/* Cable type */}
                      <select
                        className="bg-background border border-border rounded text-[10px] p-0.5 text-muted-foreground w-full"
                        value={c.type || 'default'}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => updateConnection(c.id, { type: e.target.value })}
                      >
                        {CABLE_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all h-6 w-6"
                      onClick={(e) => { e.stopPropagation(); deleteConnection(c.id); }}
                      title="Delete connection"
                    >
                      <Icons.Trash2 size={12} />
                    </Button>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className="h-full w-80 bg-background border-r border-border shadow-2xl flex flex-col"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h2 className="text-lg font-bold text-foreground">
            {blueprint?.id === 'minifreak' ? (
              <>
                <span className="dark:hidden">Arturia MiniFreak</span>
                <span className="hidden dark:inline">Arturia MiniFreak Stellar</span>
              </>
            ) : (
              blueprint?.model || 'Unknown Device'
            )}
          </h2>
          <p className="text-xs text-muted-foreground uppercase tracking-widest">{blueprint?.brand}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onClose(); }} className="text-muted-foreground hover:text-foreground">
          <Icons.X size={18} />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Device Info */}
        <section>
          <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Details</h3>
          <div className="bg-muted/50 p-2 rounded-lg border border-border text-xs text-muted-foreground">
            <p><span className="text-muted-foreground/70 mr-2">Type:</span>{blueprint?.tagline || 'Device'}</p>
          </div>
        </section>

        {/* MIDI channel routing (logical mode) */}
        {routingMode === 'logical' && (
          <section>
            <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">MIDI Channel Routing</h3>
            {(() => {
              const isMidi = !!blueprint?.midiCapable;
              if (!isMidi) {
                return <p className="text-[11px] text-muted-foreground italic">This device has no MIDI ports.</p>;
              }
              // Resolve the device's declared MIDI tracks; fall back to a single 'Main' in_out track.
              const declaredTracks: MidiTrackDef[] = (blueprint?.midiTracks ?? [{ id: 'main', label: 'Main', direction: 'in_out' }]) as MidiTrackDef[];

              // Expand each track into one or two "slots" by direction.
              type Slot = { trackId: string; trackLabel: string; dir: 'in' | 'out' };
              const slots: Slot[] = [];
              for (const t of declaredTracks) {
                if (t.direction === 'in' || t.direction === 'in_out') {
                  slots.push({ trackId: t.id, trackLabel: t.label, dir: 'in' });
                }
                if (t.direction === 'out' || t.direction === 'in_out') {
                  slots.push({ trackId: t.id, trackLabel: t.label, dir: 'out' });
                }
              }

              // Sort: all INs first (emerald), all OUTs second (cyan).
              slots.sort((a, b) => (a.dir === b.dir ? 0 : a.dir === 'in' ? -1 : 1));

              const getCh = (trackId: string, dir: 'in' | 'out'): number | '*' | null => {
                const entry = node?.midiTrackChannels?.[trackId];
                if (!entry) return null;
                return (dir === 'in' ? entry.in : entry.out) ?? null;
              };

              const setCh = (trackId: string, dir: 'in' | 'out', value: number | '*' | null) => {
                if (!displayNodeId) return;
                setNodes(prev => {
                  const n = prev[displayNodeId];
                  if (!n) return prev;
                  const map = { ...(n.midiTrackChannels ?? {}) };
                  const existing = { ...(map[trackId] ?? {}) };
                  if (value == null) {
                    delete (existing as any)[dir];
                  } else {
                    (existing as any)[dir] = value;
                  }
                  if (existing.in == null && existing.out == null) {
                    delete map[trackId];
                  } else {
                    map[trackId] = existing;
                  }
                  return { ...prev, [displayNodeId]: { ...n, midiTrackChannels: map } };
                });
              };

              // Peer scan: who is listening / broadcasting on a given channel?
              const peerNodes = Object.values(nodes).filter(n => n.id !== displayNodeId);
              const matches = (myCh: number | '*' | null, theirCh: number | '*' | null | undefined) => {
                if (myCh == null || theirCh == null) return false;
                return myCh === '*' || theirCh === '*' || myCh === theirCh;
              };
              // Collect every (peer device, peer trackLabel, peer channel) pair in a given direction.
              const peerSlots = (dir: 'in' | 'out') => {
                const out: Array<{ peerId: string; trackLabel: string; ch: number | '*' | null }> = [];
                for (const p of peerNodes) {
                  const bp = HARDWARE_LIBRARY[p.type];
                  const tracks: MidiTrackDef[] = (bp?.midiTracks ?? [{ id: 'main', label: 'Main', direction: 'in_out' }]) as MidiTrackDef[];
                  for (const t of tracks) {
                    const compatible = (dir === 'in' && (t.direction === 'in' || t.direction === 'in_out')) ||
                                       (dir === 'out' && (t.direction === 'out' || t.direction === 'in_out'));
                    if (!compatible) continue;
                    const ch = (p.midiTrackChannels?.[t.id]?.[dir]) ?? null;
                    if (ch == null) continue;
                    out.push({ peerId: p.id, trackLabel: t.label, ch });
                  }
                }
                return out;
              };
              const allPeerIns  = peerSlots('in');
              const allPeerOuts = peerSlots('out');

              const ChannelSelect = ({ value, onChange, placeholder }: { value: number | '*' | null | undefined; onChange: (v: number | '*' | null) => void; placeholder: string }) => (
                <select
                  className="bg-card border border-border rounded text-xs p-1 text-foreground w-full"
                  value={value == null ? '' : (value === '*' ? '*' : String(value))}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === '') onChange(null);
                    else if (v === '*') onChange('*');
                    else onChange(parseInt(v, 10));
                  }}
                >
                  <option value="">{placeholder}</option>
                  <option value="*">* (Omni - all channels)</option>
                  {Array.from({ length: 16 }, (_, i) => i + 1).map(ch => (
                    <option key={ch} value={ch}>Channel {ch}</option>
                  ))}
                </select>
              );

              return (
                <div className="flex flex-col gap-3">
                  {slots.map(slot => {
                    const myCh = getCh(slot.trackId, slot.dir);
                    // For my OUT slot - which peer INs catch it? For my IN slot - which peer OUTs broadcast to me?
                    const partners = (slot.dir === 'out' ? allPeerIns : allPeerOuts).filter(p => matches(myCh, p.ch));
                    const isOut = slot.dir === 'out';
                    return (
                      <div key={`${slot.trackId}-${slot.dir}`} className="flex flex-col gap-1">
                        <div className={`flex items-center gap-1 text-[11px] font-medium ${isOut ? 'text-cyan-400' : 'text-emerald-400'}`}>
                          {isOut
                            ? <Icons.ArrowRightFromLine size={12} />
                            : <Icons.ArrowRightToLine size={12} />}
                          <span>{slot.trackLabel} <span className="text-muted-foreground">({isOut ? 'OUT' : 'IN'})</span></span>
                        </div>
                        <ChannelSelect
                          value={myCh}
                          onChange={(v) => setCh(slot.trackId, slot.dir, v)}
                          placeholder="- None -"
                        />
                        {myCh != null && (
                          myCh === '*'
                            ? <p className="text-[10px] text-cyan-400">{isOut ? 'Omni broadcaster - reaches every listener (wires not rendered)' : 'Omni listener - reacts to every broadcaster (wires not rendered)'}</p>
                            : partners.length > 0
                              ? <p className="text-[10px] text-green-500">
                                  {isOut ? 'Sending to: ' : 'Receiving from: '}
                                  {partners.map(p => `${HARDWARE_LIBRARY[nodes[p.peerId]?.type ?? '']?.model ?? p.peerId} (${p.trackLabel})`).join(', ')}
                                </p>
                              : <p className="text-[10px] text-amber-500">{isOut ? 'No device listening on Ch ' : 'No device broadcasting on Ch '}{myCh}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </section>
        )}

        {/* Ports & Connectivity grouped by port direction (physical mode only) */}
        {routingMode === 'physical' && (
        <section>
          <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Ports & Cabling</h3>
          {allPorts.length === 0 ? (
            <p className="text-[11px] text-muted-foreground italic">This device exposes no ports.</p>
          ) : (
            <div className="space-y-4">
              {generalPorts.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[9px] uppercase tracking-wider text-amber-400/70 px-1">General</div>
                  {generalPorts.map(port => <PortRow key={port.id} port={port} />)}
                </div>
              )}
              {outputPorts.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[9px] uppercase tracking-wider text-cyan-400/70 px-1">Outputs</div>
                  {outputPorts.map(port => <PortRow key={port.id} port={port} />)}
                </div>
              )}
              {inputPorts.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[9px] uppercase tracking-wider text-emerald-400/70 px-1">Inputs</div>
                  {inputPorts.map(port => <PortRow key={port.id} port={port} />)}
                </div>
              )}
              {generalPorts.length + outputPorts.length + inputPorts.length === 0 && (
                <p className="text-[11px] text-muted-foreground italic px-1">No connections yet. Use the button below to wire a port.</p>
              )}
              {unusedPorts.length > 0 && (
                <Button
                  variant="ghost"
                  className="w-full justify-center text-xs h-8 border border-dashed border-border hover:border-cyan-700 text-muted-foreground hover:text-cyan-400"
                  onClick={() => { setPendingPortId(null); setPendingRemoteId(null); setPendingRemotePortId(null); setAddOpen(true); }}
                >
                  <Icons.Plus size={14} className="mr-1" /> Add Connection
                </Button>
              )}
            </div>
          )}
        </section>
        )}
      </div>

      <div className="p-3 border-t border-border">
        <Button
          variant="destructive"
          className="w-full flex items-center justify-center gap-2"
          onClick={() => { removeNode(displayNodeId); onClose(); }}
        >
          <Icons.Trash2 size={16} /> Remove Device
        </Button>
      </div>

      {/* Port picker dialog — pick an unused port and immediately create a connection */}
      <Dialog open={addOpen} onOpenChange={(o) => { if (!o) { setAddOpen(false); setPendingPortId(null); setPendingRemoteId(null); setPendingRemotePortId(null); } }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add Connection</DialogTitle>
            <DialogDescription className="pt-1 text-xs text-foreground/70">
              Select which physical port on <span className="font-semibold text-foreground">{blueprint?.model}</span> should host the new connection.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto -mx-2 px-2 py-1 flex flex-col gap-4">
            {/* 1. Local port */}
            <div className="flex flex-col gap-1.5">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">1. This device's port</div>
              {unusedPorts.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">All ports are already in use.</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {unusedPorts.map(p => {
                    const dir = p.direction;
                    const dirLabel = dir === 'out' ? 'OUT' : dir === 'in' ? 'IN' : 'I/O';
                    const dirColor = dir === 'out' ? 'text-cyan-400' : dir === 'in' ? 'text-emerald-400' : 'text-amber-400';
                    return (
                      <Button
                        key={p.id}
                        variant="outline"
                        onClick={() => { setPendingPortId(p.id); setPendingRemotePortId(null); }}
                        className={`h-auto flex items-center justify-between gap-2 rounded border px-2 py-1.5 text-left transition w-full ${pendingPortId === p.id ? 'border-cyan-500/60 bg-cyan-950/30' : 'border-border hover:border-foreground/30 bg-muted/30'}`}
                      >
                        <span className="flex flex-col min-w-0 text-left">
                          <span className="text-xs font-medium text-foreground truncate">{p.label ?? humanisePortId(p.id)}</span>
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{p.type}</span>
                        </span>
                        <span className={`text-[10px] font-bold ${dirColor}`}>{dirLabel}</span>
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. Remote device */}
            <div className="flex flex-col gap-1.5">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">2. Other device</div>
              {availableDevices.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Add at least one more device to the grid first.</p>
              ) : (
                <select
                  className="bg-background border border-border rounded text-xs p-1.5 text-foreground w-full"
                  value={pendingRemoteId ?? ''}
                  onChange={(e) => { setPendingRemoteId(e.target.value || null); setPendingRemotePortId(null); }}
                >
                  <option value="">- Select device -</option>
                  {availableDevices.map(n => (
                    <option key={n.id} value={n.id}>{HARDWARE_LIBRARY[n.type]?.model ?? n.type}</option>
                  ))}
                </select>
              )}
            </div>

            {/* 3. Remote port (filtered by compatibility) */}
            {(() => {
              if (!pendingRemoteId || !pendingPortId) return null;
              const localPort = allPorts.find(p => p.id === pendingPortId);
              const remoteBp = HARDWARE_LIBRARY[nodes[pendingRemoteId]?.type ?? ''];
              const remotePorts = ((remoteBp?.ports ?? []) as PortDef[]).filter(rp =>
                !localPort ? true :
                localPort.direction === 'in_out' || rp.direction === 'in_out' || rp.direction !== localPort.direction
              );
              return (
                <div className="flex flex-col gap-1.5">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">3. Other device's port</div>
                  {remotePorts.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No compatible ports on the selected device.</p>
                  ) : (
                    <select
                      className="bg-background border border-border rounded text-xs p-1.5 text-foreground w-full"
                      value={pendingRemotePortId ?? ''}
                      onChange={(e) => setPendingRemotePortId(e.target.value || null)}
                    >
                      <option value="">(auto-pick first compatible)</option>
                      {remotePorts.map(rp => {
                        const d = rp.direction;
                        const dLabel = d === 'out' ? 'OUT' : d === 'in' ? 'IN' : 'I/O';
                        return (
                          <option key={rp.id} value={rp.id}>
                            {(rp.label ?? humanisePortId(rp.id))} - {rp.type} ({dLabel})
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>
              );
            })()}
          </div>
          <DialogFooter className="flex gap-2 sm:space-x-0">
            <Button variant="outline" onClick={() => { setAddOpen(false); setPendingPortId(null); setPendingRemoteId(null); setPendingRemotePortId(null); }}>Cancel</Button>
            <Button
              disabled={!pendingPortId || !pendingRemoteId}
              onClick={() => {
                if (!pendingPortId || !pendingRemoteId) return;
                const port = allPorts.find(p => p.id === pendingPortId);
                if (port) addConnectionForPort(port, pendingRemoteId, pendingRemotePortId ?? undefined);
                setAddOpen(false);
                setPendingPortId(null);
                setPendingRemoteId(null);
                setPendingRemotePortId(null);
              }}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
