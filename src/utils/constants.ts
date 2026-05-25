import type { PageIndex, TagDefinition, SampleTag } from '../types';

export interface PageConfig {
  index: PageIndex;
  label: string;
  slotRange: [number, number]; // inclusive start, exclusive end
  color: string;
  tags: SampleTag[];           // Tags assigned to this page for auto-arrange
}

export const PAGES: readonly PageConfig[] = [
  { index: 0, label: 'Drum 1', slotRange: [0, 16],  color: '#ef4444', tags: ['kick'] },
  { index: 1, label: 'Drum 2', slotRange: [16, 32], color: '#eab308', tags: ['snare'] },
  { index: 2, label: 'Drum 3', slotRange: [32, 48], color: '#3b82f6', tags: ['hihat', 'cymbal'] },
  { index: 3, label: 'Drum 4', slotRange: [48, 64], color: '#ffffff', tags: ['tom', 'perc', 'fx', 'unknown'] },
] as const;

export const TOTAL_SLOTS = 64;
export const PADS_PER_PAGE = 16;
export const GRID_COLS = 8;
export const GRID_ROWS = 2;

export const TAG_DEFINITIONS: readonly TagDefinition[] = [
  { id: 'kick',   label: 'BD', icon: 'Circle', color: '#ef4444', patterns: [/kick/i, /\bbd\b/i, /bassdrum/i, /808/i, /\bsub\b/i] },
  { id: 'snare',  label: 'SD', icon: 'Disc', color: '#eab308', patterns: [/snare/i, /\bsd\b/i, /clap/i, /rim/i, /\bclp\b/i, /snap/i] },
  { id: 'hihat',  label: 'HH', icon: 'Triangle', color: '#3b82f6', patterns: [/hat/i, /\bhh\b/i, /\boh\b/i, /\bch\b/i, /hihat/i, /open.?hat/i, /closed.?hat/i] },
  { id: 'cymbal', label: 'CY', icon: 'Hexagon', color: '#a855f7', patterns: [/crash/i, /\bcym/i, /ride/i, /\bbell\b/i, /splash/i] },
  { id: 'tom',    label: 'TM', icon: 'Drum', color: '#f97316', patterns: [/\btom\b/i, /conga/i, /bongo/i] },
  { id: 'perc',   label: 'PC', icon: 'Music', color: '#78716c', patterns: [/perc/i, /shaker/i, /tamb/i, /wood/i, /cowbell/i, /click/i, /clave/i] },
  { id: 'fx',     label: 'FX', icon: 'Zap', color: '#e5e7eb', patterns: [/\bfx\b/i, /synth/i, /stab/i, /chord/i, /impact/i, /\bmel\b/i, /noise/i, /riser/i, /sweep/i, /drop/i, /vocal/i, /vox/i, /\bhit\b/i] },
  { id: 'unknown',label: '??', icon: 'HelpCircle', color: '#6b7280', patterns: [] },
];

export const SIMILARITY_THRESHOLD = 0.92;
