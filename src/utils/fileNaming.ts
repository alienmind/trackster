import { TAG_DEFINITIONS } from './constants';

/**
 * Parse the numeric prefix from a Circuit Tracks filename.
 * Returns null if the filename doesn't match the expected pattern.
 *
 * "03_TR808_Kick.wav" → { prefix: 3, name: "TR808_Kick", extension: "wav", hasOriginalTagPrefix: false }
 */
export function parseFilename(filename: string, isDirectory: boolean = false): { prefix: number; name: string; extension: string; hasOriginalTagPrefix: boolean } | null {
  const match = isDirectory 
    ? filename.match(/^(\d{2})_(.+)$/i)
    : filename.match(/^(\d{2})_(.+?)(?:\.([^.]+))?$/i);
  if (!match) return null;
  const prefix = parseInt(match[1] as string, 10);
  if (isNaN(prefix) || prefix < 0 || prefix > 63) return null;
  let name = match[2] as string;
  let hasOriginalTagPrefix = false;
  
  for (const tag of TAG_DEFINITIONS) {
    if (tag.label && tag.label !== '??') {
      if (name.toUpperCase().startsWith(tag.label.toUpperCase() + '_')) {
        name = name.substring(tag.label.length + 1);
        hasOriginalTagPrefix = true;
        break;
      }
    }
  }
  
  return {
    prefix,
    name,
    extension: match[3] || '',
    hasOriginalTagPrefix
  };
}

/**
 * Generate a Circuit Tracks filename from components.
 *
 * (3, "TR808_Kick", "wav") → "03_TR808_Kick.wav"
 */
export function buildFilename(slotIndex: number, name: string, tagId?: string, extension: string = 'wav'): string {
  const prefixStr = slotIndex.toString().padStart(2, '0');
  let tagPrefix = '';
  if (tagId && tagId !== 'unknown') {
    const tag = TAG_DEFINITIONS.find(t => t.id === tagId);
    if (tag) {
      tagPrefix = tag.label + '_';
    }
  }
  return `${prefixStr}_${tagPrefix}${name}.${extension}`;
}

/**
 * Strip the numeric prefix and extension for display purposes.
 *
 * "03_TR808_Kick.wav" → "TR808_Kick"
 */
export function getDisplayName(filename: string): string {
  const parsed = parseFilename(filename);
  if (parsed) {
    return parsed.name;
  }
  // Fallback if it doesn't match perfectly
  return filename.replace(/\.[^/.]+$/, "");
}
