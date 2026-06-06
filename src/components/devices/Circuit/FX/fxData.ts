export interface FXPreset {
  id: number;
  title: string;
  desc: string;
  type: 'delay' | 'reverb';
  // Delay specific
  speed?: number;
  pingPong?: boolean;
  width?: number;
  swing?: number;
  // Reverb specific
  decayRate?: number;
  color?: string;
}

export const FX_PRESETS: FXPreset[] = [
  // Delays (Rows 1 & 2)
  { id: 0, title: "Slap Fast", speed: 0.1, pingPong: false, width: 0, swing: 0, desc: "Static, very fast room reflection", type: "delay" },
  { id: 1, title: "Slap Slow", speed: 0.2, pingPong: false, width: 0, swing: 0, desc: "Static, noticeable doubling", type: "delay" },
  { id: 2, title: "32nd Trip", speed: 0.083, pingPong: false, width: 0, swing: 0, desc: "Ultra-fast metallic ring", type: "delay" },
  { id: 3, title: "32nd Note", speed: 0.125, pingPong: false, width: 0, swing: 0, desc: "Fast machine-gun stutter", type: "delay" },
  { id: 4, title: "16th Trip", speed: 0.166, pingPong: false, width: 0, swing: 0, desc: "Fast rolling triplets", type: "delay" },
  { id: 5, title: "16th Note", speed: 0.25, pingPong: false, width: 0, swing: 0, desc: "Standard straight 16th delay", type: "delay" },
  { id: 6, title: "16th Pong", speed: 0.25, pingPong: true, width: 0.8, swing: 0, desc: "16th bouncing Left/Right", type: "delay" },
  { id: 7, title: "16th P Swg", speed: 0.25, pingPong: true, width: 0.8, swing: 0.4, desc: "16th bounce with shuffled groove", type: "delay" },
  { id: 8, title: "8th Trip", speed: 0.333, pingPong: false, width: 0, swing: 0, desc: "Mid-tempo triplet roll", type: "delay" },
  { id: 9, title: "Dot 8th P", speed: 0.375, pingPong: true, width: 0.9, swing: 0, desc: "Classic syncopated bounce (Psytrance/U2)", type: "delay" },
  { id: 10, title: "8th Note", speed: 0.5, pingPong: false, width: 0, swing: 0, desc: "Standard straight 8th delay", type: "delay" },
  { id: 11, title: "8th Pong", speed: 0.5, pingPong: true, width: 0.9, swing: 0, desc: "8th bouncing Left/Right", type: "delay" },
  { id: 12, title: "8th P Swg", speed: 0.5, pingPong: true, width: 0.9, swing: 0.4, desc: "8th bounce with heavy shuffle", type: "delay" },
  { id: 13, title: "4th Trip", speed: 0.666, pingPong: false, width: 0, swing: 0, desc: "Slow, dragging triplets", type: "delay" },
  { id: 14, title: "Dot 4th P", speed: 0.75, pingPong: true, width: 1.0, swing: 0.3, desc: "Long, complex syncopated bounce", type: "delay" },
  { id: 15, title: "4th P Wide", speed: 0.666, pingPong: true, width: 1.0, swing: 0, desc: "Slow triplets, extremely wide stereo", type: "delay" },
  
  // Reverbs (Row 3)
  { id: 16, title: "Tight Room", decayRate: 12, width: 0.2, color: "#3b82f6", desc: "Tiny, dampened acoustic space", type: "reverb" },
  { id: 17, title: "Small Room", decayRate: 8, width: 0.4, color: "#60a5fa", desc: "Standard studio vocal booth", type: "reverb" },
  { id: 18, title: "Med Room", decayRate: 5, width: 0.5, color: "#818cf8", desc: "Larger live room reflection", type: "reverb" },
  { id: 19, title: "Med Plate", decayRate: 3.5, width: 0.6, color: "#a78bfa", desc: "Dense, bright metallic plate", type: "reverb" },
  { id: 20, title: "Med Hall", decayRate: 2.2, width: 0.7, color: "#c084fc", desc: "Classic concert hall", type: "reverb" },
  { id: 21, title: "Large Hall", decayRate: 1.4, width: 0.85, color: "#e879f9", desc: "Massive, majestic venue", type: "reverb" },
  { id: 22, title: "Lrg Cavern", decayRate: 0.7, width: 1.0, color: "#f472b6", desc: "Deep, dark, booming cavern", type: "reverb" },
  { id: 23, title: "Amb Wash", decayRate: 0.3, width: 1.0, color: "#fb7185", desc: "Near-infinite ethereal drone", type: "reverb" }
];
