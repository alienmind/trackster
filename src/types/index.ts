export type SampleTag =
  | 'kick'
  | 'snare'
  | 'hihat'
  | 'cymbal'
  | 'tom'
  | 'perc'
  | 'fx'
  | 'unknown';

export interface TagDefinition {
  tag: SampleTag;
  label: string;       // Short display label: "BD", "SD", "HH", etc.
  emoji: string;       // Color indicator emoji for quick scanning
  patterns: RegExp[];  // Filename match patterns (case-insensitive)
}

export interface AudioFeatureVector {
  rms: number;               // Root Mean Square (overall loudness)
  spectralCentroid: number;   // Brightness proxy
  mfcc: number[];             // 13-coefficient timbral fingerprint
  duration: number;           // In seconds
}

export interface SampleFile {
  /** Original filename on disk, e.g. "03_TR808_Kick.wav" */
  originalFilename: string;

  /** Clean display name (prefix + extension stripped), e.g. "TR808_Kick" */
  displayName: string;

  /** Original numeric prefix parsed from filename, e.g. 3 */
  originalSlotIndex: number;

  /** File handle for reading/writing via File System Access API */
  fileHandle: FileSystemFileHandle;

  /** Inferred tag from filename heuristic */
  tag: SampleTag;

  /** Audio feature vector (populated after duplicate scan) */
  features?: AudioFeatureVector;

  /** List of slot indices of similar samples */
  duplicateOf?: number[];

  /** File size in bytes */
  size: number;
}

export interface PadSlot {
  /** Slot index 0–63 */
  index: number;

  /** The sample occupying this slot, or null if empty */
  sample: SampleFile | null;
}

export interface RenameOperation {
  /** Current filename on disk */
  from: string;

  /** Desired new filename */
  to: string;

  /** The file handle to operate on */
  fileHandle: FileSystemFileHandle;
}

export interface RenamePlan {
  operations: RenameOperation[];
  createdAt: Date;
}

export type PageIndex = 0 | 1 | 2 | 3;

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  autoDismissMs?: number;
}
