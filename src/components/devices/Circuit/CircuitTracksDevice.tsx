import { useEffect } from 'react';
import { useCircuitTracksStore } from '../../../stores/useCircuitTracksStore';
import { useUIStore } from '../../../stores/useUIStore';
import { PAGES } from '../../../utils/constants';
import type { PageIndex } from '../../../types';
import SortablePad from './Grid/SortablePad';
import PackPad from './PackOrganizer/PackPad';
import ScalePad from './Scales/ScalePad';
import ScalesDrawer from './Scales/ScalesDrawer';
import TempoDrawer from './Tempo/TempoDrawer';
import { Knob } from '../../Core/HardwareUI/Knob';
import { FunctionButton } from '../../Core/HardwareUI/FunctionButton';
import { FunctionPad } from '../../Core/HardwareUI/FunctionPad';
import { DownArrow, UpArrow, RecordIcon, PlayIcon } from '../../Core/HardwareUI/Icons';
import ScaleFit from '../../Core/ui/ScaleFit';
import circuitGuideUrl from "../../../../doc/circuit/circuit-tracks-guide.md?url";

export default function CircuitTracksDevice() {
  const deviceMode = useCircuitTracksStore((s) => s.deviceMode);
  const setDeviceMode = useCircuitTracksStore((s) => s.setDeviceMode);
  const duplicateActivePack = useCircuitTracksStore((s) => s.duplicateActivePack);
  const clearActivePack = useCircuitTracksStore((s) => s.clearActivePack);

  const slots = useCircuitTracksStore((s) => s.slots);
  const packSlots = useCircuitTracksStore((s) => s.packSlots);
  const activePage = useUIStore((s) => s.activePage);
  const setActivePage = useUIStore((s) => s.setActivePage);
  const selectedPadIndex = useUIStore((s) => s.selectedPadIndex);
  const selectPad = useUIStore((s) => s.selectPad);
  const setSelectedFile = useUIStore((s) => s.setSelectedFile);
  const { setActiveDocSection, activeDoc, setActiveDoc } = useUIStore();

  const handleSectionClick = (sectionId: string) => {
    setActiveDocSection(sectionId);
    if (!activeDoc || activeDoc.url !== circuitGuideUrl) {
      setActiveDoc({ url: circuitGuideUrl, type: 'md' });
    }
  };

  useEffect(() => {
    if (deviceMode !== 'samples') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      const currentIdx = selectedPadIndex ?? -1;
      let newIndex = currentIdx;
      
      if (e.key === 'ArrowRight') {
        newIndex = currentIdx === -1 ? 0 : currentIdx + 1;
        e.preventDefault();
      } else if (e.key === 'ArrowLeft') {
        newIndex = currentIdx === -1 ? 0 : currentIdx - 1;
        e.preventDefault();
      } else if (e.key === 'ArrowDown') {
        newIndex = currentIdx === -1 ? 0 : currentIdx + 8;
        e.preventDefault();
      } else if (e.key === 'ArrowUp') {
        newIndex = currentIdx === -1 ? 0 : currentIdx - 8;
        e.preventDefault();
      } else {
        return;
      }

      if (newIndex >= 0 && newIndex < 64) {
        selectPad(newIndex);
        const newPage = Math.floor(newIndex / 32) as PageIndex;
        if (newPage !== activePage) {
          setActivePage(newPage);
        }

        const slot = useCircuitTracksStore.getState().slots[newIndex];
        if (slot && slot.sample) {
          useCircuitTracksStore.getState().playSlot(newIndex, slot.sample.fileHandle);
          setSelectedFile(slot.sample);
        } else {
          setSelectedFile(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPadIndex, activePage, selectPad, setActivePage, setSelectedFile, deviceMode]);

  const pageConfig = PAGES.find((p) => p.index === activePage);
  if (!pageConfig) return null;

  const [start, end] = pageConfig.slotRange;
  const activePageSlots = slots.slice(start, end);
  const activePackSlots = packSlots.slice(start, end);

  const padsToRender = deviceMode === 'packs' ? activePackSlots : activePageSlots;

  const renderPadRow = (startIndex: number, endIndex: number) => {
    if (deviceMode === 'scales') {
      return Array.from({ length: endIndex - startIndex }, (_, i) => {
        const absoluteIndex = startIndex + i;
        return <ScalePad key={`scale-${absoluteIndex}`} index={absoluteIndex} />;
      });
    }
    return padsToRender.slice(startIndex, endIndex).map((slot: any) => 
      deviceMode === 'packs' 
        ? <PackPad key={`pack-${slot.index}`} slot={slot} onSelect={() => setDeviceMode('samples')} /> 
        : <SortablePad key={`pad-${slot.index}`} slot={slot} />
    );
  };

  return (
    <ScaleFit baseWidth={1050} baseHeight={800} maxScale={4}>
      <div className="w-[1000px] bg-[#18181a] rounded-2xl p-8 shadow-2xl border-t border-gray-700/20 ring-1 ring-black relative overflow-hidden">
        
        <ScalesDrawer />
        <TempoDrawer />

        {/* KNOBS SECTION */}
        <div className="grid grid-cols-11 w-full relative mb-10 mt-2 gap-y-6">
          <div className="row-start-1 col-start-1 col-span-2 flex justify-center"><Knob label="Master Volume" sectionId="211-master-volume" onInteract={() => handleSectionClick('211-master-volume')} /></div>
          <div className="row-start-1 col-start-3 col-span-2 flex justify-center"><Knob label="2 Oscillator Mod" sectionId="221-macros" onInteract={() => handleSectionClick('221-macros')} /></div>
          <div className="row-start-1 col-start-5 col-span-2 flex justify-center"><Knob label="4 Filter Envelope" sectionId="221-macros" onInteract={() => handleSectionClick('221-macros')} /></div>
          <div className="row-start-1 col-start-7 col-span-2 flex justify-center"><Knob label="6 Resonance" sectionId="221-macros" onInteract={() => handleSectionClick('221-macros')} /></div>
          <div className="row-start-1 col-start-9 col-span-2 flex justify-center"><Knob label="8 FX" sectionId="221-macros" onInteract={() => handleSectionClick('221-macros')} /></div>

          <div className="row-start-2 col-start-2 col-span-2 flex justify-center"><Knob label="1 Oscillator" sectionId="221-macros" onInteract={() => handleSectionClick('221-macros')} /></div>
          <div className="row-start-2 col-start-4 col-span-2 flex justify-center"><Knob label="3 Amp Envelope" sectionId="221-macros" onInteract={() => handleSectionClick('221-macros')} /></div>
          <div className="row-start-2 col-start-6 col-span-2 flex justify-center"><Knob label="5 Filter Frequency" sectionId="221-macros" onInteract={() => handleSectionClick('221-macros')} /></div>
          <div className="row-start-2 col-start-8 col-span-2 flex justify-center"><Knob label="7 Modulation" sectionId="221-macros" onInteract={() => handleSectionClick('221-macros')} /></div>
          <div className="row-start-2 col-start-10 col-span-2 flex justify-center"><Knob label="Master Filter" sectionId="212-master-filter" onInteract={() => handleSectionClick('212-master-filter')} /></div>
        </div>

        {/* BUTTONS & PADS SECTION */}
        <div className="w-full bg-[#1e1e20] p-4 rounded-xl border border-black/40 shadow-inner">
          
          {/* ROW 1: Small Rectangular Buttons */}
          <div className="grid grid-cols-10 gap-x-3 mb-2 opacity-50">
            <FunctionButton 
              label="Scales" 
              isActive={true} 
              onClick={() => { setDeviceMode(deviceMode === 'scales' ? 'samples' : 'scales'); handleSectionClick('251-scales'); }}
              className="!opacity-100 ring-2 ring-transparent active:ring-white transition-all"
              sectionId="251-scales"
            />
            <FunctionButton icon={<DownArrow />} sectionId="261-up-down" onClick={() => handleSectionClick('261-up-down')} />
            <FunctionButton icon={<UpArrow />} sectionId="261-up-down" onClick={() => handleSectionClick('261-up-down')} />
            <FunctionButton label={"1-16\n17-32"} sectionId="262-step-page" onClick={() => handleSectionClick('262-step-page')} />
            <FunctionButton 
              topLabel="Tap" 
              label={"Tempo\nSwing"} 
              isActive={deviceMode === 'tempo'}
              onClick={() => { setDeviceMode(deviceMode === 'tempo' ? 'samples' : 'tempo'); handleSectionClick('263-tempo-swing'); }}
              className="!opacity-100 ring-2 ring-transparent active:ring-white transition-all"
              sectionId="263-tempo-swing"
            />
            <FunctionButton 
              topLabel="Click" 
              label="Clear" 
              isActive={true} 
              onClick={() => { clearActivePack(); handleSectionClick('264-clear'); }} 
              className="!opacity-100 ring-2 ring-transparent active:ring-white transition-all"
              sectionId="264-clear"
            />
            <FunctionButton 
              topLabel="Mutate" 
              label="Duplicate" 
              isActive={true} 
              onClick={() => { duplicateActivePack(); handleSectionClick('265-duplicate'); }} 
              className="!opacity-100 ring-2 ring-transparent active:ring-white transition-all"
              sectionId="265-duplicate"
            />
            <FunctionButton topLabel="Setup" label="Save" sectionId="266-save" onClick={() => handleSectionClick('266-save')} />
            <FunctionButton 
              topLabel="Packs" 
              label="Projects" 
              isActive={true} 
              onClick={() => { setDeviceMode(deviceMode === 'packs' ? 'samples' : 'packs'); handleSectionClick('267-projects'); }} 
              className="!opacity-100 ring-2 ring-transparent active:ring-white transition-all"
              sectionId="267-projects"
            />
            <FunctionButton label="Shift" sectionId="268-shift" onClick={() => handleSectionClick('268-shift')} />
          </div>

          {/* ROW 2: Track Select & Pattern Square Pads */}
          <div className="grid grid-cols-10 gap-3 mb-3 opacity-50">
            <FunctionPad label="Preset" className="!opacity-100 ring-2 ring-transparent transition-all" sectionId="255-preset" onClick={() => handleSectionClick('255-preset')} />
            <FunctionPad label="Synth 1" labelColor="text-fuchsia-400" sectionId="231-synth-tracks" onClick={() => handleSectionClick('231-synth-tracks')} />
            <FunctionPad label="Synth 2" labelColor="text-fuchsia-400" sectionId="231-synth-tracks" onClick={() => handleSectionClick('231-synth-tracks')} />
            <FunctionPad label="MIDI 1" sectionId="232-midi-tracks" onClick={() => handleSectionClick('232-midi-tracks')} />
            <FunctionPad label="MIDI 2" sectionId="232-midi-tracks" onClick={() => handleSectionClick('232-midi-tracks')} />
            <FunctionPad label="Drum 1" sectionId="233-drum-tracks" onClick={() => handleSectionClick('233-drum-tracks')} />
            <FunctionPad label="Drum 2" sectionId="233-drum-tracks" onClick={() => handleSectionClick('233-drum-tracks')} />
            <FunctionPad label="Drum 3" sectionId="233-drum-tracks" onClick={() => handleSectionClick('233-drum-tracks')} />
            <FunctionPad label="Drum 4" sectionId="233-drum-tracks" onClick={() => handleSectionClick('233-drum-tracks')} />
            <FunctionPad label="Patterns" subLabel="View Lock" sectionId="252-patterns" onClick={() => handleSectionClick('252-patterns')} />
          </div>

          {/* MAIN PAD GRID AREA (Rows 3 to 6) */}
          <div className="grid grid-cols-10 gap-3">
            
            {/* ROW 3 */}
            <FunctionPad label="Note" subLabel="Expand" className="opacity-50 !opacity-100 ring-2 ring-transparent hover:ring-cyan-500 transition-all" sectionId="241-note" onClick={() => handleSectionClick('241-note')} />
            {renderPadRow(0, 8)}
            <FunctionPad label="Mixer" labelColor="text-cyan-400" className="opacity-50 !opacity-100 ring-2 ring-transparent hover:ring-cyan-500 transition-all" sectionId="253-mixer" onClick={() => handleSectionClick('253-mixer')} />

            {/* ROW 4 */}
            <FunctionPad label="Velocity" subLabel="Fixed" className="opacity-50 !opacity-100 ring-2 ring-transparent hover:ring-cyan-500 transition-all" sectionId="242-velocity" onClick={() => handleSectionClick('242-velocity')} />
            {renderPadRow(8, 16)}
            <FunctionPad label="FX" subLabel="Side Chain" className="opacity-50 !opacity-100 ring-2 ring-transparent hover:ring-cyan-500 transition-all" sectionId="254-fx" onClick={() => handleSectionClick('254-fx')} />

            {/* ROW 5 */}
            <FunctionPad label="Gate" subLabel="Micro Step" className="opacity-50 !opacity-100 ring-2 ring-transparent hover:ring-cyan-500 transition-all" sectionId="243-gate" onClick={() => handleSectionClick('243-gate')} />
            {renderPadRow(16, 24)}
            <FunctionPad 
              icon={<RecordIcon />} 
              label="Rec"
              labelColor="text-red-400"
              subLabel="Quantise" 
              className="opacity-50 !opacity-100 ring-2 ring-transparent hover:ring-cyan-500 transition-all"
              sectionId="272-record"
              onClick={() => handleSectionClick('272-record')}
            />

            {/* ROW 6 */}
            <FunctionPad label="Pattern Settings" subLabel="Probability" className="opacity-50 !opacity-100 ring-2 ring-transparent hover:ring-cyan-500 transition-all" sectionId="244-pattern-settings" onClick={() => handleSectionClick('244-pattern-settings')} />
            {renderPadRow(24, 32)}
            <FunctionPad icon={<PlayIcon />} className="opacity-50 !opacity-100 ring-2 ring-transparent hover:ring-cyan-500 transition-all" sectionId="271-play" onClick={() => handleSectionClick('271-play')} />

          </div>
        </div>
      </div>
    </ScaleFit>
  );
}
