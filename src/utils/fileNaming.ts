/**
 * Parse the numeric prefix from a Circuit Tracks filename.
 * Returns null if the filename doesn't match the expected pattern.
 *
 * "03_TR808_Kick.wav" → { prefix: 3, name: "TR808_Kick", extension: "wav" }
 */
export function parseFilename(filename: string): { prefix: number; name: string; extension: string } | null {
  const match = filename.match(/^(\d{2})_(.+?)(?:\.([^.]+))?$/i);
  if (!match) return null;
  const prefix = parseInt(match[1] as string, 10);
  if (isNaN(prefix) || prefix < 0 || prefix > 63) return null;
  
  return {
    prefix,
    name: match[2] as string,
    extension: match[3] || '',
  };
}

/**
 * Generate a Circuit Tracks filename from components.
 *
 * (3, "TR808_Kick", "wav") → "03_TR808_Kick.wav"
 */
export function buildFilename(slotIndex: number, name: string, extension: string = 'wav'): string {
  const prefixStr = slotIndex.toString().padStart(2, '0');
  return `${prefixStr}_${name}.${extension}`;
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
