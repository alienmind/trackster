export const CABLE_OPTIONS = [
  { value: 'default', label: 'Default Cable' },
  { value: 'audio_ts', label: 'Audio TS (Mono)' },
  { value: 'audio_trs', label: 'Audio TRS (Stereo)' },
  { value: 'audio_jack_to_minijack', label: 'Jack to Minijack' },
  { value: 'audio_minijack_to_dual_trs', label: 'Minijack to Dual TRS' },
  { value: 'audio_trs_to_xlr', label: 'TRS to XLR' },
  { value: 'audio_xlr_to_xlr', label: 'XLR to XLR' },
  { value: 'audio_usb', label: 'Audio USB' },
  { value: 'audio_usb_c', label: 'Audio USB-C' },
  { value: 'midi_din', label: 'MIDI DIN 5-Pin' },
  { value: 'midi_din_to_trs', label: 'MIDI DIN to TRS' },
  { value: 'midi_usb', label: 'MIDI USB' },
  { value: 'midi_usb_c', label: 'MIDI USB-C' },
  { value: 'power_cable', label: 'Power Cable' },
];

// Cables are visually grouped into a handful of meta-categories. Each category
// has a single colour so the canvas legend stays compact and uncluttered.
// Add new categories here and CABLE_COLORS will route automatically.
export type CableCategoryId = 'audio' | 'midi' | 'usb' | 'power';

export interface CableCategory {
  id: CableCategoryId;
  label: string;
  color: string;
  // Whether to display this category in the on-canvas legend. Power cables
  // are intentionally hidden to keep the legend focused on signal paths.
  legend: boolean;
}

export const CABLE_CATEGORIES: CableCategory[] = [
  { id: 'audio', label: 'Audio',        color: '#06b6d4', legend: true  }, // cyan
  { id: 'midi',  label: 'MIDI',         color: '#10b981', legend: true  }, // emerald
  { id: 'usb',   label: 'USB (audio)',  color: '#3b82f6', legend: true  }, // blue
  { id: 'power', label: 'Power',        color: '#4ade80', legend: false }, // green
];

const CATEGORY_BY_ID: Record<CableCategoryId, CableCategory> =
  Object.fromEntries(CABLE_CATEGORIES.map(c => [c.id, c])) as Record<CableCategoryId, CableCategory>;

/**
 * Classify a raw cable type string into one of the meta-categories.
 * Order matters: tests USB before MIDI/audio so `audio_usb_c` is "usb",
 * and `midi_usb` is also "usb" (it's a USB cable regardless of the protocol).
 */
export function categoryFor(type?: string): CableCategoryId {
  if (!type) return 'audio';
  if (type.startsWith('power')) return 'power';
  if (type.includes('usb')) return 'usb';
  if (type.startsWith('midi')) return 'midi';
  return 'audio';
}

/**
 * Per-type colour map. Every supported cable type resolves to its category
 * colour, so cables painted on the canvas use the same handful of hues as
 * the legend. Kept as a Record<string,string> for backwards compatibility
 * with the existing `CABLE_COLORS[type]` consumers.
 */
export const CABLE_COLORS: Record<string, string> = Object.fromEntries(
  CABLE_OPTIONS
    .filter(o => o.value !== 'default')
    .map(o => [o.value, CATEGORY_BY_ID[categoryFor(o.value)].color])
);

export const DEFAULT_CABLE_COLOR = '#666666';
