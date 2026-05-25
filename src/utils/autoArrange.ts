import type { PadSlot, PageIndex } from '../types';
import { PAGES } from './constants';

export function computeArrangement(currentSlots: PadSlot[]): PadSlot[] {
  // Collect all occupied slots
  const samples = currentSlots.map(s => s.sample).filter((s): s is NonNullable<typeof s> => s !== null);
  
  // Sort samples alphabetically by display name
  samples.sort((a, b) => a.displayName.localeCompare(b.displayName));
  
  // Create buckets for each page
  const pageBuckets: Record<PageIndex, typeof samples> = { 0: [], 1: [], 2: [], 3: [] };
  const leftovers: typeof samples = [];
  
  // Assign to preferred page bucket based on tags
  for (const sample of samples) {
    const targetPage = PAGES.find(p => p.tags.includes(sample.tag));
    if (targetPage) {
      pageBuckets[targetPage.index].push(sample);
    } else {
      leftovers.push(sample);
    }
  }
  
  const newSlots: PadSlot[] = Array.from({ length: 64 }, (_, i) => ({ index: i, sample: null }));
  const overflow: typeof samples = [];
  
  // Fill each page
  for (const page of PAGES) {
    const bucket = pageBuckets[page.index];
    const [start, end] = page.slotRange;
    const capacity = end - start;
    
    // Take what fits
    const fits = bucket.slice(0, capacity);
    const extras = bucket.slice(capacity);
    
    // Assign fits to slots
    fits.forEach((sample, i) => {
      newSlots[start + i]!.sample = sample;
    });
    
    overflow.push(...extras);
  }
  
  const allRemaining = [...leftovers, ...overflow];
  for (const sample of allRemaining) {
    const emptySlot = newSlots.find(s => s.sample === null);
    if (emptySlot) {
      emptySlot.sample = sample;
    } else {
      break;
    }
  }
  
  return newSlots;
}
