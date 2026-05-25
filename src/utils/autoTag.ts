import { TAG_DEFINITIONS } from './constants';
import type { SampleTag } from '../types';

/**
 * Infer a tag from a sample's display name using the tag dictionary.
 * First match wins (ordered by dictionary priority).
 *
 * "TR808_Kick" → "kick"
 * "ambient_pad" → "unknown"
 */
export function inferTag(displayName: string): SampleTag {
  const normalized = displayName.toLowerCase();
  for (const def of TAG_DEFINITIONS) {
    if (def.patterns.some((p) => p.test(normalized))) {
      return def.id;
    }
  }
  return 'unknown';
}
