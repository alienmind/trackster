import { useEffect, useState } from 'react';
import { useCircuitTracksStore } from '../../../../stores/useCircuitTracksStore';
import { FX_PRESETS, FXPreset } from './fxData';

const DelayVisualizer = ({ delay }: { delay: FXPreset }) => {
  const taps = [];
  const maxBeats = 3.0; // Render up to 3 beats of time
  let t = delay.speed || 0.25;
  let i = 0;

  // Generate the tap data mathematically
  while (t <= maxBeats && i < 24) { // Cap at 24 taps for performance
    let currentT = t;
    
    // Apply Swing to odd 16th-note boundaries (roughly)
    if ((delay.swing || 0) > 0 && i % 2 === 1) {
      currentT += (delay.speed || 0.25) * (delay.swing || 0);
    }

    // Apply Panning
    let pan = 0;
    if (delay.pingPong) {
      // Alternate left and right
      pan = (i % 2 === 0) ? -(delay.width || 0) : (delay.width || 0);
    }

    // Calculate Echo fading over time (Feedback decay)
    const intensity = Math.max(0.1, 1 - (currentT / maxBeats));

    taps.push({ t: currentT, pan, intensity });
    t += (delay.speed || 0.25);
    i++;
  }

  return (
    <div className="relative w-full aspect-[5/2] bg-[#1a1a1a] rounded-xl overflow-hidden border border-neutral-800 shadow-inner font-mono">
      {/* Background Labels */}
      <div className="absolute top-4 left-4 text-neutral-500 text-xs">LEFT</div>
      <div className="absolute top-4 right-4 text-neutral-500 text-xs">RIGHT</div>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-neutral-600 text-[10px]">TIME (Origin = Bottom Center)</div>
      
      <svg viewBox="0 0 400 200" className="w-full h-full">
        {/* Draw subtle background time grid (Quarter notes) */}
        {[0.5, 1.0, 1.5, 2.0, 2.5, 3.0].map((beat, idx) => {
          const r = (beat / maxBeats) * 180;
          return (
            <path 
              key={`grid-${idx}`}
              d={`M ${200 - r} 200 A ${r} ${r} 0 0 1 ${200 + r} 200`} 
              fill="none" 
              stroke="#333" 
              strokeWidth="1" 
              strokeDasharray="4 4"
            />
          );
        })}

        {/* Draw the Delay Taps */}
        {taps.map((tap, idx) => {
          const r = (tap.t / maxBeats) * 180;
          
          // Determine arc path based on stereo panning (Left, Right, or Center)
          let arcPath = "";
          if (tap.pan < 0) {
            // Left side only (Quadrant 2)
            arcPath = `M ${200 - r} 200 A ${r} ${r} 0 0 1 200 ${200 - r}`;
          } else if (tap.pan > 0) {
            // Right side only (Quadrant 1)
            arcPath = `M 200 ${200 - r} A ${r} ${r} 0 0 1 ${200 + r} 200`;
          } else {
            // Full arc (Center/Mono)
            arcPath = `M ${200 - r} 200 A ${r} ${r} 0 0 1 ${200 + r} 200`;
          }

          return (
            <g key={`tap-${idx}`}>
              {/* The echo arc */}
              <path 
                d={arcPath} 
                fill="none" 
                stroke="#eab308" 
                strokeWidth="2"
                opacity={tap.intensity * 0.7}
                className="transition-all duration-300"
              />
              {/* The tap location dot (Fixed at top center like Ableton Echo) */}
              <circle 
                cx={200} 
                cy={200 - r} 
                r={3.5} 
                fill="#ffffff" 
                opacity={tap.intensity + 0.4}
                className="transition-all duration-300"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const ReverbVisualizer = ({ reverb }: { reverb: FXPreset }) => {
  // Generate the complex SVG path for the reverb waveform
  const pointsTop: string[] = [];
  const pointsBottom: string[] = [];
  const color = reverb.color || "#818cf8";
  
  // Render over 400px (representing time)
  for (let x = 0; x <= 400; x += 2) {
    const t = x / 100; // time in abstract seconds
    
    // Core exponential decay curve
    const decayRate = reverb.decayRate || 5;
    const envelope = Math.exp(-decayRate * t);
    
    // Simulate high-density reverb tail scattering (noise/diffusion)
    // Increases perceived randomness based on stereo width and decay length
    const width = reverb.width || 0.5;
    const diffusion = (Math.sin(x * 1.3) * Math.sin(x * 4.7) * Math.sin(x * 11.2));
    const noiseAmplitude = diffusion * 15 * width;
    
    // Calculate final Y positions diverging from the center line (100)
    const baseAmplitude = 80 * envelope;
    const yOffset = baseAmplitude + (envelope * noiseAmplitude);
    
    pointsTop.push(`${x},${100 - yOffset}`);
    // Bottom path is built left-to-right, we'll reverse it to close the polygon
    pointsBottom.push(`${x},${100 + yOffset}`);
  }

  // Create the final SVG polygon string
  const pathData = `M 0,100 L ${pointsTop.join(' L ')} L ${pointsBottom.reverse().join(' L ')} Z`;

  return (
    <div className="relative w-full aspect-[5/2] bg-[#1a1a1a] rounded-xl overflow-hidden border border-neutral-800 shadow-inner font-mono">
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-neutral-600 text-[10px]">AMPLITUDE</div>
      <div className="absolute bottom-4 right-4 text-neutral-500 text-xs">TIME ➞</div>
      <div className="absolute top-4 right-4 text-[10px] bg-black/50 px-2 py-1 rounded text-neutral-400">
        Width: {Math.round((reverb.width || 0) * 100)}%
      </div>
      
      <svg viewBox="0 0 400 200" className="w-full h-full drop-shadow-2xl">
        {/* Center baseline */}
        <line x1="0" y1="100" x2="400" y2="100" stroke="#333" strokeWidth="1" strokeDasharray="2 2" />
        
        {/* Reverb Envelope */}
        <path 
          d={pathData} 
          fill={color} 
          opacity="0.4"
          className="transition-all duration-500 ease-out"
        />
        <path 
          d={pathData} 
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          opacity="0.9"
          className="transition-all duration-500 ease-out"
        />
      </svg>
    </div>
  );
};

export default function FXDrawer() {
  const { deviceMode, activeDelayId, activeReverbId } = useCircuitTracksStore();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (deviceMode === 'fx') {
      timer = setTimeout(() => {
        setIsOpen(true);
      }, 150);
    } else {
      setIsOpen(false);
    }
    return () => clearTimeout(timer);
  }, [deviceMode]);

  const activeDelay = FX_PRESETS.find(p => p.id === activeDelayId) || FX_PRESETS[5]!;
  const activeReverb = FX_PRESETS.find(p => p.id === activeReverbId) || FX_PRESETS[20]!;

  return (
    <div
      className="absolute top-0 left-0 right-0 z-20 flex flex-col items-center justify-end bg-neutral-900 border-b border-neutral-700 shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] rounded-t-2xl px-8 pb-6 pt-4"
      style={{
        height: '264px',
        transform: isOpen ? 'translateY(0)' : 'translateY(-100%)',
        pointerEvents: isOpen ? 'auto' : 'none',
      }}
    >
      <div className="flex w-full h-full gap-8 mt-2 items-center justify-center">
        {/* LEFT: Delay Visualizer */}
        <div className="flex-1 flex flex-col gap-2 max-w-[400px]">
          <DelayVisualizer delay={activeDelay} />
          <div className="flex items-start justify-between px-1">
            <div>
              <h3 className="text-sm font-bold text-amber-400 leading-tight">{activeDelay.title}</h3>
              <p className="text-[10px] text-neutral-400 line-clamp-1">{activeDelay.desc}</p>
            </div>
            <div className="flex gap-1 pt-0.5">
              {activeDelay.pingPong && <span className="text-[8px] bg-amber-900/50 text-amber-300 px-1.5 py-0.5 rounded border border-amber-800">PING-PONG</span>}
              {(activeDelay.swing || 0) > 0 && <span className="text-[8px] bg-purple-900/50 text-purple-300 px-1.5 py-0.5 rounded border border-purple-800">SWUNG</span>}
            </div>
          </div>
        </div>

        {/* RIGHT: Reverb Visualizer */}
        <div className="flex-1 flex flex-col gap-2 max-w-[400px]">
          <ReverbVisualizer reverb={activeReverb} />
          <div className="flex items-start justify-between px-1">
            <div>
              <h3 className="text-sm font-bold leading-tight" style={{ color: activeReverb.color }}>{activeReverb.title}</h3>
              <p className="text-[10px] text-neutral-400 line-clamp-1">{activeReverb.desc}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
