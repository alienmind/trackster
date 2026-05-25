import type { PadSlot, SampleFile, PageIndex } from '../types';
import { PAGES } from './constants';

export interface ArrangementResult {
  slots: PadSlot[];
  unassignedFiles: SampleFile[];
}

/**
 * Arrange ALL available samples (from both slots and unassigned list) into the
 * 64 pad grid, grouped by tag into their target pages.
 *
 * - Collects every sample from both sources into a single pool.
 * - Buckets them by tag → page.
 * - Fills each page's 16-slot range, with overflow going to leftover.
 * - Leftover samples fill any remaining empty slots.
 * - If there are more than 64 samples, extras stay in unassignedFiles.
 */
export function computeArrangement(
  currentSlots: PadSlot[],
  unassignedFiles: SampleFile[] = [],
): ArrangementResult {
  // Collect ALL samples from both grid and unassigned pool
  const allSamples: SampleFile[] = [];
  for (const slot of currentSlots) {
    if (slot.sample) {
      allSamples.push(slot.sample);
    }
  }
  allSamples.push(...unassignedFiles);

  // Sort samples alphabetically by display name for stable ordering
  allSamples.sort((a, b) => a.displayName.localeCompare(b.displayName));

  // Create buckets for each page based on tag
  const pageBuckets: Record<PageIndex, SampleFile[]> = { 0: [], 1: [], 2: [], 3: [] };
  const leftovers: SampleFile[] = [];

  for (const sample of allSamples) {
    const targetPage = PAGES.find(p => p.tags.includes(sample.tag));
    if (targetPage) {
      pageBuckets[targetPage.index].push(sample);
    } else {
      leftovers.push(sample);
    }
  }

  // Build the new 64-slot grid
  const newSlots: PadSlot[] = Array.from({ length: 64 }, (_, i) => ({ index: i, sample: null }));
  const overflow: SampleFile[] = [];

  // Fill each page's slot range
  for (const page of PAGES) {
    const bucket = pageBuckets[page.index];
    const [start, end] = page.slotRange;
    const capacity = end - start;

    const fits = bucket.slice(0, capacity);
    const extras = bucket.slice(capacity);

    fits.forEach((sample, i) => {
      newSlots[start + i]!.sample = sample;
    });

    overflow.push(...extras);
  }

  // Fill remaining empty slots with leftovers + overflow
  const remaining = [...leftovers, ...overflow];
  const stillUnassigned: SampleFile[] = [];

  for (const sample of remaining) {
    const emptySlot = newSlots.find(s => s.sample === null);
    if (emptySlot) {
      emptySlot.sample = sample;
    } else {
      stillUnassigned.push(sample);
    }
  }

  return { slots: newSlots, unassignedFiles: stillUnassigned };
}
