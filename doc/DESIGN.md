# DESIGN.md - Trackster: Circuit Tracks PCM Manager

## 1. Overview

Trackster is a browser-based, offline-capable Progressive Web App (PWA) for managing, auditioning, auto-tagging, and re-sequencing local `.wav` sample files before packing them onto the **Novation Circuit Tracks** groovebox.

The app reads a local directory via the File System Access API, presents the samples in a 4-page, 2x8 grid that mirrors the hardware layout, and allows drag-and-drop reordering. It includes client-side audio analysis for duplicate detection and heuristic filename parsing for auto-arrangement.

**All operations are local.** No audio file ever leaves the user's machine.

---

## 2. Circuit Tracks Hardware Constraints

Understanding the hardware is essential - the app's entire data model derives from it.

| Constraint | Value |
|---|---|
| Total sample slots | **64** (indexed `00`–`63`) |
| Pages | **4** (16 pads each) |
| Pad grid per page | **2 rows x 8 columns** |
| Filename convention | `{NN}_{name}.wav` where `NN` is the zero-padded slot index |
| Supported format | `.wav` - **48 kHz, 16-bit, mono** preferred; stereo files are accepted but summed to mono by the hardware |
| Max sample length | ~15 seconds (hardware RAM limited) |
| Page color scheme | Page 1: Orange, Page 2: Yellow, Page 3: Purple, Page 4: Aqua |

The hardware reads the SD card's `PCM` folder and maps files exclusively by their numeric prefix. File ordering, tagging, and page assignment are therefore entirely determined by this prefix.

---

## 3. Architecture & Toolchain

### 3.1 Architectural Choice: Vite + React
**Vite + React** is the chosen architecture for this project due to:
- **Zero Server-Side Logic:** Every component uses browser-only APIs (`showDirectoryPicker`, Web Audio, drag events), making a client-only static architecture the optimal choice.
- **Faster DX:** Vite's dev server provides instant HMR.
- **Simpler Deployment:** The build output is a static `dist/` folder deployable anywhere.
- **Smaller Bundle:** No framework runtime overhead for routing or SSR.

### 3.2 Technology Stack
- **Build tool:** Vite (Fast, zero-config for React + TS)
- **UI Framework:** React 19.x
- **Language:** TypeScript 5.x (Strict mode catches index math bugs at compile time)
- **Styling:** Tailwind CSS 4.x (Utility-first, CSS custom properties for theming)
- **State management:** Zustand 5.x (Minimal API, selector-based re-renders critical for 64-pad grid performance)
- **Drag & Drop:** `@dnd-kit/core` + `@dnd-kit/sortable`
- **Waveform display:** `wavesurfer.js` 7.x
- **Audio DSP:** `Meyda` 5.x (Client-side feature extraction)
- **Icons:** `lucide-react`
- **PWA:** `vite-plugin-pwa`

---

## 4. Folder Structure

```
trackster/
├── src/
│   ├── components/
│   │   ├── Core/            # App shell, Toolbar, Modals, shared UI primitives
│   │   ├── Circuit/         # Circuit Tracks specific (PackOrganizer, Grids, Waveform)
│   │   └── Overview/        # Interactive DAWless routing canvas and hardware nodes
│   ├── stores/              # Zustand stores (useFileSystemStore, useAudioStore, useUIStore, useOverviewStore)
│   ├── hooks/               # Custom hooks (useAudioPlayback, useBrowserSupport)
│   ├── utils/               # Pure functions (fileNaming, autoTag, similarity)
│   ├── workers/             # Web Worker for Meyda feature extraction
│   └── types/               # Shared TS types and ambient declarations
└── doc/                     # Design documentation
```

---

## 5. Core Mechanics & Browser APIs

### 5.1 File System Access & Renaming Strategy
The app uses `window.showDirectoryPicker` to grant persistent, user-consented access to the local `PCM` folder. It reads file contents and writes for renaming.
- **Browser support:** Chromium-only. Unsupported browsers show a clear compatibility warning.
- **Rename Strategy:** All drag operations update in-memory state only. When the user clicks "Commit", a rename plan is generated. A batch rename executes via a two-pass approach using temporary suffixes to avoid collisions when files swap positions.

### 5.2 Audio Playback
- **Web Audio API** (`AudioContext`) handles low-latency sample audition.
- **Single-voice playback:** clicking a new pad stops the currently playing sample.
- **wavesurfer.js** renders the waveform of the currently selected/playing pad. Audio is decoded lazily upon pad selection.

### 5.3 Offline / PWA
`vite-plugin-pwa` generates a Workbox service worker caching the app shell (HTML, JS, CSS, icons). Audio files are strictly local and are never cached by the service worker.

---

## 6. Business Logic

### 6.1 Heuristic Auto-Tagging
A "Magic Sort" button scans filenames (stripping the prefix and extension) and assigns tags via case-insensitive regex matching. First match wins.
- `kick` (🔴 BD), `snare` (🟡 SD), `hihat` (🔵 HH), `cymbal` (🟣 CY), `tom` (🟠 TM), `perc` (🟤 PC), `fx` (⚪ FX), `unknown` (⬜ ??).

### 6.2 Auto-Arrangement ("Magic Sort")
Assigns tagged samples to hardware pages:
- **Page 1 (Orange):** `kick`
- **Page 2 (Yellow):** `snare`, `clap`
- **Page 3 (Purple):** `hihat`, `cymbal`
- **Page 4 (Aqua):** `tom`, `perc`, `fx`, `unknown`

*Overflow handling:* If a category has more samples than available slots on its page, overflow samples are placed in Page 4.

### 6.3 Audio Similarity / Duplicate Detection
Detects perceptually similar samples locally:
1. Loads raw PCM data.
2. Posts data to a **Web Worker** which extracts features via Meyda (RMS envelope, Spectral Centroid, MFCC).
3. Computes cosine similarity between each pair's feature vectors.
4. If similarity exceeds a threshold (~0.92), pads are flagged as "Potential Duplicate" with a warning icon and pulsing border.

---

## 7. State Management (Zustand Stores)

Using Zustand with selector-based subscriptions avoids cascading React Context re-renders across the 64-pad grid.

- **`useFileSystemStore`**: The primary store. Owns the directory handle, the 64 slots array, pending changes count, and an undo stack. Actions include `loadFiles`, `moveSlot`, `autoTag`, `autoArrange`, `commitChanges`, and `executeRenamePlan`.
- **`useAudioStore`**: Manages the `AudioContext`, cached decoded buffers, active playback state, and duplicate analysis results. Exposes actions for lazy init, playing, stopping, and scanning duplicates.
- **`useUIStore`**: Holds the active page, selected pad index, and UI states like modals and notifications.
- **`useOverviewStore`**: Manages the interactive nodes and connections for the DAWless routing setup in the Overview tab.

---

## 8. UI/UX Specification & Component Architecture

### 8.1 Overall Layout

```
┌─────────────────────────────────────────────────────────┐
│  TOOLBAR                                                │
│  [📂 Select Directory] [✨ Magic Sort] [🔍 Scan Dupes] │
│                                    [↩ Undo] [💾 Commit] │
├─────────────────────────────────────────────────────────┤
│  WAVEFORM VISUALIZER                          ▶ 01:23   │
│  ▁▂▃▅▆▇█▇▆▅▃▂▁▁▂▃▅▇▇▆▅▃▂▁                             │
├─────────────────────────────────────────────────────────┤
│  PAGE TABS                                              │
│  [ Page 1 🟠 ] [ Page 2 🟡 ] [ Page 3 🟣 ] [ Page 4 🔵 ] │
├─────────────────────────────────────────────────────────┤
│  PAD GRID (2 rows x 8 columns)                          │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐│
│  │ 00 │ │ 01 │ │ 02 │ │ 03 │ │ 04 │ │ 05 │ │ 06 │ │ 07 ││
│  │Kick│ │Kick│ │Kick│ │    │ │    │ │    │ │    │ │    ││
│  │ BD │ │ BD │ │ BD │ │    │ │    │ │    │ │    │ │    ││
│  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘│
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐│
│  │ 08 │ │ 09 │ │ 10 │ │ 11 │ │ 12 │ │ 13 │ │ 14 │ │ 15 ││
│  │Kick│ │Kick│ │    │ │    │ │    │ │    │ │    │ │    ││
│  │ BD │ │ BD │ │    │ │    │ │    │ │    │ │    │ │    ││
│  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘│
├─────────────────────────────────────────────────────────┤
│  STATUS BAR    42/64 slots filled  │  3 pending changes │
└─────────────────────────────────────────────────────────┘
```

### 8.2 Component Architecture
- **`App.tsx`**: Root layout orchestrating Toolbar and the main view switcher.
- **`Core/Toolbar/Toolbar.tsx`**: Triggers file loading, magic sort, dup scan, undo, commit, and Overview layout controls depending on the active view.
- **`Circuit/Waveform/Waveform.tsx`**: Wraps `wavesurfer.js` with a fixed height. Color matches the active page's accent.
- **`Circuit/Grid/SortableGrid.tsx`**: Wraps 16 pads per page with `@dnd-kit`'s `<DndContext>`.
- **`Circuit/Grid/SortablePad.tsx`**: Interactive square tile displaying content based on occupied status. Connects to `useSortable` for drag operations.
- **`Overview/OverviewTab.tsx`**: Interactive SVG canvas rendering hardware nodes, draggable MIDI/Audio cables, and routing configurations.

### 8.3 Pad Anatomy

```
┌──────────────┐
│ 03         ▶ │   ← Slot number (top-left), Playing indicator (top-right)
│              │
│  TR-808 Kick │   ← Clean filename, centered (prefix + extension stripped)
│              │
│          BD  │   ← Tag badge (bottom-right), color-coded
│ ⚠           │   ← Duplicate warning icon (bottom-left), if flagged
└──────────────┘
```

**Pad states:**
- **Empty:** Dashed border, muted color.
- **Occupied:** Solid border in page accent color.
- **Selected:** Elevated with a box-shadow.
- **Playing:** Pulsing glow animation on border.
- **Dragging:** Semi-transparent drag preview.
- **Drop target:** Border brightens with a scale-up micro-animation.
- **Duplicate warning:** Amber pulsing border overlay + ⚠ icon.

### 8.4 Color Theming & Styling Architecture
Styling relies on Tailwind CSS v4 using CSS Custom Properties defined in `index.css`. The active page determines the UI accent color (`--accent`), mirroring hardware LEDs:
- **Page 1:** Orange (`#ff8c00`)
- **Page 2:** Yellow (`#ffd700`)
- **Page 3:** Purple (`#9370db`)
- **Page 4:** Aqua (`#00e5ff`)

Background is a dark theme (`#0a0a0f` base) with subtle surface elevation.

### 8.5 Interactions & Keyboard Shortcuts
- **Click pad:** Load waveform & play.
- **Drag pad:** Reorder within page or drag to another page tab.
- **Commit:** Shows rename plan before executing via File System Access API.
- **Shortcuts:** `1`–`4` for page switching, `Space` for play/stop, Arrow keys for navigation, `Ctrl+Z` to undo, `Ctrl+S` to open commit dialog.

---

## 9. Validation & Error Handling

- **Browser Validation:** Fallback screen if `showDirectoryPicker` is unavailable.
- **File Validation:** Ignores non-`.wav` files. Files without a `NN_` prefix go to an unassigned tray. Duplicate prefixes trigger a block. Files >20 MB receive a warning badge.
- **Runtime Errors:** Graceful fallbacks for Web Worker crashes, corrupted `.wav` decodes, and temporary rename collision handling.

---

## 10. Web Worker (Duplicate Analysis)
To prevent UI freezes from heavy DSP computations, Meyda feature extraction runs in a dedicated Web Worker (`audioAnalyzer.worker.ts`). The main thread passes raw `ArrayBuffer` data (zero-copy transfers). The worker processes the queue and posts progress updates back to the UI, returning final feature vectors for duplicate flagging.

---

## 11. Testing & Deployment

### 11.1 Testing Strategy
- **Unit Tests (Vitest):** Tests all pure utilities (filename parsing, tagging, auto-arrange math, similarity calculations).
- **Component Tests (React Testing Library):** Validates UI interactions, dialog states, and disabled states.

### 11.2 Build & Deployment
The Vite static site output is deployed automatically via GitHub Actions to GitHub Pages, or can be hosted on Netlify or locally via any static file server.

---

## 12. Future Considerations (Out of Scope for v1)
- Waveform editing (trim, normalize, fade in/out).
- Multi-pack management and external sample import.
- Circuit Tracks sysex integration for direct USB MIDI transfer.
- Audio format conversion to preferred 48kHz/16-bit specs.
- Persisting tags to a sidecar `.json` file.
