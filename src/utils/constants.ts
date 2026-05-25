import type { PageIndex, TagDefinition, SampleTag } from '../types';

export interface PageConfig {
  index: PageIndex;
  label: string;
  slotRange: [number, number]; // inclusive start, exclusive end
  color: string;
  tags: SampleTag[];           // Tags assigned to this page for auto-arrange
}

export const PAGES: readonly PageConfig[] = [
  { index: 0, label: 'Page 1', slotRange: [0, 16],  color: '#ff8c00', tags: ['kick'] },
  { index: 1, label: 'Page 2', slotRange: [16, 32], color: '#ffd700', tags: ['snare'] },
  { index: 2, label: 'Page 3', slotRange: [32, 48], color: '#9370db', tags: ['hihat', 'cymbal'] },
  { index: 3, label: 'Page 4', slotRange: [48, 64], color: '#00e5ff', tags: ['tom', 'perc', 'fx', 'unknown'] },
] as const;

export const TOTAL_SLOTS = 64;
export const PADS_PER_PAGE = 16;
export const GRID_COLS = 8;
export const GRID_ROWS = 2;

export const TAG_DEFINITIONS: readonly TagDefinition[] = [
  { tag: 'kick',   label: 'BD', emoji: '🔴', patterns: [/kick/i, /\bbd\b/i, /bassdrum/i, /808/i, /\bsub\b/i] },
  { tag: 'snare',  label: 'SD', emoji: '🟡', patterns: [/snare/i, /\bsd\b/i, /clap/i, /rim/i, /\bclp\b/i, /snap/i] },
  { tag: 'hihat',  label: 'HH', emoji: '🔵', patterns: [/hat/i, /\bhh\b/i, /\boh\b/i, /\bch\b/i, /hihat/i, /open.?hat/i, /closed.?hat/i] },
  { tag: 'cymbal', label: 'CY', emoji: '🟣', patterns: [/crash/i, /\bcym/i, /ride/i, /\bbell\b/i, /splash/i] },
  { tag: 'tom',    label: 'TM', emoji: '🟠', patterns: [/\btom\b/i, /conga/i, /bongo/i] },
  { tag: 'perc',   label: 'PC', emoji: '🟤', patterns: [/perc/i, /shaker/i, /tamb/i, /wood/i, /cowbell/i, /click/i, /clave/i] },
  { tag: 'fx',     label: 'FX', emoji: '⚪', patterns: [/\bfx\b/i, /synth/i, /stab/i, /chord/i, /impact/i, /\bmel\b/i, /noise/i, /riser/i, /sweep/i, /drop/i, /vocal/i, /vox/i, /\bhit\b/i] },
];

export const SIMILARITY_THRESHOLD = 0.92;

export const TAG_COLORS: Record<SampleTag, string> = {
  kick:    '#ef4444',
  snare:   '#eab308',
  hihat:   '#3b82f6',
  cymbal:  '#a855f7',
  tom:     '#f97316',
  perc:    '#78716c',
  fx:      '#e5e7eb',
  unknown: '#6b7280',
};
