import { useState } from 'react';
import { useSequencerStore } from '../../stores/useSequencerStore';
import { useOverviewStore } from '../../stores/useOverviewStore';
import { useUIStore } from '../../stores/useUIStore';
import * as Icons from 'lucide-react';
import { HARDWARE_LIBRARY } from '../../devices';
import PianoDrawer from './PianoDrawer';
import GenerateSequenceModal from './GenerateSequenceModal';
import { Button } from '../Core/ui/button';

const StepButton = ({ 
  active, 
  noteOverride, 
  index, 
  onClick,
  onContextMenu
}: { 
  active: boolean, 
  noteOverride?: string, 
  index: number, 
  onClick: () => void,
  onContextMenu: (e: React.MouseEvent) => void
}) => {
  const isActive = active;
  return (
    <div 
      className="relative flex flex-col items-center justify-center gap-1 group"
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      <div 
        className={`w-10 h-10 rounded-md border flex items-center justify-center cursor-pointer transition-all duration-150 ${
          isActive 
            ? 'bg-cyan-500 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.6)]' 
            : 'bg-neutral-800 border-neutral-700 hover:bg-neutral-700'
        }`}
      >
        <span className={`text-[10px] font-bold ${isActive ? 'text-cyan-900' : 'text-neutral-500'}`}>
          {index + 1}
        </span>
      </div>
      {noteOverride && (
        <span className="absolute -bottom-4 text-[9px] font-bold text-pink-400 bg-neutral-900 px-1 rounded border border-pink-900">
          {noteOverride}
        </span>
      )}
    </div>
  );
};

export default function GlobalSequencer() {
  const store = useSequencerStore();
  const uiStore = useUIStore();
  const overviewStore = useOverviewStore();
  
  const hasCircuitTracks = Object.values(overviewStore.nodes).some(n => n.type === 'circuit');
  const [generateTrackId, setGenerateTrackId] = useState<string | null>(null);

  const [selectedStepForOverride, setSelectedStepForOverride] = useState<{ trackId: string, index: number } | null>(null);

  const handleStepClick = (trackId: string, index: number) => {
    store.toggleStep(trackId, index);
  };

  const handleStepContextMenu = (e: React.MouseEvent, trackId: string, index: number) => {
    e.preventDefault();
    setSelectedStepForOverride({ trackId, index });
  };

  const deviceImages = import.meta.glob('../../devices/*/device.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

  const renderTrack = (trackId: string, defaultTitle: string, disabled: boolean = false) => {
    const trackData = store.tracks[trackId];
    if (!trackData) return null;

    // We render 64 steps in 4 rows of 16
    const rows = [];
    for (let row = 0; row < 4; row++) {
      const rowSteps = [];
      for (let col = 0; col < 16; col++) {
        const index = row * 16 + col;
        const step = trackData[index];
        // Only enabled if index < patternSize
        const isEnabled = index < store.patternSize;
        
        rowSteps.push(
          <div key={index} className={`transition-opacity ${isEnabled ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
            <StepButton 
              active={step?.active || false} 
              noteOverride={step?.noteOverride}
              index={index}
              onClick={() => { if (!disabled) handleStepClick(trackId, index); }}
              onContextMenu={(e) => { if (!disabled) handleStepContextMenu(e, trackId, index); }}
            />
          </div>
        );
      }
      rows.push(
        <div key={row} className="flex gap-2 mb-4 relative">
          <div className="absolute -left-8 top-1/2 -translate-y-1/2 text-neutral-600 text-xs font-bold">
            {row * 16 + 1}
          </div>
          {rowSteps}
        </div>
      );
    }
    
    // Assignment logic
    const assignedNodeId = store.trackAssignments[trackId];
    const assignedNode = assignedNodeId ? overviewStore.nodes[assignedNodeId] : null;
    let imageUrl = undefined;
    
    if (assignedNode) {
      const blueprint = HARDWARE_LIBRARY[assignedNode.type];
      const assetFolder = blueprint?.assetFolder || assignedNode.type;
      const imageKey = Object.keys(deviceImages).find(k => k.includes(`/${assetFolder}/`));
      imageUrl = imageKey ? deviceImages[imageKey] : undefined;
    }

    return (
      <div className={`bg-card border border-border rounded-xl p-6 ${disabled ? 'opacity-50 grayscale' : ''}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {/* Device Image Preview */}
            <div className="w-12 h-12 rounded-full bg-muted border border-border flex items-center justify-center overflow-hidden shadow-inner flex-shrink-0">
              {imageUrl ? (
                <img src={imageUrl} alt="Device Preview" className="w-full h-full object-contain p-1 drop-shadow-lg" />
              ) : (
                <Icons.Box className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            
            <div className="flex flex-col">
              <h3 className="text-xl font-bold text-card-foreground tracking-tight">{defaultTitle}</h3>
              <select 
                className="bg-transparent text-xs font-bold text-cyan-400 focus:outline-none cursor-pointer hover:text-cyan-300"
                value={assignedNodeId || ''}
                onChange={(e) => store.setTrackAssignment(trackId, e.target.value || null)}
                disabled={disabled}
              >
                <option value="">No Instrument Assigned</option>
                {Object.values(overviewStore.nodes)
                  .filter(n => n.type !== 'daw' && n.type !== 'flow8') // Filter out non-instruments
                  .map(node => (
                  <option key={node.id} value={node.id}>
                    {HARDWARE_LIBRARY[node.type]?.longName || node.type} ({node.id.substring(0, 4)})
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex gap-2 items-center">
            <Button
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => setGenerateTrackId(trackId)}
            >
              <Icons.Wand2 className="w-4 h-4 mr-2" />
              Generate
            </Button>
            <div className="px-3 py-1 rounded bg-muted text-xs font-bold text-muted-foreground">
              {assignedNode?.logicalInChannel ? `CH ${assignedNode.logicalInChannel}` : 'NO CH'}
            </div>
          </div>
        </div>
        <div className="pl-6">
          {rows}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto">
      {/* Top Control Bar */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border p-6 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Icons.ListOrdered className="text-white w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Global Sequencer</h1>
              <p className="text-sm text-muted-foreground">Master Sequence Control</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              variant="default"
              className={`font-bold transition-all ${hasCircuitTracks ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}
              onClick={() => hasCircuitTracks && uiStore.setActiveMainView('circuit')}
              title={hasCircuitTracks ? 'Go to Circuit Tracks Scales Mode' : 'Add a Circuit Tracks device to define Global Scales'}
            >
              <Icons.Music className="w-4 h-4 mr-2" />
              Select Scale
            </Button>
            <div className="w-px h-8 bg-border" />
            <Button 
              size="icon"
              className={`rounded-full transition-all ${store.isPlaying ? 'bg-destructive hover:bg-destructive/90 shadow-lg shadow-destructive/30 text-white' : 'bg-emerald-500 hover:bg-emerald-400 shadow-lg shadow-emerald-500/30 text-white'}`}
              onClick={() => store.togglePlaying()}
            >
              {store.isPlaying ? <Icons.Square className="w-5 h-5 fill-current" /> : <Icons.Play className="w-5 h-5 ml-1 fill-current" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Tracks Container */}
      <div className="p-6 flex flex-col gap-8 pb-32">
        <div className="text-muted-foreground text-sm mb-[-1rem]">
          <strong>Hint:</strong> Left click to toggle step. Right click to override the specific note for a step.
        </div>
        
        {renderTrack('s1', 'S1 Synthesizer', false)}
        
        {renderTrack('drums', 'Drum Sequencer (Coming Soon)', true)}

        <Button 
          variant="outline" 
          className="border-2 border-dashed h-32 flex flex-col items-center justify-center gap-2"
        >
          <Icons.PlusCircle className="w-8 h-8" />
          <span className="font-bold">Add Instrument Track</span>
          <span className="text-xs">Assign a new sequence to a MIDI channel</span>
        </Button>
      </div>

      <PianoDrawer 
        isOpen={selectedStepForOverride !== null}
        onClose={() => setSelectedStepForOverride(null)}
        selectedNoteName={
          selectedStepForOverride 
            ? store.tracks[selectedStepForOverride.trackId]?.[selectedStepForOverride.index]?.noteOverride || null
            : null
        }
        onNoteSelect={(note) => {
          if (selectedStepForOverride) {
            store.setStep(selectedStepForOverride.trackId, selectedStepForOverride.index, true, note || undefined);
          }
        }}
      />
      
      <GenerateSequenceModal 
        isOpen={generateTrackId !== null} 
        onClose={() => setGenerateTrackId(null)} 
        trackId={generateTrackId || ''} 
      />
    </div>
  );
}
