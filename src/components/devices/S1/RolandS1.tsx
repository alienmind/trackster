
import ScaleFit from '../../Core/ScaleFit/ScaleFit';
import DeviceHelpToggle from '../../Core/DeviceHelpToggle/DeviceHelpToggle';
import { SidebarContextPortal } from '../../Core/AppSidebar/SidebarContextPortal';
import { useUIStore } from '../../../stores/useUIStore';
import { cn } from '../../../lib/utils';
import S1SidebarContext from './S1SidebarContext';
import OscilloscopeDrawer from '../../Core/OscilloscopeDrawer/OscilloscopeDrawer';
import {
  Jack,
  S1Knob,
  SqIcon,
  SawIcon,
  RangeKnob,
  RectButton,
  VerticalBtn,
  StepPad,
  LedDisplay
} from './S1Controls';
import s1GuideUrl from '../../../../doc/s1/roland-s1-guide.md?url';

const DocLink = ({ sectionId, children, className }: { sectionId: string, children: React.ReactNode, className?: string }) => {
  const { hoveredDocSection, setHoveredDocSection, setActiveDocSection, activeDoc, setActiveDoc, helpMode } = useUIStore();
  const isActive = hoveredDocSection === sectionId;
  const handleClick = () => {
     if (!helpMode) return;
     setActiveDocSection(sectionId);
     if (!activeDoc || activeDoc.url !== s1GuideUrl) {
       setActiveDoc({ url: s1GuideUrl, type: 'md' });
     }
  };
  return (
    <div 
      className={cn("relative transition-all duration-300 rounded-[3px]", isActive ? "ring-2 ring-cyan-500 shadow-[0_0_15px_cyan] bg-cyan-900/20" : "", className)}
      onPointerEnter={() => helpMode && setHoveredDocSection(sectionId)}
      onPointerLeave={() => helpMode && setHoveredDocSection(null)}
      onClick={handleClick}
    >
      {children}
    </div>
  );
};

export default function RolandS1() {
  const deviceContent = (
    <div className="w-[1000px] h-[500px] bg-[#292a2d] rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.1)] flex flex-col relative border border-[#1a1a1c] overflow-hidden select-none">
      
      {/* Subtle noise texture */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

      {/* --- TOP HEADER ROW --- */}
      <div className="flex justify-end items-end px-8 pt-4 pb-2 relative z-10 gap-8 h-16">
        
        {/* CHARGE LED */}
        <div className="flex items-center gap-1.5 pb-[26px] mr-2">
          <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_6px_#f97316]"></div>
          <span className="text-[7px] text-white font-bold tracking-widest">CHARGE</span>
        </div>
        
        {/* IN - SYNC - OUT */}
        <div className="flex flex-col items-center justify-end">
          <div className="flex gap-4">
            <Jack />
            <Jack />
          </div>
          <div className="mt-1 flex flex-col items-center justify-start min-h-[16px]">
            <span className="text-[7px] text-gray-300 font-bold tracking-wider">IN &ndash; SYNC &ndash; OUT</span>
          </div>
        </div>

        {/* IN - MIX - OUT */}
        <div className="flex flex-col items-center justify-end">
          <div className="flex gap-4">
            <Jack />
            <Jack />
          </div>
          <div className="mt-1 flex flex-col items-center justify-start min-h-[16px]">
            <span className="text-[7px] text-gray-300 font-bold tracking-wider">IN &ndash; MIX &ndash; OUT</span>
          </div>
        </div>

        {/* VOLUME */}
        <div className="flex flex-col items-center justify-end">
          <DocLink sectionId="knob-volume"><S1Knob size={24} label="VOLUME" /></DocLink>
        </div>

      </div>

      {/* --- MAIN INTERFACE GRID (Strict 8 Columns x 3 Rows) --- */}
      <div className="flex w-full px-8 pt-2 relative z-10">
         
         {/* Section Headers & Horizontal Line */}
         <div className="absolute top-[170px] left-[176px] right-[32px] h-px bg-[#444] z-0"></div>
         <div className="absolute top-[170px] left-[563px] -translate-x-1/2 -translate-y-1/2 bg-[#292a2d] px-2 text-[10px] text-white font-bold tracking-widest z-10">ENV</div>

         {/* Col 0: Display & Play Controls */}
         <div className="w-[160px] flex flex-col items-center relative z-10">
            <div className="h-[75px] flex justify-center items-center"><DocLink sectionId="display-dictionary" className="flex justify-center items-center"><LedDisplay /></DocLink></div>
            <div className="h-[75px] flex justify-center items-center"><DocLink sectionId="knob-tempo"><S1Knob variant="encoder" size={46} label="TEMPO/VALUE" /></DocLink></div>
            <div className="h-[75px] flex justify-center items-center gap-4 w-full">
               <DocLink sectionId="btn-play" className="flex justify-center items-center"><RectButton label="▶" width="w-10" active ledColor="#4ade80" /></DocLink>
               <DocLink sectionId="btn-rec" className="flex justify-center items-center"><RectButton label="●" width="w-10" /></DocLink>
            </div>
         </div>

         {/* Col 1: LFO */}
         <div className="flex-1 flex flex-col items-center border-r border-[#444] relative z-10">
            <span className="absolute -top-4 text-[10px] text-white font-bold tracking-widest">LFO</span>
            <div className="h-[75px] flex justify-center items-center"><DocLink sectionId="knob-lfo-rate"><S1Knob label="RATE" /></DocLink></div>
            <div className="h-[75px] flex justify-center items-center relative w-full">
               <DocLink sectionId="knob-lfo-wave" className="flex justify-center items-center w-full"><S1Knob label="WAVE FORM" /></DocLink>
               <div className="absolute top-[15px] left-[10px] text-[10px] text-white font-bold">/\</div>
               <div className="absolute top-[15px] right-[10px] text-[10px] text-white font-bold">⎍</div>
               <div className="absolute top-[35px] left-[6px] text-[10px] text-white font-bold">N</div>
               <div className="absolute top-[35px] right-[2px] text-[7px] text-white font-bold">RND</div>
               <div className="absolute bottom-[8px] right-[0px] text-[6px] text-white font-bold">NOISE</div>
            </div>
            <div className="h-[75px] flex justify-center items-center"><DocLink sectionId="btn-pattern" className="flex justify-center items-center"><RectButton label="PATTERN" bottomLabel="STEP LOOP" width="w-[50px]" /></DocLink></div>
         </div>

         {/* Col 2: RANGE / STEP */}
         <div className="flex-1 flex flex-col items-center relative z-10">
            <span className="absolute -top-4 text-[10px] text-white font-bold tracking-widest left-[150%] -translate-x-1/2">OSCILLATOR</span>
            <div className="h-[75px] flex justify-center items-center"><DocLink sectionId="knob-osc-range"><RangeKnob /></DocLink></div>
            <div className="h-[75px] flex justify-center items-center"><DocLink sectionId="knob-osc-lfo"><S1Knob label="LFO" /></DocLink></div>
            <div className="h-[75px] flex justify-center items-center"><DocLink sectionId="btn-step" className="flex justify-center items-center"><RectButton label="STEP" active ledColor="#ef4444" bottomLabel="KEY TRANSPOSE" width="w-[50px]" /></DocLink></div>
         </div>

         {/* Col 3: OSC 1 / ATTACK */}
         <div className="flex-1 flex flex-col items-center relative z-10">
            <div className="h-[75px] flex justify-center items-center"><DocLink sectionId="knob-osc1-sqr"><S1Knob label={<SqIcon />} ringColor="#14b8a6" /></DocLink></div>
            <div className="h-[75px] flex justify-center items-center"><DocLink sectionId="knob-osc1-sub"><S1Knob label="SUB" ringColor="#14b8a6" /></DocLink></div>
            <div className="h-[75px] flex justify-center items-center pt-2"><DocLink sectionId="knob-env-attack"><S1Knob label="ATTACK" /></DocLink></div>
         </div>

         {/* Col 4: OSC 2 / DECAY */}
         <div className="flex-1 flex flex-col items-center border-r border-[#444] relative z-10">
            <div className="h-[75px] flex justify-center items-center"><DocLink sectionId="knob-osc2-saw"><S1Knob label={<SawIcon />} ringColor="#14b8a6" /></DocLink></div>
            <div className="h-[75px] flex justify-center items-center"><DocLink sectionId="knob-osc2-noise"><S1Knob label="NOISE" ringColor="#14b8a6" /></DocLink></div>
            <div className="h-[75px] flex justify-center items-center pt-2"><DocLink sectionId="knob-env-decay"><S1Knob label="DECAY" /></DocLink></div>
         </div>

         {/* Col 5: FILTER 1 / SUSTAIN */}
         <div className="flex-1 flex flex-col items-center relative z-10">
            <span className="absolute -top-4 text-[10px] text-white font-bold tracking-widest left-[100%] -translate-x-1/2">FILTER</span>
            <div className="h-[75px] flex justify-center items-center"><DocLink sectionId="knob-filter-freq"><S1Knob label="FREQ" ringColor="#f97316" /></DocLink></div>
            <div className="h-[75px] flex justify-center items-center"><DocLink sectionId="knob-filter-lfo"><S1Knob label="LFO" ringColor="#e5e7eb" /></DocLink></div>
            <div className="h-[75px] flex justify-center items-center pt-2"><DocLink sectionId="knob-env-sustain"><S1Knob label="SUSTAIN" /></DocLink></div>
         </div>

         {/* Col 6: FILTER 2 / RELEASE */}
         <div className="flex-1 flex flex-col items-center border-r border-[#444] relative z-10">
            <div className="h-[75px] flex justify-center items-center"><DocLink sectionId="knob-filter-reso"><S1Knob label="RESO" ringColor="#f97316" /></DocLink></div>
            <div className="h-[75px] flex justify-center items-center"><DocLink sectionId="knob-filter-env"><S1Knob label="ENV" ringColor="#f97316" /></DocLink></div>
            <div className="h-[75px] flex justify-center items-center pt-2"><DocLink sectionId="knob-env-release"><S1Knob label="RELEASE" /></DocLink></div>
         </div>

         {/* Col 7: EFX */}
         <div className="flex-1 flex flex-col items-center relative z-10">
            <span className="absolute -top-4 text-[10px] text-white font-bold tracking-widest">EFX</span>
            <div className="h-[75px] flex justify-center items-center"><DocLink sectionId="knob-efx-delay"><S1Knob label="DELAY" /></DocLink></div>
            <div className="h-[75px] flex justify-center items-center"><DocLink sectionId="knob-efx-reverb"><S1Knob label="REVERB" /></DocLink></div>
            <div className="h-[75px] flex justify-center items-center"><DocLink sectionId="btn-dmotion" className="flex justify-center items-center"><RectButton label="D-MOTION" bottomLabel="DESTINATION" width="w-[50px]" /></DocLink></div>
         </div>

      </div>

      {/* --- BOTTOM ROW: Piano-Style Control Keys --- */}
      <div className="flex flex-col w-full px-8 mt-2 pb-6 relative z-10 border-t border-[#1a1a1a] bg-[#222] pt-4">
         
         {/* Top Row: "Black Keys" & Horizontal Shift/Hold */}
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(16, minmax(0, 1fr))', gap: '0.5rem' }} className="mb-1 items-end h-[50px]">
            {/* Col 1 */}
            <div className="flex justify-center"><DocLink sectionId="btn-shift" className="w-full flex justify-center"><VerticalBtn label="SHIFT" /></DocLink></div>
            {/* Cols 2-3 (Piano Offset: 50% shifted right across gap) */}
            <div className="flex justify-center translate-x-[calc(50%+0.25rem)]"><DocLink sectionId="btn-octave" className="w-full flex justify-center"><VerticalBtn label="OCT-" /></DocLink></div>
            <div className="flex justify-center translate-x-[calc(50%+0.25rem)]"><DocLink sectionId="btn-octave" className="w-full flex justify-center"><VerticalBtn label="OCT+" /></DocLink></div>
            {/* Col 4 (Empty) */} <div />
            {/* Cols 5-7 */}
            <div className="flex justify-center translate-x-[calc(50%+0.25rem)]"><DocLink sectionId="pad-pwm-depth" className="w-full flex justify-center"><VerticalBtn label="PWM" bottomLabel="DEPTH" /></DocLink></div>
            <div className="flex justify-center translate-x-[calc(50%+0.25rem)]"><DocLink sectionId="pad-pwm-src" className="w-full flex justify-center"><VerticalBtn label="PWM" bottomLabel="SRC" /></DocLink></div>
            <div className="flex justify-center translate-x-[calc(50%+0.25rem)]"><DocLink sectionId="pad-sub-oct" className="w-full flex justify-center"><VerticalBtn label="SUB" bottomLabel={`OCT\n `} /></DocLink></div>
            {/* Col 8 (Empty) */} <div />
            {/* Cols 9-10 */}
            <div className="flex justify-center translate-x-[calc(50%+0.25rem)]"><DocLink sectionId="pad-env-trg" className="w-full flex justify-center"><VerticalBtn label="ENV" bottomLabel="TRG" /></DocLink></div>
            <div className="flex justify-center translate-x-[calc(50%+0.25rem)]"><DocLink sectionId="pad-amp" className="w-full flex justify-center"><VerticalBtn label="AMP" /></DocLink></div>
            {/* Col 11 (Empty) */} <div />
            {/* Cols 12-14 */}
            <div className="flex justify-center translate-x-[calc(50%+0.25rem)]"><DocLink sectionId="pad-poly" className="w-full flex justify-center"><VerticalBtn label="POLY" /></DocLink></div>
            <div className="flex justify-center translate-x-[calc(50%+0.25rem)]"><DocLink sectionId="pad-porta-on" className="w-full flex justify-center"><VerticalBtn label="PORTA" bottomLabel="ON" active ledColor="#ef4444" /></DocLink></div>
            <div className="flex justify-center translate-x-[calc(50%+0.25rem)]"><DocLink sectionId="pad-porta-time" className="w-full flex justify-center"><VerticalBtn label="PORTA" bottomLabel="TIME" active ledColor="#ef4444" /></DocLink></div>
            {/* Col 15 (Hold Button offset between 15 and 16) */} 
            <div className="flex justify-center translate-x-[calc(50%+0.25rem)]">
               <DocLink sectionId="btn-hold" className="w-full flex justify-center"><VerticalBtn label="HOLD" bottomLabel="MANUAL" /></DocLink>
            </div>
            {/* Col 16 (Empty due to shift) */} <div />
         </div>

         {/* Bottom Row: "White Keys" (16-Step Pads) */}
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(16, minmax(0, 1fr))', gap: '0.5rem' }}>
            <DocLink sectionId="pad-1-exit"><StepPad number="1" label="EXIT" isGlowing /></DocLink>
            <DocLink sectionId="pad-2-enter"><StepPad number="2" label="ENTER" isGlowing /></DocLink>
            <DocLink sectionId="pad-3-shuffle"><StepPad number="3" label="SHUFFLE" /></DocLink>
            <DocLink sectionId="pad-4-last"><StepPad number="4" label="LAST" /></DocLink>
            <DocLink sectionId="pad-5-osc-draw"><StepPad number="5" label="DRAW" groupLabel="OSC" isGlowing /></DocLink>
            <DocLink sectionId="pad-6-osc-chop"><StepPad number="6" label="CHOP" groupLabel="—" /></DocLink>
            <DocLink sectionId="pad-7-filter-kybd"><StepPad number="7" label="FILTER" groupLabel="KYBD" /></DocLink>
            <DocLink sectionId="pad-8-arp-on"><StepPad number="8" label="ON" groupLabel="—" /></DocLink>
            <DocLink sectionId="pad-9-arp-type"><StepPad number="9" label="TYPE" groupLabel="ARPEGGIO" /></DocLink>
            <DocLink sectionId="pad-10-arp-rate"><StepPad number="10" label="RATE" groupLabel="—" /></DocLink>
            <DocLink sectionId="pad-11-clear-note"><StepPad number="11" label="NOTE" groupLabel="CLEAR" isGlowing /></DocLink>
            <DocLink sectionId="pad-12-clear-motion"><StepPad number="12" label="MOTION" groupLabel="—" /></DocLink>
            <DocLink sectionId="pad-13-delay"><StepPad number="13" label="DELAY" /></DocLink>
            <DocLink sectionId="pad-14-reverb"><StepPad number="14" label="REVERB" /></DocLink>
            <DocLink sectionId="pad-15-menu"><StepPad number="15" label="MENU" isGlowing /></DocLink>
            <DocLink sectionId="pad-16-write"><StepPad number="16" label="WRITE" isGlowing /></DocLink>
         </div>

         {/* Decorative Silkscreen Grouping Lines under pads */}
         <div className="absolute bottom-[14px] left-[320px] w-12 h-[1px] bg-gray-500"></div>
         <div className="absolute bottom-[14px] left-[550px] w-12 h-[1px] bg-gray-500"></div>
         <div className="absolute bottom-[14px] left-[665px] w-12 h-[1px] bg-gray-500"></div>
      </div>

    </div>
  );

  return (
    <div className="flex h-full w-full bg-background overflow-hidden font-sans select-none relative">
      <SidebarContextPortal>
        <S1SidebarContext />
      </SidebarContextPortal>

      {/* Center Panel */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center relative overflow-hidden bg-background">
        <OscilloscopeDrawer />
        <DeviceHelpToggle guideUrl={s1GuideUrl} />
        <ScaleFit baseWidth={1000} baseHeight={500} maxScale={3}>
          {deviceContent}
        </ScaleFit>
      </div>
    </div>
  );
}
