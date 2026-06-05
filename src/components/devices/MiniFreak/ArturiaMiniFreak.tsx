import ScaleFit from '../../Core/ScaleFit/ScaleFit';
import { SidebarContextPortal } from '../../Core/AppSidebar/SidebarContextPortal';
import MiniFreakSidebarContext from './MiniFreakSidebarContext';
import DeviceHelpToggle from '../../Core/DeviceHelpToggle/DeviceHelpToggle';
import { 
  SpaceGraphics, 
  WhiteBtn, 
  Selector, 
  ModMatrix, 
  TouchStrips, 
  Keyboard 
} from './MiniFreakControls';
import { Knob } from '../../Core/HardwareUI/Knob';
import { useUIStore } from '../../../stores/useUIStore';
import { cn } from '../../../lib/utils';
import minifreakGuideUrl from '../../../../doc/minifreak/minifreak-guide.md?url';

const DocLink = ({ sectionId, children, className }: { sectionId: string, children: React.ReactNode, className?: string }) => {
  const { hoveredDocSection, setHoveredDocSection, setActiveDocSection, activeDoc, setActiveDoc, helpMode } = useUIStore();
  const isActive = hoveredDocSection === sectionId;
  const handleClick = () => {
     // Inline help interactions only fire while help mode is enabled via the
     // floating "?" toggle; otherwise the device behaves as normal hardware.
     if (!helpMode) return;
     setActiveDocSection(sectionId);
     if (!activeDoc || activeDoc.url !== minifreakGuideUrl) {
       setActiveDoc({ url: minifreakGuideUrl, type: 'md' });
     }
  };
  return (
    <div 
      className={cn("relative transition-all duration-300 rounded-lg", isActive ? "ring-2 ring-cyan-500 shadow-[0_0_15px_cyan] bg-cyan-900/10" : "", className)}
      onPointerEnter={() => helpMode && setHoveredDocSection(sectionId)}
      onPointerLeave={() => helpMode && setHoveredDocSection(null)}
      onClick={handleClick}
    >
      {children}
    </div>
  );
};

export default function ArturiaMiniFreak() {
  const deviceContent = (
    <div className="w-[1450px] bg-[#1d1f24] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col relative overflow-hidden ring-2 ring-[#111]">
      
      {/* Background Silkscreen Graphic Layer */}
      <SpaceGraphics />

      {/* --- TOP CONTROL PANEL --- */}
      <div className="flex justify-between px-8 py-6 relative z-10">
        
        {/* COLUMN 1: Matrix / Performance */}
        <div className="flex flex-col justify-between gap-6">
           <DocLink sectionId="1-mod-matrix" className="h-[90px] flex items-center gap-4 p-2 -m-2">
              <ModMatrix />
              <Knob label="Amount" size={38} variant="black" />
           </DocLink>
           <DocLink sectionId="2-performance" className="h-[90px] flex items-end pb-1 gap-2.5 p-2 -m-2">
              <WhiteBtn label="Shift" isShift />
              <div className="flex gap-2.5 relative">
                <WhiteBtn label="-" />
                <WhiteBtn label="+" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center h-6 z-10 pointer-events-none">
                  <span className="text-[8px] leading-none opacity-0">-</span>
                  <span className="text-[8px] text-cyan-500 font-bold leading-tight text-center">Octave</span>
                </div>
              </div>
              <WhiteBtn label="Hold/Rest" />
              <WhiteBtn label="Chord" subLabel="Scales" hasLed ledActive />
              <div className="ml-1"><Knob label="Glide" size={38} variant="black" /></div>
           </DocLink>
        </div>

        {/* COLUMN 2: Osc / LFO */}
        <div className="flex flex-col justify-between gap-6">
           <DocLink sectionId="3-osc" className="h-[90px] flex items-center gap-3 p-2 -m-2">
              <Selector title="Oscillators" labels={['1', '2']} activeIdx={0} />
              <Knob label="Tune / Oct" subLabel=" " size={38} variant="black" />
           </DocLink>
           <DocLink sectionId="3-osc" className="h-[90px] flex items-end pb-1 gap-3 p-2 -m-2">
              <Selector title="LFO" titleColor="text-cyan-500" labels={['1', '2']} activeIdx={0} titlePosition="bottom" />
              <Knob label="Rate / Trig" subLabel=" " size={38} variant="black" />
              <Knob label="Wave / Load" subLabel=" " size={38} variant="black" />
           </DocLink>
        </div>

        {/* COLUMN 3: Orange Knobs / Display */}
        <div className="flex flex-col justify-between gap-6 relative">
           <DocLink sectionId="4-display" className="h-[90px] flex items-center gap-4 z-10 p-2 -m-2">
              <Knob variant="orange" label="Type" size={38} />
              <Knob variant="orange" label="Wave" size={38} />
              <Knob variant="orange" label="Timbre" size={38} />
              <Knob variant="orange" label="Shape" size={38} />
              <Knob label="Volume" size={38} variant="black" />
           </DocLink>
           <DocLink sectionId="4-display" className="h-[90px] flex items-end pb-1 z-10 p-2 -m-2">
              
              {/* Screen Component */}
              <div className="flex items-center bg-[#050505] border-2 border-[#1a1a1a] rounded p-2 shadow-[inset_0_0_15px_rgba(0,0,0,1)] w-72">
                <div className="flex gap-4 mr-4 pl-1">
                   <div className="flex flex-col items-center">
                      <button className="w-[18px] h-[18px] rounded-full bg-[#cbd5e1] border border-[#94a3b8] shadow-sm active:translate-y-px" />
                      <span className="text-[7px] text-gray-300 font-bold mt-1">Sound Edit</span>
                      <span className="text-[7px] text-cyan-500 font-bold">Utility</span>
                   </div>
                   <div className="flex flex-col items-center">
                      <button className="w-[18px] h-[18px] rounded-full bg-[#cbd5e1] border border-[#94a3b8] shadow-sm active:translate-y-px" />
                      <span className="text-[7px] text-gray-300 font-bold mt-1">Save</span>
                      <span className="text-[7px] text-cyan-500 font-bold">Panel</span>
                   </div>
                </div>
                <div className="flex-1 flex flex-col justify-center text-cyan-400">
                   <span className="text-[12px] font-bold tracking-wider">MiniFreak</span>
                   <span className="text-[7px] mt-1 opacity-80 uppercase tracking-widest">Algorithmic Synth</span>
                   <svg width="100%" height="15" className="mt-2 opacity-60">
                      <path d="M 0 7 Q 15 0 30 7 T 60 7" fill="none" stroke="#22d3ee" strokeWidth="1.5" />
                   </svg>
                </div>
                <div className="flex flex-col items-center ml-2">
                   <Knob variant="encoder" size={36} />
                   <span className="text-[7px] text-gray-400 font-bold mt-1 text-center leading-tight">Preset /<br/>Edit</span>
                </div>
              </div>

           </DocLink>
        </div>

        {/* COLUMN 4: Filter / CycEnv */}
        <div className="flex flex-col justify-between gap-6">
           <DocLink sectionId="5-filter" className="h-[90px] flex items-center gap-3 p-2 -m-2">
              <Selector title="Filter" labels={['LP', 'BP', 'HP']} activeIdx={0} />
              <Knob label="Cutoff" size={38} variant="black" />
              <Knob label="Resonance" size={38} variant="black" />
              <Knob label="Env / Vel" subLabel=" " size={38} variant="black" />
           </DocLink>
           <DocLink sectionId="6-cycenv" className="h-[90px] flex items-end pb-1 gap-3 p-2 -m-2">
              <Selector title="CycEnv" labels={['Env', 'Run', 'LFO']} activeIdx={0} />
              <Knob label="Rise / Shape" subLabel=" " size={38} variant="black" />
              <Knob label="Fall / Shape" subLabel=" " size={38} variant="black" />
              <Knob label="Hold / Sustain" subLabel=" " size={38} variant="black" />
           </DocLink>
        </div>

        {/* COLUMN 5: Effects / Envelope (The 10-knob block) */}
        <div className="flex flex-col justify-between gap-6">
           <DocLink sectionId="7-effects" className="h-[90px] flex items-center gap-3 p-2 -m-2">
              <Selector title="Effects" labels={['FX 1', 'FX 2', 'FX 3']} activeIdx={0} />
              <Knob label="Type / Sub" size={38} variant="black" />
              <Knob label="Time" size={38} variant="black" />
              <Knob label="Intensity" size={38} variant="black" />
              <Knob label="Amount" size={38} variant="black" />
              <Knob label="Master" size={38} variant="black" />
           </DocLink>
           <DocLink sectionId="8-envelope" className="h-[90px] flex items-end pb-1 gap-3 p-2 -m-2">
              <Selector title="Envelope" labels={['Amp', 'Mod']} activeIdx={0} />
              <Knob label="Attack" size={38} variant="black" />
              <Knob label="Decay" size={38} variant="black" />
              <Knob label="Sustain" size={38} variant="black" />
              <Knob label="Release" size={38} variant="black" />
              <Knob label="Tempo / Swing" subLabel=" " size={38} variant="black" />
           </DocLink>
        </div>

      </div>

      {/* --- MIDDLE STRIP: Arp/Seq Line --- */}
      <DocLink sectionId="9-arp-seq" className="flex items-center justify-between px-6 py-2 border-y-2 border-[#111] bg-[#1a1b1e] relative z-10 shadow-md">
        
        <div className="flex gap-4 items-center mr-8">
          <span className="text-[9px] font-bold text-gray-400 tracking-widest border-r border-[#333] pr-4 leading-[10px]">
            ARPEGGIATOR /<br/>SEQUENCER
          </span>
          <div className="flex gap-3">
            <div className="flex flex-col items-center gap-1"><div className="w-1 h-1 rounded-full bg-white shadow-[0_0_4px_#fff]"></div><span className="text-[7px] font-bold text-white">Off</span><span className="text-[7px] font-bold text-cyan-500">Copy</span></div>
            <div className="flex flex-col items-center gap-1"><div className="w-1 h-1 rounded-full bg-[#333]"></div><span className="text-[7px] font-bold text-gray-400">Arp</span><span className="text-[7px] font-bold text-cyan-500">Paste</span></div>
            <div className="flex flex-col items-center gap-1"><div className="w-1 h-1 rounded-full bg-[#333]"></div><span className="text-[7px] font-bold text-gray-400">Seq</span><span className="text-[7px] font-bold text-cyan-500">Erase</span></div>
          </div>
          <div className="w-px h-6 bg-[#333] mx-2"></div>
          <div className="flex flex-col items-center gap-1"><div className="w-1 h-1 rounded-full bg-[#333]"></div><span className="text-[12px] font-bold text-gray-400 leading-none">▶/■</span></div>
          <div className="flex flex-col items-center gap-1"><div className="w-1 h-1 rounded-full bg-[#333]"></div><span className="text-[12px] font-bold text-gray-400 leading-none">●</span></div>
          <div className="flex flex-col items-center gap-1"><div className="w-1 h-1 rounded-full bg-[#333]"></div><span className="text-[7px] font-bold text-cyan-400 mt-1">Mods</span></div>
        </div>

        <div className="flex gap-3 flex-1 justify-between items-end">
          <span className="text-[12px] text-gray-400">↑</span>
          <span className="text-[12px] text-gray-400">↓</span>
          <span className="text-[12px] text-gray-400">↕</span>
          <span className="text-[12px] text-gray-400">⤮</span>
          <span className="text-[12px] text-gray-400">☷</span>
          <span className="text-[12px] text-gray-400">◷</span>
          <span className="text-[12px] text-gray-400">👣</span>
          <span className="text-[7px] font-bold text-gray-400">Pattern</span>
          <div className="w-px h-4 bg-[#333] mx-1"></div>
          <span className="text-[7px] font-bold text-gray-400">Oct 1</span>
          <span className="text-[7px] font-bold text-gray-400">Oct 2</span>
          <span className="text-[7px] font-bold text-gray-400">Oct 3</span>
          <span className="text-[7px] font-bold text-gray-400">Oct 4</span>
          <div className="w-px h-4 bg-[#333] mx-1"></div>
          <span className="text-[7px] font-bold text-gray-400">Repeat</span>
          <span className="text-[7px] font-bold text-gray-400">Ratchet</span>
          <span className="text-[7px] font-bold text-gray-400">Rand Oct</span>
          <span className="text-[7px] font-bold text-gray-400">Mutate</span>
        </div>

        <div className="flex gap-2 ml-8 items-center">
           <div className="flex gap-2 border border-[#333] p-1.5 rounded bg-[#111]">
             <span className="text-[7px] font-bold text-gray-400">16</span>
             <span className="text-[7px] font-bold text-gray-400">32</span>
             <span className="text-[7px] font-bold text-gray-400">48</span>
             <span className="text-[7px] font-bold text-gray-400">64</span>
           </div>
           <span className="text-[7px] font-bold text-gray-400 ml-2">Last Step</span>
           
           <div className="text-[16px] font-bold tracking-tighter text-gray-200 ml-4">
             MINIFREAK
             <span className="block text-[5px] tracking-[0.4em] font-normal text-gray-500 -mt-1">ALGORITHMIC SYNTHESIZER</span>
           </div>
        </div>
      </DocLink>

      {/* --- BOTTOM PANEL: Touch Strips & Keyboard --- */}
      <div className="flex bg-[#1d1f24] relative z-10 pr-6">
        
        {/* Left Performance Controls */}
        <DocLink sectionId="10-touch-strips" className="w-64 p-6 flex items-start gap-6 border-r border-[#111] z-20">
          <TouchStrips />
          <div className="flex flex-col gap-6 mt-4">
             <WhiteBtn label="Keyboard" subLabel="Bend/Wheel" />
             <WhiteBtn label="Macros" subLabel="M1/M2" />
             <WhiteBtn label="Seq/Arp" subLabel="Gate/Spice" />
          </div>
        </DocLink>

        {/* Right Keyboard Area */}
        <DocLink sectionId="11-keyboard" className="flex-1 flex flex-col justify-end p-2 pb-0 -m-2">
          <Keyboard />
        </DocLink>

      </div>

    </div>
  );

  return (
    <div className="flex h-full w-full bg-neutral-900 overflow-hidden font-sans select-none relative">
      <SidebarContextPortal>
        <MiniFreakSidebarContext />
      </SidebarContextPortal>

      {/* Center Panel */}
      <div className="flex-1 min-h-0 bg-[#111] flex flex-col items-center justify-center relative overflow-hidden">
        <DeviceHelpToggle guideUrl={minifreakGuideUrl} />
        <ScaleFit baseWidth={1100} baseHeight={600} maxScale={3}>
          {deviceContent}
        </ScaleFit>
      </div>
    </div>
  );
}
