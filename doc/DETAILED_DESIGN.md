# DETAILED_DESIGN.md - Trackster Implementation Guide

> **Audience:** This document is written for a developer or coding agent implementing Trackster from scratch. It contains every structural decision, type definition, component contract, and implementation detail needed to build the app without ambiguity.

---

## Table of Contents

1. [Project Setup](#1-project-setup)
2. [Folder Structure](#2-folder-structure)
3. [Configuration Files](#3-configuration-files)
4. [Type System](#4-type-system)
5. [State Management (Zustand Stores)](#5-state-management-zustand-stores)
6. [Component Architecture](#6-component-architecture)
7. [Custom Hooks](#7-custom-hooks)
8. [Utility Modules](#8-utility-modules)
9. [Web Worker](#9-web-worker)
10. [Styling Architecture](#10-styling-architecture)
11. [PWA Configuration](#11-pwa-configuration)
12. [Testing Strategy](#12-testing-strategy)
13. [Build & Deployment](#13-build--deployment)
14. [Implementation Order](#14-implementation-order)

---

## 1. Project Setup

### 1.1 Initialize

```bash
npm create vite@latest ./ -- --template react-ts
```

### 1.2 Install Dependencies

**Production:**
```bash
npm install zustand @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities wavesurfer.js meyda lucide-react
```

**Development:**
```bash
npm install -D tailwindcss @tailwindcss/vite prettier eslint @eslint/js typescript-eslint globals
```

### 1.3 Tailwind CSS v4 Setup

Tailwind v4 uses a CSS-first configuration model. No `tailwind.config.js` is needed.

**`vite.config.ts`** - add the Tailwind plugin:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

**`src/index.css`** - import Tailwind:
```css
@import "tailwindcss";
```

### 1.4 TypeScript Configuration

Use strict mode. Key `tsconfig.json` overrides:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "forceConsistentCasingInFileNames": true,
    "target": "ES2022",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "types": ["vite/client"]
  }
}
```

> **Note:** The File System Access API types are NOT included in the default TypeScript DOM lib. You will need to add type declarations (see §4.5).

---

## 2. Folder Structure

```
trackster/
├── public/
│   ├── favicon.svg                  # App icon (inline SVG for simplicity)
│   ├── icons/
│   │   ├── icon-192.png             # PWA icon 192�-192
│   │   └── icon-512.png             # PWA icon 512�-512
│   └── robots.txt
│
├── src/
│   ├── main.tsx                     # React entry point, renders <App />
│   ├── App.tsx                      # Root layout: Toolbar + Waveform + PageTabs + Grid + StatusBar
│   ├── index.css                    # Tailwind import + CSS custom properties + global styles
│   │
│   ├── components/
│   │   ├── Toolbar/
│   │   │   └── Toolbar.tsx          # Top action bar: directory picker, magic sort, scan, commit, undo
│   │   │
│   │   ├── Waveform/
│   │   │   └── Waveform.tsx         # wavesurfer.js wrapper, shows selected pad's audio
│   │   │
│   │   ├── PageTabs/
│   │   │   └── PageTabs.tsx         # 4 page-selection tabs with color indicators
│   │   │
│   │   ├── Grid/
│   │   │   ├── SortableGrid.tsx     # DndContext + SortableContext wrapper for 16 pads
│   │   │   └── SortablePad.tsx      # Individual draggable pad tile
│   │   │
│   │   ├── StatusBar/
│   │   │   └── StatusBar.tsx        # Bottom bar: slot count, pending changes, scan progress
│   │   │
│   │   ├── CommitDialog/
│   │   │   └── CommitDialog.tsx     # Modal showing rename plan, confirm/cancel
│   │   │
│   │   ├── BrowserWarning/
│   │   │   └── BrowserWarning.tsx   # Full-page fallback for unsupported browsers
│   │   │
│   │   └── ui/                      # Shared primitive UI components
│   │       ├── Button.tsx
│   │       ├── Badge.tsx
│   │       ├── Modal.tsx
│   │       ├── Tooltip.tsx
│   │       └── ProgressBar.tsx
│   │
│   ├── stores/
│   │   ├── useFileSystemStore.ts    # Directory handle, slots array, rename plan, commit logic
│   │   ├── useAudioStore.ts         # Playback state, decoded buffers, waveform instance ref
│   │   └── useUIStore.ts            # Active page, selected pad index, modals, notifications
│   │
│   ├── hooks/
│   │   ├── useAudioPlayback.ts      # Play/stop/toggle logic, AudioContext management
│   │   ├── useKeyboardShortcuts.ts  # Global keyboard event listeners
│   │   └── useBrowserSupport.ts     # Detect File System Access API support
│   │
│   ├── utils/
│   │   ├── constants.ts             # Page colors, tag dictionary, thresholds, magic numbers
│   │   ├── fileNaming.ts            # Parse prefix, strip prefix, generate new filename
│   │   ├── autoTag.ts               # Regex-based filename → tag mapping
│   │   ├── autoArrange.ts           # Tag-based slot assignment algorithm
│   │   ├── renamePlan.ts            # Compute diff between current and desired slot assignments
│   │   └── similarity.ts            # Cosine similarity, Euclidean distance helpers
│   │
│   ├── workers/
│   │   └── audioAnalyzer.worker.ts  # Web Worker: Meyda feature extraction for duplicate detection
│   │
│   └── types/
│       ├── index.ts                 # All shared type definitions (re-exported)
│       └── file-system-access.d.ts  # Type declarations for File System Access API
│
├── doc/
│   ├── DESIGN.md                    # High-level architecture and UX spec
│   └── DETAILED_DESIGN.md           # This file
│
├── index.html                       # Vite HTML entry
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── .prettierrc                      # Prettier config
├── eslint.config.js                 # ESLint flat config
├── .gitignore
└── README.md
```

### 2.1 Why This Structure

- **Feature folders** (`Toolbar/`, `Grid/`, `Waveform/`) group component + tests together. No deeply nested barrel files.
- **Stores are separate from components** to avoid circular imports. Components import from `stores/`, never the reverse.
- **`utils/` is pure functions only** - no React imports, no side effects. Every utility is independently testable.
- **`workers/`** isolates Web Worker code, which runs in a separate thread with its own global scope.
- **`types/`** is the single source of truth for all shared interfaces and type declarations.

---

## 3. Configuration Files

### 3.1 `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'Trackster - Circuit Tracks PCM Manager',
        short_name: 'Trackster',
        description: 'Manage, audition, and arrange samples for the Novation Circuit Tracks',
        theme_color: '#0a0a0f',
        background_color: '#0a0a0f',
        display: 'standalone',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
});
```

### 3.2 `eslint.config.js`

Use ESLint flat config with TypeScript support:
```javascript
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    languageOptions: {
      globals: { ...globals.browser },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  { ignores: ['dist/'] },
);
```

### 3.3 `.prettierrc`

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

---

## 4. Type System

### 4.1 Core Types - `src/types/index.ts`

```typescript
// ─── Tag System ────────────────────────────────────────

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

// ─── Sample & Slot ─────────────────────────────────────

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

// ─── Audio Analysis ────────────────────────────────────

export interface AudioFeatureVector {
  rms: number;               // Root Mean Square (overall loudness)
  spectralCentroid: number;   // Brightness proxy
  mfcc: number[];             // 13-coefficient timbral fingerprint
  duration: number;           // In seconds
}

// ─── Rename Plan ───────────────────────────────────────

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

// ─── UI State ──────────────────────────────────────────

export type PageIndex = 0 | 1 | 2 | 3;

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  autoDismissMs?: number;
}
```

### 4.2 Page Constants - `src/utils/constants.ts`

```typescript
import type { PageIndex, TagDefinition, SampleTag } from '../types';

// ─── Page Configuration ────────────────────────────────

export interface PageConfig {
  index: PageIndex;
  label: string;
  slotRange: [number, number]; // inclusive start, exclusive end
  color: string;
  tags: SampleTag[];           // Tags assigned to this page for auto-arrange
}

export const PAGES: readonly PageConfig[] = [
  { index: 0, label: 'Page 1', slotRange: [0, 16],  color: '#ff8c00', tags: ['kick'] },
  { index: 1, label: 'Page 2', slotRange: [16, 32], color: '#ffd700', tags: ['snare'] },
  { index: 2, label: 'Page 3', slotRange: [32, 48], color: '#9370db', tags: ['hihat', 'cymbal'] },
  { index: 3, label: 'Page 4', slotRange: [48, 64], color: '#00e5ff', tags: ['tom', 'perc', 'fx', 'unknown'] },
] as const;

export const TOTAL_SLOTS = 64;
export const PADS_PER_PAGE = 16;
export const GRID_COLS = 8;
export const GRID_ROWS = 2;

// ─── Tag Dictionary ───────────────────────────────────

export const TAG_DEFINITIONS: readonly TagDefinition[] = [
  { tag: 'kick',   label: 'BD', emoji: '🔴', patterns: [/kick/i, /\bbd\b/i, /bassdrum/i, /808/i, /\bsub\b/i] },
  { tag: 'snare',  label: 'SD', emoji: '🟡', patterns: [/snare/i, /\bsd\b/i, /clap/i, /rim/i, /\bclp\b/i, /snap/i] },
  { tag: 'hihat',  label: 'HH', emoji: '🔵', patterns: [/hat/i, /\bhh\b/i, /\boh\b/i, /\bch\b/i, /hihat/i, /open.?hat/i, /closed.?hat/i] },
  { tag: 'cymbal', label: 'CY', emoji: '🟣', patterns: [/crash/i, /\bcym/i, /ride/i, /\bbell\b/i, /splash/i] },
  { tag: 'tom',    label: 'TM', emoji: '🟠', patterns: [/\btom\b/i, /conga/i, /bongo/i] },
  { tag: 'perc',   label: 'PC', emoji: '🟤', patterns: [/perc/i, /shaker/i, /tamb/i, /wood/i, /cowbell/i, /click/i, /clave/i] },
  { tag: 'fx',     label: 'FX', emoji: '⚪', patterns: [/\bfx\b/i, /synth/i, /stab/i, /chord/i, /impact/i, /\bmel\b/i, /noise/i, /riser/i, /sweep/i, /drop/i, /vocal/i, /vox/i, /\bhit\b/i] },
];

// ─── Duplicate Detection ──────────────────────────────

export const SIMILARITY_THRESHOLD = 0.92;

// ─── Pad Colors ────────────────────────────────────────

export const TAG_COLORS: Record<SampleTag, string> = {
  kick:    '#ef4444',
  snare:   '#eab308',
  hihat:   '#3b82f6',
  cymbal:  '#a855f7',
  tom:     '#f97316',
  perc:    '#78716c',
  fx:      '#e5e7eb',
  unknown: '#6b7280',
};
```

### 4.3 Store Types

Each Zustand store's shape is defined inline within the store file (see §5). This avoids a separate interface file that drifts out of sync.

### 4.4 File System Access API ambient declarations - `src/types/file-system-access.d.ts`

The File System Access API is not fully typed in TypeScript's DOM lib. Add ambient declarations:

```typescript
interface FileSystemHandle {
  kind: 'file' | 'directory';
  name: string;
  isSameEntry(other: FileSystemHandle): Promise<boolean>;
  queryPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
  requestPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
}

interface FileSystemHandlePermissionDescriptor {
  mode?: 'read' | 'readwrite';
}

interface FileSystemFileHandle extends FileSystemHandle {
  kind: 'file';
  getFile(): Promise<File>;
  createWritable(options?: FileSystemCreateWritableOptions): Promise<FileSystemWritableFileStream>;
}

interface FileSystemCreateWritableOptions {
  keepExistingData?: boolean;
}

interface FileSystemWritableFileStream extends WritableStream {
  write(data: BufferSource | Blob | string | WriteParams): Promise<void>;
  seek(position: number): Promise<void>;
  truncate(size: number): Promise<void>;
}

interface WriteParams {
  type: 'write' | 'seek' | 'truncate';
  data?: BufferSource | Blob | string;
  position?: number;
  size?: number;
}

interface FileSystemDirectoryHandle extends FileSystemHandle {
  kind: 'directory';
  getDirectoryHandle(name: string, options?: FileSystemGetDirectoryOptions): Promise<FileSystemDirectoryHandle>;
  getFileHandle(name: string, options?: FileSystemGetFileOptions): Promise<FileSystemFileHandle>;
  removeEntry(name: string, options?: FileSystemRemoveOptions): Promise<void>;
  resolve(possibleDescendant: FileSystemHandle): Promise<string[] | null>;
  entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
  keys(): AsyncIterableIterator<string>;
  values(): AsyncIterableIterator<FileSystemHandle>;
}

interface FileSystemGetDirectoryOptions {
  create?: boolean;
}

interface FileSystemGetFileOptions {
  create?: boolean;
}

interface FileSystemRemoveOptions {
  recursive?: boolean;
}

interface Window {
  showDirectoryPicker(options?: DirectoryPickerOptions): Promise<FileSystemDirectoryHandle>;
}

interface DirectoryPickerOptions {
  id?: string;
  mode?: 'read' | 'readwrite';
  startIn?: FileSystemHandle | 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos';
}
```

> **Note:** Check if your TypeScript version already includes some of these. If so, only add the missing ones to avoid conflicts. Wrap in `declare global {}` if needed.

---

## 5. State Management (Zustand Stores)

### 5.1 `useFileSystemStore` - `src/stores/useFileSystemStore.ts`

This is the **primary store**. It owns the source of truth for all file/slot data.

```typescript
// Conceptual store shape (implement with Zustand's `create`)

interface FileSystemState {
  // ─── State ─────────────────────────────────
  directoryHandle: FileSystemDirectoryHandle | null;
  slots: PadSlot[];              // Fixed-length array of 64 slots
  pendingChanges: number;        // Count of slots whose assignment differs from disk
  history: PadSlot[][];          // Undo stack (array of previous slot snapshots)

  // ─── Actions ───────────────────────────────
  openDirectory: () => Promise<void>;
  loadFiles: () => Promise<void>;
  moveSlot: (fromIndex: number, toIndex: number) => void;
  autoTag: () => void;
  autoArrange: () => void;
  commitChanges: () => Promise<RenamePlan>;
  executeRenamePlan: (plan: RenamePlan) => Promise<void>;
  undo: () => void;
}
```

**Key implementation details:**

1. **`slots` initialization:** Create an array of 64 `PadSlot` objects with `sample: null`.
2. **`loadFiles`:** Iterate `directoryHandle.values()`, filter `.wav` files, parse the `NN_` prefix, and populate the corresponding slot.
3. **`moveSlot`:** Swap the `sample` references between two slot indices. Push current state to `history` before mutating.
4. **`autoTag`:** Iterate all occupied slots, run `autoTag()` utility on each filename, update the `tag` field.
5. **`autoArrange`:** Run the arrangement algorithm (§5.5), then batch-update slot assignments.
6. **`commitChanges`:** Compute a `RenamePlan` by comparing each slot's `sample.originalSlotIndex` to its current `index`. Return the plan without executing.
7. **`executeRenamePlan`:** Execute the rename operations via File System Access API. Use a two-pass approach:
   - **Pass 1:** Rename all affected files to temporary names (`__tmp_NN_name.wav`).
   - **Pass 2:** Rename temporary files to final names (`NN_name.wav`).
   This avoids collisions when two files swap positions.

### 5.2 `useAudioStore` - `src/stores/useAudioStore.ts`

```typescript
interface AudioState {
  // ─── State ─────────────────────────────────
  audioContext: AudioContext | null;
  currentlyPlayingSlot: number | null;
  decodedBuffers: Map<number, AudioBuffer>;  // Cache: slot index → decoded buffer
  currentSource: AudioBufferSourceNode | null;
  analysisProgress: { current: number; total: number } | null;
  duplicatePairs: [number, number][];        // Pairs of slot indices flagged as similar

  // ─── Actions ───────────────────────────────
  initAudioContext: () => void;
  playSlot: (slotIndex: number, fileHandle: FileSystemFileHandle) => Promise<void>;
  stopPlayback: () => void;
  togglePlayback: (slotIndex: number, fileHandle: FileSystemFileHandle) => Promise<void>;
  scanDuplicates: (slots: PadSlot[]) => Promise<void>;
  clearDuplicates: () => void;
}
```

**Key implementation details:**

1. **`audioContext` lazy init:** Create on first user interaction (Chrome's autoplay policy requires a user gesture).
2. **`playSlot`:** Check `decodedBuffers` cache first. If miss, read `File` from `fileHandle.getFile()`, get `ArrayBuffer`, decode via `audioContext.decodeAudioData()`, cache, then play.
3. **`stopPlayback`:** Call `currentSource.stop()`, set `currentlyPlayingSlot` to `null`.
4. **`scanDuplicates`:** Post all file data to the Web Worker. Receive results as `[slotA, slotB]` pairs.

### 5.3 `useUIStore` - `src/stores/useUIStore.ts`

```typescript
interface UIState {
  // ─── State ─────────────────────────────────
  activePage: PageIndex;
  selectedPadIndex: number | null;
  isCommitDialogOpen: boolean;
  notifications: Notification[];

  // ─── Actions ───────────────────────────────
  setActivePage: (page: PageIndex) => void;
  selectPad: (index: number | null) => void;
  openCommitDialog: () => void;
  closeCommitDialog: () => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  dismissNotification: (id: string) => void;
}
```

---

## 6. Component Architecture

### 6.1 `App.tsx` - Root Layout

```
<App>
  <BrowserWarning />           ← Conditional: only if showDirectoryPicker unsupported
  <div className="app-layout">
    <Toolbar />
    <Waveform />
    <PageTabs />
    <SortableGrid />
    <StatusBar />
    <CommitDialog />           ← Modal, conditionally rendered
  </div>
</App>
```

**Responsibilities:** Compose the layout. Initialize keyboard shortcuts hook. No business logic.

### 6.2 `Toolbar.tsx`

| Element | Action | Store interaction |
|---|---|---|
| "Select Directory" button | Calls `fileSystemStore.openDirectory()` | `useFileSystemStore` |
| "Magic Sort" button | Calls `fileSystemStore.autoTag()` then `fileSystemStore.autoArrange()` | `useFileSystemStore` |
| "Scan Duplicates" button | Calls `audioStore.scanDuplicates(slots)` | `useAudioStore` + `useFileSystemStore` |
| "Undo" button | Calls `fileSystemStore.undo()` | `useFileSystemStore` |
| "Commit" button | Opens commit dialog | `useUIStore` |

**Disabled states:**
- All buttons except "Select Directory" are disabled when no directory is loaded.
- "Undo" is disabled when history is empty.
- "Commit" is disabled when `pendingChanges === 0`.

### 6.3 `Waveform.tsx`

Wraps **wavesurfer.js v7**. Subscribes to `useUIStore.selectedPadIndex` and `useAudioStore`.

```typescript
// Pseudocode contract
interface WaveformProps {
  // No props - reads from stores directly
}
```

**Lifecycle:**
1. On mount: create wavesurfer instance, attach to a `<div ref>`.
2. When `selectedPadIndex` changes: load the selected pad's audio file into wavesurfer.
3. When playback starts/stops in `audioStore`: sync wavesurfer's play state.
4. On unmount: destroy wavesurfer instance.

**Styling:** Fixed height of 128px. Waveform color matches the active page's accent color. Progress bar shows playback position.

### 6.4 `PageTabs.tsx`

Four tab buttons. Active tab has the page's accent color as background; inactive tabs are muted.

Clicking a tab calls `uiStore.setActivePage(pageIndex)`. The accent color CSS custom property (`--accent`) is updated on the root element.

### 6.5 `SortableGrid.tsx`

The grid container. Wraps `@dnd-kit`'s `<DndContext>` and `<SortableContext>`.

```typescript
// Renders 16 SortablePad components for the active page
const activePageSlots = slots.slice(pageStart, pageEnd); // 16 items

return (
  <DndContext onDragEnd={handleDragEnd} sensors={sensors} collisionDetection={closestCenter}>
    <SortableContext items={slotIds} strategy={rectSortingStrategy}>
      <div className="grid grid-cols-8 gap-2">
        {activePageSlots.map((slot) => (
          <SortablePad key={slot.index} slot={slot} />
        ))}
      </div>
    </SortableContext>
  </DndContext>
);
```

**`handleDragEnd`:** Extract `active.id` and `over.id`, call `fileSystemStore.moveSlot(activeIndex, overIndex)`.

**Sensors:** Use `useSensor(PointerSensor, { activationConstraint: { distance: 5 } })` to distinguish clicks from drags.

### 6.6 `SortablePad.tsx`

Individual pad tile. Uses `@dnd-kit/sortable`'s `useSortable()` hook.

```typescript
interface SortablePadProps {
  slot: PadSlot;
}
```

**Rendering logic:**
- If `slot.sample === null`: render empty state (dashed border, slot number only).
- If occupied: render full pad with filename, tag badge, slot number.
- Apply page accent color to border.
- Apply drag transform via `useSortable()`'s `transform` and `transition`.
- Show duplicate warning icon if `slot.sample.duplicateOf` is populated.
- Show playing indicator if `audioStore.currentlyPlayingSlot === slot.index`.

**Click handler:** Calls `audioStore.togglePlayback(slot.index, slot.sample.fileHandle)` and `uiStore.selectPad(slot.index)`.

### 6.7 `CommitDialog.tsx`

Modal overlay. Reads the rename plan from `fileSystemStore.commitChanges()`.

Displays a scrollable table:
| From | → | To |
|---|---|---|
| `03_TR808_Kick.wav` | → | `00_TR808_Kick.wav` |

Two buttons: **Cancel** (closes dialog) and **Execute** (calls `fileSystemStore.executeRenamePlan(plan)`, shows progress, closes on completion).

### 6.8 `BrowserWarning.tsx`

Full-page overlay rendered when `!('showDirectoryPicker' in window)`. Shows:
- A clear message explaining the browser requirement.
- Links to download Chrome/Edge.
- No other UI is rendered behind it.

### 6.9 Shared UI Components (`ui/`)

| Component | Purpose |
|---|---|
| `Button.tsx` | Styled button with `variant` prop: `primary`, `secondary`, `danger`, `ghost` |
| `Badge.tsx` | Small colored pill for tag labels. Props: `label`, `color` |
| `Modal.tsx` | Overlay + centered card. Props: `isOpen`, `onClose`, `title`, `children` |
| `Tooltip.tsx` | Hover tooltip. Props: `content`, `children` |
| `ProgressBar.tsx` | Horizontal progress indicator. Props: `current`, `total`, `label` |

---

## 7. Custom Hooks

### 7.1 `useAudioPlayback.ts`

Convenience hook wrapping common audio operations. Internally reads from `useAudioStore`.

```typescript
function useAudioPlayback() {
  return {
    isPlaying: boolean;
    currentSlot: number | null;
    play: (slotIndex: number) => Promise<void>;
    stop: () => void;
    toggle: (slotIndex: number) => Promise<void>;
  };
}
```

### 7.2 `useKeyboardShortcuts.ts`

Registers global `keydown` listeners. Maps keys to store actions per the shortcut table in DESIGN.md §6.5. Uses `useEffect` with cleanup.

**Important:** Must check `document.activeElement` to avoid firing shortcuts when the user is typing in an input field.

### 7.3 `useBrowserSupport.ts`

```typescript
function useBrowserSupport() {
  return {
    hasFileSystemAccess: boolean;    // 'showDirectoryPicker' in window
    hasWebAudio: boolean;            // 'AudioContext' in window
    isSupported: boolean;            // Both true
  };
}
```

---

## 8. Utility Modules

All utilities are **pure functions** with no React or DOM dependencies (except where noted). They must be independently unit-testable.

### 8.1 `fileNaming.ts`

```typescript
/**
 * Parse the numeric prefix from a Circuit Tracks filename.
 * Returns null if the filename doesn't match the expected pattern.
 *
 * "03_TR808_Kick.wav" → { prefix: 3, name: "TR808_Kick", extension: "wav" }
 */
function parseFilename(filename: string): { prefix: number; name: string; extension: string } | null;

/**
 * Generate a Circuit Tracks filename from components.
 *
 * (3, "TR808_Kick", "wav") → "03_TR808_Kick.wav"
 */
function buildFilename(slotIndex: number, name: string, extension?: string): string;

/**
 * Strip the numeric prefix and extension for display purposes.
 *
 * "03_TR808_Kick.wav" → "TR808_Kick"
 */
function getDisplayName(filename: string): string;
```

### 8.2 `autoTag.ts`

```typescript
import type { SampleTag } from '../types';

/**
 * Infer a tag from a sample's display name using the tag dictionary.
 * First match wins (ordered by dictionary priority).
 *
 * "TR808_Kick" → "kick"
 * "ambient_pad" → "unknown"
 */
function inferTag(displayName: string): SampleTag;
```

### 8.3 `autoArrange.ts`

```typescript
import type { PadSlot, PageIndex } from '../types';

/**
 * Given the current 64 slots (with tags populated), compute a new
 * 64-slot arrangement based on the auto-arrange rules.
 *
 * Returns a new slots array (does not mutate input).
 * Handles overflow: if a page is full, extras go to Page 4.
 */
function computeArrangement(currentSlots: PadSlot[]): PadSlot[];
```

### 8.4 `renamePlan.ts`

```typescript
import type { PadSlot, RenamePlan } from '../types';

/**
 * Compare current slot assignments to on-disk filenames.
 * Returns a RenamePlan containing only the files that need renaming.
 *
 * A file needs renaming if its current slot index ≠ its original slot index.
 */
function computeRenamePlan(slots: PadSlot[]): RenamePlan;
```

### 8.5 `similarity.ts`

```typescript
import type { AudioFeatureVector } from '../types';

/**
 * Compute cosine similarity between two feature vectors.
 * Returns a value between 0 (completely different) and 1 (identical).
 */
function cosineSimilarity(a: AudioFeatureVector, b: AudioFeatureVector): number;

/**
 * Flatten an AudioFeatureVector into a numeric array for comparison.
 */
function vectorize(features: AudioFeatureVector): number[];

/**
 * Given all feature vectors, find all pairs exceeding the similarity threshold.
 * Returns array of [indexA, indexB] pairs.
 */
function findDuplicates(
  features: Map<number, AudioFeatureVector>,
  threshold: number,
): [number, number][];
```

---

## 9. Web Worker - `audioAnalyzer.worker.ts`

### 9.1 Why a Web Worker

Meyda's feature extraction involves significant DSP computation (FFT, MFCC). Running this for 64 files on the main thread would freeze the UI for several seconds. A Web Worker runs the analysis in a background thread.

### 9.2 Communication Protocol

**Main thread → Worker:**
```typescript
interface AnalyzeMessage {
  type: 'ANALYZE';
  files: Array<{
    slotIndex: number;
    arrayBuffer: ArrayBuffer;  // Raw .wav data (transferred, not copied)
    sampleRate: number;
  }>;
}
```

**Worker → Main thread:**
```typescript
interface ProgressMessage {
  type: 'PROGRESS';
  current: number;
  total: number;
}

interface ResultMessage {
  type: 'RESULT';
  features: Array<{
    slotIndex: number;
    vector: AudioFeatureVector;
  }>;
}

interface ErrorMessage {
  type: 'ERROR';
  slotIndex: number;
  error: string;
}
```

### 9.3 Worker Implementation Outline

1. Receive `ANALYZE` message with array of file buffers (transferred, zero-copy).
2. For each file:
   a. Decode the WAV header to extract PCM data and sample rate.
   b. Run Meyda extractors: `rms`, `spectralCentroid`, `mfcc`.
   c. Post `PROGRESS` message.
3. Post `RESULT` message with all feature vectors.
4. Main thread runs `findDuplicates()` on the results.

> **Note:** `OfflineAudioContext` is available in Web Workers in modern browsers. However, Meyda can work directly on Float32Array PCM data without needing AudioContext, which is simpler and more portable in workers.

---

## 10. Styling Architecture

### 10.1 Tailwind CSS v4

Tailwind v4 is CSS-native. Configuration happens in `src/index.css`:

```css
@import "tailwindcss";

/* ─── Theme Tokens (CSS Custom Properties) ──────────── */

@theme {
  --color-surface-0: #0a0a0f;
  --color-surface-1: #141420;
  --color-surface-2: #1e1e2e;
  --color-surface-3: #2a2a3a;

  --color-text-primary: #e5e7eb;
  --color-text-secondary: #9ca3af;
  --color-text-muted: #6b7280;

  --color-page-1: #ff8c00;
  --color-page-2: #ffd700;
  --color-page-3: #9370db;
  --color-page-4: #00e5ff;

  --color-danger: #ef4444;
  --color-warning: #f59e0b;
  --color-success: #22c55e;

  --font-sans: 'Inter', 'system-ui', sans-serif;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
}

/* ─── Dynamic Accent (set by JS based on active page) ── */

:root {
  --accent: var(--color-page-1);
}

/* ─── Global Base Styles ────────────────────────────── */

body {
  @apply bg-surface-0 text-text-primary font-sans antialiased;
}
```

### 10.2 Key Styling Patterns

| Pattern | Approach |
|---|---|
| **Dark theme** | Single theme via CSS custom properties. No light mode in v1. |
| **Page accent** | `--accent` custom property updated on `:root` when page changes. Components reference `var(--accent)` for borders, highlights, etc. Tailwind `arbitrary values` can reference this: `border-[var(--accent)]`. |
| **Pad grid** | `grid grid-cols-8 gap-2` with `aspect-square` on each pad for uniform sizing. |
| **Drag ghost** | `@dnd-kit` handles the drag overlay. Style with reduced opacity and scale. |
| **Animations** | Tailwind's `animate-pulse` for playing state. Custom `@keyframes` for the duplicate warning glow. Transitions on hover (`transition-all duration-150`). |
| **Responsive** | Tailwind breakpoints: `md:` for tablet, `lg:` for desktop. Mobile defaults to a narrower grid. |
| **Typography** | Load Inter from Google Fonts via `<link>` in `index.html`. |

### 10.3 Google Fonts

Add to `index.html` `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

---

## 11. PWA Configuration

Handled by `vite-plugin-pwa` in `vite.config.ts` (see §3.1). Key decisions:

- **`registerType: 'autoUpdate'`** - The service worker auto-updates without user prompt. Acceptable since the app is a tool, not a content app where stale data is a concern.
- **Cached assets:** Only the app shell (HTML, JS, CSS, icons). Audio files are local and never fetched over the network.
- **Manifest:** Includes `display: standalone`, dark theme/background colors, and appropriately sized icons.

---

## 12. Testing Strategy

### 12.1 Unit Tests (Vitest)

Test all pure utility functions:

| Module | Example tests |
|---|---|
| `fileNaming.ts` | Parse valid/invalid filenames, build with edge cases (0, 63, no name) |
| `autoTag.ts` | Each tag pattern matches, first-match priority, unknown fallback |
| `autoArrange.ts` | Basic arrangement, overflow handling, empty slots |
| `renamePlan.ts` | No changes → empty plan, swaps, one-way moves |
| `similarity.ts` | Identical vectors → 1.0, orthogonal → 0.0, threshold filtering |

### 12.2 Component Tests (Vitest + React Testing Library)

Test interactive behavior:

| Component | Key tests |
|---|---|
| `SortablePad` | Renders empty state, renders occupied state, click triggers playback |
| `Toolbar` | Buttons disabled when no directory, enabled after directory load |
| `CommitDialog` | Shows rename operations, cancel closes, execute triggers API |

### 12.3 Integration Tests

- Full flow: load directory → drag pad → commit → verify rename plan.
- Mock `FileSystemDirectoryHandle` and `FileSystemFileHandle` for tests.

### 12.4 Manual Testing Checklist

- [ ] Open a real PCM directory in Chrome
- [ ] Verify all 64 slots load correctly
- [ ] Drag and drop pads, verify visual reordering
- [ ] Click pads to audition samples
- [ ] Run Magic Sort, verify tag assignments
- [ ] Run duplicate scan, verify warnings appear
- [ ] Commit changes, verify files renamed on disk
- [ ] Undo after drag, verify state restores
- [ ] Refresh page, re-open directory, verify persisted state

---

## 13. Build & Deployment

### 13.1 Scripts (`package.json`)

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "format": "prettier --write \"src/**/*.{ts,tsx,css}\"",
    "test": "vitest",
    "test:run": "vitest run"
  }
}
```

### 13.2 GitHub Pages Deployment

The application is deployed to GitHub Pages using GitHub Actions.

A workflow file (`.github/workflows/deploy.yml`) handles the build and deployment process automatically when changes are pushed to the `main` branch. 

To enable this:
1. Go to your repository settings on GitHub.
2. Navigate to "Pages" under the "Code and automation" section.
3. Under "Build and deployment", set the Source to "GitHub Actions".

### 13.3 Static Hosting

```bash
npm run build
# Output: dist/
# Serve with any static file server
npx serve dist
```

---

## 14. Implementation Order

This is the recommended order for building the app. Each phase produces a working (if partial) application.

### Phase 1: Foundation
1. Initialize Vite project with React + TypeScript.
2. Install all dependencies.
3. Configure Tailwind v4, ESLint, Prettier.
4. Set up `index.html` (Google Fonts, meta tags, favicon).
5. Create `src/types/index.ts` and `src/types/file-system-access.d.ts`.
6. Create `src/utils/constants.ts`.
7. Create all three Zustand stores (empty implementations with correct shapes).
8. Create `BrowserWarning.tsx`.
9. Create `App.tsx` skeleton layout.

**Checkpoint:** App runs, shows dark background and browser warning on Firefox.

### Phase 2: File System
1. Implement `useFileSystemStore.openDirectory()` and `loadFiles()`.
2. Implement `src/utils/fileNaming.ts`.
3. Create `Toolbar.tsx` with "Select Directory" button.
4. Create `StatusBar.tsx` showing slot count.
5. Create `SortablePad.tsx` (visual only, no drag yet).
6. Create `PageTabs.tsx` (page switching).
7. Create `SortableGrid.tsx` (static grid, no drag yet).

**Checkpoint:** App loads a real PCM directory, displays files in the grid across 4 pages.

### Phase 3: Audio Playback
1. Implement `useAudioStore.playSlot()`, `stopPlayback()`, `togglePlayback()`.
2. Create `Waveform.tsx` (wavesurfer.js integration).
3. Wire pad clicks to playback.

**Checkpoint:** Click a pad → hear the sample, see the waveform.

### Phase 4: Drag & Drop
1. Add `@dnd-kit` to `SortableGrid.tsx` and `SortablePad.tsx`.
2. Implement `useFileSystemStore.moveSlot()` with undo history.
3. Wire "Undo" button.

**Checkpoint:** Drag pads to reorder, undo works.

### Phase 5: Auto-Tag & Arrange
1. Implement `src/utils/autoTag.ts`.
2. Implement `src/utils/autoArrange.ts`.
3. Wire "Magic Sort" button.
4. Display tag badges on pads.

**Checkpoint:** Magic Sort categorizes and rearranges samples.

### Phase 6: Commit & Rename
1. Implement `src/utils/renamePlan.ts`.
2. Implement `useFileSystemStore.commitChanges()` and `executeRenamePlan()`.
3. Create `CommitDialog.tsx`.
4. Wire "Commit" button.

**Checkpoint:** Full rename workflow works end-to-end.

### Phase 7: Duplicate Detection
1. Create `src/workers/audioAnalyzer.worker.ts`.
2. Implement `src/utils/similarity.ts`.
3. Implement `useAudioStore.scanDuplicates()`.
4. Add duplicate warning UI to `SortablePad.tsx`.
5. Wire "Scan Duplicates" button.

**Checkpoint:** Duplicate scan runs in background, flags similar samples.

### Phase 8: Polish
1. Add keyboard shortcuts (`useKeyboardShortcuts.ts`).
2. Add PWA support (`vite-plugin-pwa` config).
3. Add notification toasts.
4. Responsive design pass.
5. Performance optimization (React.memo on pads, store selectors).
6. Accessibility pass (ARIA labels, focus management).
7. Final design polish (animations, transitions, micro-interactions).

**Checkpoint:** Production-ready app.

