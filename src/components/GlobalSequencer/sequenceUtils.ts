import { SequencerState } from '../../stores/useSequencerStore';
import { ROOT_PAD_NAMES, getAllowedPads } from '../devices/Circuit/Scales/scalesData';
import { useCircuitTracksStore } from '../../stores/useCircuitTracksStore';

/**
 * Derives the exact note name (e.g. "C", "D#") to be played for a given step index.
 * It uses the active scale, sequence mode, and arp mode.
 * 
 * @param stepIndex The current step index in the sequence
 * @param sequencerStore Current sequencer state
 * @returns The note name without octave (e.g. "C") or null if unable to resolve
 */
export function getSequenceNoteForStep(stepIndex: number, sequencerStore: SequencerState): string | null {
  const circuitStore = useCircuitTracksStore.getState();
  const rootPad = circuitStore.activeRootNote;
  const scalePad = circuitStore.activeScaleType;
  
  // 1. Get allowed pads in the scale
  const allowedPads = getAllowedPads(rootPad, scalePad);
  if (allowedPads.length === 0) return "C"; // Fallback
  
  // 2. Map to note names
  const scaleNotes = allowedPads.map(pad => ROOT_PAD_NAMES[pad] || "C");
  
  // 3. Filter by sequenceMode
  let filteredNotes = [...scaleNotes];
  switch (sequencerStore.sequenceMode) {
    case '1-3-5':
      filteredNotes = [scaleNotes[0], scaleNotes[2], scaleNotes[4]].filter(Boolean) as string[];
      break;
    case '1-3-5-7-9':
      filteredNotes = [
        scaleNotes[0], scaleNotes[2], scaleNotes[4], 
        scaleNotes[6], scaleNotes[1] // 9th is 2nd degree
      ].filter(Boolean) as string[];
      break;
    case '1-3-5-7-9-11':
      filteredNotes = [
        scaleNotes[0], scaleNotes[2], scaleNotes[4], 
        scaleNotes[6], scaleNotes[1], scaleNotes[3] // 11th is 4th degree
      ].filter(Boolean) as string[];
      break;
    case 'full':
    default:
      filteredNotes = scaleNotes;
      break;
  }
  
  if (filteredNotes.length === 0) return "C";
  
  // 4. Select based on arpMode
  const N = filteredNotes.length;
  let noteIndex = 0;
  
  switch (sequencerStore.arpMode) {
    case 'up':
      noteIndex = stepIndex % N;
      break;
    case 'up-down': {
      // e.g. for N=3 (0, 1, 2): pattern is 0, 1, 2, 1
      // sequence length is 2N - 2 (for N >= 2)
      if (N < 2) {
        noteIndex = 0;
      } else {
        const seqLength = 2 * N - 2;
        const pos = stepIndex % seqLength;
        noteIndex = pos < N ? pos : seqLength - pos;
      }
      break;
    }
    case 'random': {
      // Deterministic pseudo-random based on stepIndex to keep the pattern consistent
      // during a single playback loop, or totally random? 
      // Arpeggiators usually play random notes on the fly.
      // We'll use a simple deterministic hash so it sounds like a repeatable pattern
      // based on the step index.
      const hash = Math.sin(stepIndex * 12.9898) * 43758.5453;
      noteIndex = Math.floor(Math.abs(hash) * N) % N;
      break;
    }
    default:
      noteIndex = stepIndex % N;
      break;
  }
  
  return filteredNotes[noteIndex] || "C";
}
