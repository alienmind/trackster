import { minifreak } from './minifreak';
import { grind } from './grind';
import { s1 } from './s1';
import { circuit } from './circuit';
import { flow8 } from './flow8';
import { ableton } from './ableton';
import { HardwareBlueprint } from '../stores/useOverviewStore';

export const HARDWARE_LIBRARY: Record<string, HardwareBlueprint> = {
  minifreak,
  grind,
  s1,
  circuit,
  flow8,
  ableton
};
