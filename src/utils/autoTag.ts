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
  for (const def of TAG_DEFINITIONS) {
    for (const pattern of def.patterns) {
      if (pattern.test(displayName)) {
        return def.tag;
      }
    }
  }
  return 'unknown';
}
