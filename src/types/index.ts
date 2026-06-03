export type SampleTag = string;

export interface TagDefinition {
  id: string;          // Unique identifier for the tag
  label: string;       // Short display label: "BD", "SD", "HH", etc.
  icon: string;        // lucide-react icon name
  patterns: RegExp[];  // Filename match patterns (case-insensitive)
  color: string;       // Background color for the tag
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

  /** Whether the original filename had a recognized tag prefix (e.g. BD_) */
  hasOriginalTagPrefix?: boolean;

  /** Original numeric prefix parsed from filename, e.g. 3 */
  originalSlotIndex: number;

  /** File handle for reading/writing via File System Access API */
  fileHandle: FileSystemFileHandle;

  /** Directory handle of the folder containing this sample (for correct rename targeting) */
  parentDirHandle: FileSystemDirectoryHandle;

  /** Inferred tag from filename heuristic */
  tag: SampleTag;

  /** Audio feature vector (populated after duplicate scan) */
  features?: AudioFeatureVector;

  /** List of slot indices of similar samples */
  duplicateOf?: number[];

  /** File size in bytes */
  size: number;

  /** Relative path from pack root, e.g. "Samples/Kicks" */
  sourcePath?: string;
}

export interface PadSlot {
  /** Slot index 0–63 */
  index: number;

  /** The sample occupying this slot, or null if empty */
  sample: SampleFile | null;
}

export interface PackFolder {
  /** Original directory name on disk, e.g. "00_MyPack" */
  originalDirname: string;

  /** Clean display name, e.g. "MyPack" */
  displayName: string;

  /** Original numeric prefix parsed from filename, e.g. 0 */
  originalSlotIndex: number;

  /** Directory handle for reading/writing via File System Access API */
  dirHandle: FileSystemDirectoryHandle;
}

export interface PackSlot {
  /** Slot index 0–63 */
  index: number;

  /** The pack occupying this slot, or null if empty */
  pack: PackFolder | null;
}

export interface RenameOperation {
  /** 'file' for sample files, 'pack' for pack folders */
  type: 'file' | 'pack';

  /** 'move' (default), 'copy', or 'delete' */
  action?: 'move' | 'copy' | 'delete';

  /** Current filename or dirname on disk */
  from: string;

  /** Desired new filename or dirname */
  to: string;

  /** The handle to operate on */
  handle: FileSystemFileHandle | FileSystemDirectoryHandle;

  /** The directory handle where this file or directory lives */
  parentDirHandle: FileSystemDirectoryHandle;
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
