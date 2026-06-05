export const CABLE_OPTIONS = [
  { value: 'default', label: 'Default Cable' },
  { value: 'audio_ts', label: 'Audio TS (Mono)' },
  { value: 'audio_trs', label: 'Audio TRS (Stereo)' },
  { value: 'audio_jack_to_minijack', label: 'Jack to Minijack' },
  { value: 'audio_minijack_to_dual_trs', label: 'Minijack to Dual TRS' },
  { value: 'audio_trs_to_xlr', label: 'TRS to XLR' },
  { value: 'audio_xlr_to_xlr', label: 'XLR to XLR' },
  { value: 'midi_din', label: 'MIDI DIN 5-Pin' },
  { value: 'midi_din_to_trs', label: 'MIDI DIN to TRS' },
  { value: 'midi_usb', label: 'MIDI USB' },
  { value: 'midi_usb_c', label: 'MIDI USB-C' },
  { value: 'power_cable', label: 'Power Cable' },
];

export const CABLE_COLORS: Record<string, string> = {
  audio_ts: "#f97316",
  audio_trs: "#06b6d4",
  audio_jack_to_minijack: "#a855f7",
  audio_minijack_to_dual_trs: "#f472b6",
  audio_trs_to_xlr: "#2dd4bf",
  audio_xlr_to_xlr: "#fb7185",
  midi_din_to_trs: "#34d399",
  midi_din: "#10b981",
  midi_usb_c: "#60a5fa",
  midi_usb: "#3b82f6",
  power_cable: "#4ade80",
};

export const DEFAULT_CABLE_COLOR = "#666666";
