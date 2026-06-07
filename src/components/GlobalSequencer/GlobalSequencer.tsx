import { useState } from 'react';
import { useSequencerStore } from '../../stores/useSequencerStore';
import { useOverviewStore } from '../../stores/useOverviewStore';
import { useUIStore } from '../../stores/useUIStore';
import * as Icons from 'lucide-react';
import PianoDrawer from './PianoDrawer';

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
  
  const hasCircuitTracks = Object.values(overviewStore.nodes).some(d => d.type === 'circuit');

  const [selectedStepForOverride, setSelectedStepForOverride] = useState<{ trackId: string, index: number } | null>(null);

  const handleStepClick = (trackId: string, index: number) => {
    store.toggleStep(trackId, index);
  };

  const handleStepContextMenu = (e: React.MouseEvent, trackId: string, index: number) => {
    e.preventDefault();
    setSelectedStepForOverride({ trackId, index });
  };

  const renderTrack = (trackId: string, title: string, disabled: boolean = false) => {
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

    return (
      <div className={`bg-neutral-900 border border-neutral-800 rounded-xl p-6 ${disabled ? 'opacity-50 grayscale' : ''}`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
          <div className="flex gap-2">
            <div className="px-3 py-1 rounded bg-neutral-800 text-xs font-bold text-neutral-400">CH 1</div>
          </div>
        </div>
        <div className="pl-6">
          {rows}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950 overflow-y-auto">
      {/* Top Control Bar */}
      <div className="sticky top-0 z-10 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800 p-6 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Icons.ListOrdered className="text-white w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Global Sequencer</h1>
              <p className="text-sm text-neutral-400">Master Sequence Control</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all ${hasCircuitTracks ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'}`}
              onClick={() => hasCircuitTracks && uiStore.setActiveMainView('circuit')}
              title={hasCircuitTracks ? 'Go to Circuit Tracks Scales Mode' : 'Add a Circuit Tracks device to define Global Scales'}
            >
              <Icons.Music className="w-4 h-4" />
              Select Scale
            </button>
            <div className="w-px h-8 bg-neutral-800" />
            <button 
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${store.isPlaying ? 'bg-red-500 hover:bg-red-400 shadow-lg shadow-red-500/30 text-white' : 'bg-emerald-500 hover:bg-emerald-400 shadow-lg shadow-emerald-500/30 text-white'}`}
              onClick={() => store.togglePlaying()}
            >
              {store.isPlaying ? <Icons.Square className="w-5 h-5 fill-current" /> : <Icons.Play className="w-5 h-5 ml-1 fill-current" />}
            </button>
          </div>
        </div>

        {/* Global Sequence Settings */}
        <div className="flex items-center gap-6 bg-neutral-900 border border-neutral-800 rounded-lg p-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Pattern Size</label>
            <select 
              className="bg-neutral-800 border border-neutral-700 text-white text-sm rounded px-3 py-1.5 focus:outline-none focus:border-cyan-500"
              value={store.patternSize}
              onChange={(e) => store.setPatternSize(parseInt(e.target.value, 10))}
            >
              <option value={8}>8 Steps</option>
              <option value={16}>16 Steps</option>
              <option value={24}>24 Steps</option>
              <option value={32}>32 Steps</option>
              <option value={48}>48 Steps</option>
              <option value={64}>64 Steps</option>
            </select>
          </div>

          <div className="w-px h-8 bg-neutral-800" />

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Arp Type</label>
            <select 
              className="bg-neutral-800 border border-neutral-700 text-white text-sm rounded px-3 py-1.5 focus:outline-none focus:border-pink-500"
              value={store.arpMode}
              onChange={(e) => store.setArpMode(e.target.value as any)}
            >
              <option value="up">Up</option>
              <option value="up-down">Up-Down</option>
              <option value="random">Random</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Sequence Mode</label>
            <select 
              className="bg-neutral-800 border border-neutral-700 text-white text-sm rounded px-3 py-1.5 focus:outline-none focus:border-pink-500"
              value={store.sequenceMode}
              onChange={(e) => store.setSequenceMode(e.target.value as any)}
            >
              <option value="full">Full Scale</option>
              <option value="1-3-5">1-3-5</option>
              <option value="1-3-5-7-9">1-3-5-7-9</option>
              <option value="1-3-5-7-9-11">1-3-5-7-9-11</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Loop Mode</label>
            <select 
              className="bg-neutral-800 border border-neutral-700 text-white text-sm rounded px-3 py-1.5 focus:outline-none focus:border-pink-500"
              value={store.loopMode}
              onChange={(e) => store.setLoopMode(e.target.value as any)}
            >
              <option value="continuous">Continuous</option>
              <option value="one-off">One-Off</option>
            </select>
          </div>

          <div className="w-px h-8 bg-neutral-800" />

          <label className="flex items-center gap-3 cursor-pointer group">
            <div className={`w-10 h-5 rounded-full p-1 transition-colors ${store.rollingBass ? 'bg-cyan-500' : 'bg-neutral-700'}`}>
              <div className={`w-3 h-3 bg-white rounded-full transition-transform ${store.rollingBass ? 'translate-x-5' : ''}`} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">Rolling Bass</span>
              <span className="text-[10px] text-neutral-500">Continuous 16th notes</span>
            </div>
            <input 
              type="checkbox" 
              className="hidden" 
              checked={store.rollingBass} 
              onChange={(e) => store.setRollingBass(e.target.checked)} 
            />
          </label>

        </div>
      </div>

      {/* Tracks Container */}
      <div className="p-6 flex flex-col gap-8 pb-32">
        <div className="text-neutral-500 text-sm mb-[-1rem]">
          <strong>Hint:</strong> Left click to toggle step. Right click to override the specific note for a step.
        </div>
        
        {renderTrack('s1', 'S1 Synthesizer', false)}
        
        {renderTrack('drums', 'Drum Sequencer (Coming Soon)', true)}

        <button className="border-2 border-dashed border-neutral-800 rounded-xl p-8 flex flex-col items-center justify-center gap-2 text-neutral-500 hover:text-neutral-300 hover:border-neutral-700 transition-colors">
          <Icons.PlusCircle className="w-8 h-8" />
          <span className="font-bold">Add Instrument Track</span>
          <span className="text-xs">Assign a new sequence to a MIDI channel</span>
        </button>
      </div>

      <PianoDrawer 
        isOpen={selectedStepForOverride !== null}
        onClose={() => setSelectedStepForOverride(null)}
        selectedNoteName={
          selectedStepForOverride 
            ? store.tracks[selectedStepForOverride.trackId]?.[selectedStepForOverride.index]?.noteOverride || null
            : null
        }
        onNoteSelect={(noteName) => {
          if (selectedStepForOverride) {
            store.setStep(
              selectedStepForOverride.trackId, 
              selectedStepForOverride.index, 
              store.tracks[selectedStepForOverride.trackId]![selectedStepForOverride.index]!.active,
              noteName || undefined
            );
          }
        }}
      />
    </div>
  );
}
