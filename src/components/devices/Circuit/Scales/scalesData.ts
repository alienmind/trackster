export const DISABLED_ROOT_PADS = [0, 3, 7, 15];

// The pad indices mapping to chromatic notes starting from C
// 8: C, 1: C#, 9: D, 2: D#, 10: E, 11: F, 4: F#, 12: G, 5: G#, 13: A, 6: A#, 14: B
export const CHROMATIC_PADS = [8, 1, 9, 2, 10, 11, 4, 12, 5, 13, 6, 14];

export const ROOT_PAD_NAMES: Record<number, string> = {
  8: 'C',
  1: 'C#',
  9: 'D',
  2: 'D#',
  10: 'E',
  11: 'F',
  4: 'F#',
  12: 'G',
  5: 'G#',
  13: 'A',
  6: 'A#',
  14: 'B',
};

export type ScaleMode = {
  name: string;
  intervals: number[]; // 1-indexed relative to root
  description: string;
};

export const SCALE_MODES: Record<number, ScaleMode> = {
  16: { name: 'Natural Minor', intervals: [1, 3, 4, 6, 8, 9, 11], description: 'Sad, emotional, melancholic. The standard minor scale.' },
  17: { name: 'Major', intervals: [1, 3, 5, 6, 8, 10, 12], description: 'Happy, uplifting, bright. The foundation of Western music.' },
  18: { name: 'Dorian', intervals: [1, 3, 4, 6, 8, 10, 11], description: 'Jazzy, bluesy, slightly dark but hopeful. Popular in funk and Celtic music.' },
  19: { name: 'Phrygian', intervals: [1, 2, 4, 6, 8, 9, 11], description: 'Exotic, Spanish, dark, tension-filled. Common in flamenco and metal.' },
  20: { name: 'Mixolydian', intervals: [1, 3, 5, 6, 8, 10, 11], description: 'Bluesy, rock, dominant, upbeat but relaxed.' },
  21: { name: 'Melodic Minor', intervals: [1, 3, 4, 6, 8, 10, 12], description: 'Classical, jazzy, dramatic. Resolves strongly to the root.' },
  22: { name: 'Harmonic Minor', intervals: [1, 3, 4, 6, 8, 9, 12], description: 'Middle Eastern, neoclassical, suspenseful.' },
  23: { name: 'Bebop Dorian', intervals: [1, 3, 4, 6, 8, 10, 11, 12], description: 'Jazzy, passing tones, smooth. Excellent for fast lines.' },
  24: { name: 'Blues', intervals: [1, 4, 6, 7, 8, 11], description: 'Soulful, expressive, gritty. The cornerstone of blues and rock.' },
  25: { name: 'Minor Pentatonic', intervals: [1, 4, 6, 8, 11], description: 'Rock, blues, simple and versatile. No half-steps, very safe.' },
  26: { name: 'Hungarian Minor', intervals: [1, 3, 4, 7, 8, 9, 12], description: 'Gypsy, intense, exotic. Features two augmented seconds.' },
  27: { name: 'Ukrainian Dorian', intervals: [1, 3, 4, 7, 8, 10, 11], description: 'Folk, exotic, Klezmer-like. Like Dorian with a raised 4th.' },
  28: { name: 'Marva', intervals: [1, 2, 5, 7, 8, 10, 12], description: 'Indian classical (Marwa thaat). Tense, enigmatic, unresolved.' },
  29: { name: 'Todi', intervals: [1, 2, 4, 7, 8, 9, 12], description: 'Indian classical (Todi thaat). Dark, meditative, deeply emotional.' },
  30: { name: 'Whole Tone', intervals: [1, 3, 5, 7, 9, 11], description: 'Dreamy, floating, unresolved. Made entirely of whole steps.' },
  31: { name: 'Chromatic', intervals: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], description: 'Atonal, tense. Every single half-step in the octave.' },
};

export const getAllowedPads = (rootPad: number, scalePad: number): number[] => {
  const rootIdx = CHROMATIC_PADS.indexOf(rootPad);
  if (rootIdx === -1) return [];

  const scale = SCALE_MODES[scalePad];
  if (!scale) return [];

  return scale.intervals.map(interval => {
    // interval is 1-indexed (e.g., 1 is root). We need to map it to 0-indexed chromatic offset
    const chromaticOffset = interval - 1;
    const targetIdx = (rootIdx + chromaticOffset) % 12;
    return CHROMATIC_PADS[targetIdx]!;
  });
};
