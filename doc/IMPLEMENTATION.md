# Trackster Implementation & Architecture Guide

# Overview

## Overview Architecture

The Overview module provides an interactive, drag-and-drop DAWless routing canvas. It visually maps out hardware synths, mixers, audio cables, and MIDI routing.

- **Nodes**: Represent hardware units (e.g., Circuit Tracks, S-1, Grind, Flow 8, Ableton).
- **Connections**: Represent physical or logical cables (Audio TS, Audio TRS, Sidechain Pump, MIDI DIN, MIDI USB).
- **State**: Managed by `useOverviewStore.ts`, persisting node coordinates, connections, and metadata to localStorage.

---

# Design & Architecture

# Trackster: Hybrid DAWless Setup Manager

## 1. Overview

Trackster is an advanced, fully client-side web application designed for organizing, previewing, and managing your hybrid DAWless setup. It combines hardware-specific functionalities (like managing samples directly on your Novation Circuit Tracks SD card) with a comprehensive, interactive routing canvas for your entire studio.

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
│   │   ├── Overview/        # Interactive DAWless routing canvas and hardware nodes
│   │   └── Circuit/         # Circuit Tracks specific (PackOrganizer, Grids, Waveform)
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


---

# Enhancements

# Trackster Enhancements Plan

This document captures the audit findings and the phased roadmap to elevate Trackster's architecture, visual design, and deploy story. Source of truth is this file; in-progress notes may live in a session memory.

---

## Part A - Assessment

### A1. Architecture: solid foundations, one god-store

**Strengths**
- Clean Vite + React 19 + TS strict + Zustand 5 stack matches `doc/AGENTS.md` guardrails.
- Three-store split (`useFileSystemStore`, `useAudioStore`, `useUIStore`) is the right partition.
- Selector-based subscriptions are used consistently. No React Context for grid state.
- Domain types (`SampleFile`, `PadSlot`, `PackSlot`, `RenamePlan`) cleanly mirror hardware.
- Audio analysis correctly offloaded to a Web Worker with transferable buffers.
- No `any`, no `@ts-ignore`, no `eslint-disable` anywhere.
- Commit-only writing with the documented two-pass `__trackster_tmp` swap is honored.

**Weaknesses**
- `useFileSystemStore` is ~1000 lines and does too much: directory IO, pack model, slot model, tag actions, undo stack, rename planning, commit orchestration.
- 30+ `console.*` calls in the store. No debug flag.
- Zero automated tests. The pure utilities `renamePlan.ts`, `fileNaming.ts`, `autoArrange.ts`, `similarity.ts` are the highest-leverage place to add tests; they are exactly the code that, if buggy, "obliterates packs" per the README warning.
- `SortablePad` and `PackPad` are not `React.memo`'d.
- `packages/llm-client/` is orphaned (zero imports from `src/`). Misleading for a fully client-side PWA.
- `AudioFeatureVector.mfcc` and `spectralCentroid` are declared but the worker only computes a trivial `[size, sum]` fingerprint. Similarity is weak.
- MIDI Live Preview (`doc/MIDI.md`) is fully unimplemented.
- No persisted-store schema version or migration; risky as schema evolves.

### A2. UI / visual design: generic shadcn dark mode, not hardware-grade

**Today**
- Flat dark surfaces, rounded corners, page accent via `--accent` CSS var.
- No gradients, no shadows beyond `shadow-sm`, no glow, no skeuomorphism.
- `App.css` still contains a leftover Vite scaffold (`.counter`, `.hero`, `#next-steps`, etc.).
- No mobile breakpoint handling; the 2x8 grid likely overflows below 768px.
- Pad anatomy is implemented but visually thin: no LED glow, no inner bezel, no luminous "lit" state distinct from "selected" beyond a ring color.

**Hardware-grade target** (mirrors Novation Circuit Tracks aesthetic)
- Pad as a 3D-feeling rubberized square: subtle inner bevel (inset shadow on top, faint highlight on bottom), matte black surface, translucent inner core that "lights up" with the page accent.
- Playing pad: pulsing radial gradient core + outer halo (`box-shadow` with the page color at ~50% alpha and 20-32px blur).
- Empty pad: dark with faint dashed border and reduced opacity, no LED.
- Page tabs as the four hardware page buttons: capsule pills with the canonical orange/gold/purple/cyan, active tab "lit", inactive dim.
- Panel chrome: gunmetal `linear-gradient(180deg, #14141a, #0a0a0f)` with a 1px top highlight `inset 0 1px 0 rgba(255,255,255,0.04)`.
- Typography: keep Geist for UI, add a tabular monospace face for slot numbers and BPM/duration to evoke the hardware LCD.
- Optional: subtle SVG noise overlay (6-8% alpha) on the app background for tactile depth.
- Include an SVG-driven "hardware overview" illustration in the app, with colored connector paths, equipment cards, and signal-flow markers to reinforce the physical setup.

### A3. GitHub Pages deploy gaps

The repo deploys to GitHub Pages but several things will break for a project repo (`user/trackster/`):
- `vite.config.ts` has `base: '/'` hardcoded. For a project repo this must be `'/<repo>/'`.
- No `public/.nojekyll`, so underscore-prefixed assets risk being stripped by Jekyll.
- No `public/404.html` SPA fallback.
- `vite-plugin-pwa` `scope` and `start_url` are not set and default to `/`, mismatching the actual `base` on a project repo. PWA install will be broken.
- Workflow exists (`.github/workflows/deploy.yml`) but does not pass a `BASE` env or detect repo type.
- File System Access API requires a secure context; `github.io` is fine but should be documented.

---

## Part B - Phased plan

### Phase 1: Ship-readiness (small, high-ROI)

- **1.1** Remove the leftover Vite scaffold in `src/App.css`.
- **1.2** Gate every `console.*` in `src/stores/useFileSystemStore.ts` behind a `DEBUG` flag via a `src/utils/logger.ts` util.
- **1.3** `React.memo` for `SortablePad` and `PackPad`.
- **1.4** Configure GitHub Pages deploy correctly:
  - `vite.config.ts` `base` reads `process.env.VITE_BASE`, defaults to `'/'`.
  - PWA manifest `scope` and `start_url` align with `base`.
  - `public/.nojekyll` and `public/404.html` (SPA fallback) emitted.
  - Workflow passes `VITE_BASE=/<repo>/` when the repo is not a user/org site.
- **1.5** Decide on `packages/llm-client/`: delete (recommended) or document.

### Phase 2: Architecture cleanup

- **2.1** Split `useFileSystemStore` into three cohesive slices via Zustand combine, keeping a single externally-visible store identity:
  - Directory slice: `rootHandle`, `packs`, `packSlots`, `activePack`, `openRootDirectory`, `rescanRootDirectory`, `loadPack`.
  - Slot/pack slice: `slots`, `unassignedFiles`, slot/file mutations.
  - Commit/history slice: `history`, `pendingChanges`, `commit`, `executeRenamePlan`, undo.
- **2.2** Extract domain logic out of the store into pure modules (testable):
  - `src/domain/renameExecutor.ts` - the two-pass swap.
  - `src/domain/packModel.ts` - pack/slot derivations.
  - `src/domain/commitPlanner.ts` - diff slots vs. on-disk to produce `RenamePlan` + move ops.
- **2.3** Add Vitest with focused suites for `domain/` and `utils/`.
- **2.4** Add Zustand persist `version` + `migrate`.
- **2.5** Introduce `useSlot(index)` and `useSelectedSample()` hooks under `src/stores/hooks/`.
- **2.6** Replace `useUIStore.notifications[]` with `sonner`.

### Phase 3: Hardware-grade visual design

- **3.1** Hardware design-token layer in `src/index.css`:
  - Surface tokens: `--surface-shell`, `--surface-panel`, `--surface-pad-off`, `--surface-pad-on`.
  - Bevel tokens: `--bevel-top-highlight`, `--bevel-bottom-shadow`, `--bezel-stroke`.
  - Glow tokens per page: `--glow-page-1..4`.
  - Tabular monospace font for numerics.
- **3.2** Redesign `SortablePad` and `PackPad`:
  - Two-layer DOM: outer rubber shell + inner LED core.
  - States: empty, occupied, selected, playing (pulse + halo), drop target (scale 1.04), duplicate warning (amber halo + pulsing glyph).
  - All states CSS-only where possible.
- **3.3** Redesign `PageTabs` as hardware page buttons.
- **3.4** Redesign panel chrome (`App.tsx` shell, `Toolbar`, `StatusBar`, `FileInspector`): gunmetal vertical gradient + 1px highlights.
- **3.5** Add full-screen SVG noise overlay at 6-8% opacity.
- **3.6** Add an "Overview" tab with a rich SVG system diagram: equipment cards, connector flows, color-coded signal paths, and Lucide icon-based status badges.
- **3.7** Responsive pass: 2x8 collapses to 4x4 below 640px; panes become tabs.
- **3.8** Compact mode verified at 1366x768.
- **3.9** Accessibility: WCAG AA contrast for text and focus rings.

### Phase 4: Feature credibility

- **4.1** Replace the trivial fingerprint with real Meyda features (RMS envelope downsampled to 32 bins, spectral centroid mean, 13-bin MFCC mean). Populate `AudioFeatureVector` for real. Tune similarity threshold against a labeled fixture.
- **4.2** Implement MIDI Live Preview (`doc/MIDI.md`):
  - `src/stores/useMidiStore.ts` for `MIDIAccess` / `MIDIOutput` filtering on `name.includes('Circuit Tracks')`.
  - `src/domain/midiRouter.ts` with `playHardwarePreview(trackId, presetIndex)`.
  - `LivePreview` page with 8-track selector and 8x8 (or 4x16) pad matrix.
- **4.3** Optional keyboard shortcuts (space, arrows, 1-4, Ctrl+Z, Ctrl+S).

---

## Relevant files

- `src/App.tsx`, `src/App.css`, `src/index.css` - shell layout and tokens.
- `src/components/Grid/SortablePad.tsx`, `src/components/PackOrganizer/PackPad.tsx` - pad redesign + memo.
- `src/components/PageTabs/PageTabs.tsx` - hardware page buttons.
- `src/components/Overview/OverviewTab.tsx` (new) - SVG-driven system diagram for the app overview.
- `src/components/Toolbar/`, `src/components/StatusBar/`, `src/components/FileInspector/` - panel chrome.
- `src/stores/useFileSystemStore.ts` - split into `src/stores/fileSystem/`.
- `src/domain/` (new) - `renameExecutor.ts`, `commitPlanner.ts`, `packModel.ts`.
- `src/workers/audioAnalyzer.worker.ts` - real Meyda features.
- `src/utils/logger.ts` (new) - debug-gated logger.
- `vite.config.ts` - env-driven `base`, PWA scope/start_url.
- `public/.nojekyll`, `public/404.html` - GH Pages SPA support.
- `.github/workflows/deploy.yml` - `VITE_BASE` derivation.
- `packages/llm-client/` - removed.
- `vitest.config.ts` + `src/**/*.test.ts` - new.

---

## Verification

1. `pnpm lint && pnpm tsc -b` clean.
2. `pnpm vitest run` green; coverage on `domain/` and `utils/`.
3. Manual: open a real PCM folder, rearrange pads across pages, verify commit produces only expected renames.
4. Manual: swap two adjacent slots and commit; verify two-pass rename occurs and no file is lost.
5. Profile drag with React DevTools; only dragged and target tiles re-render.
6. Lighthouse PWA audit >= 90 after manifest fix.
7. Deploy to a throwaway `username.github.io/trackster-test` repo; verify load, accents, PWA install, no 404 on refresh.
8. Visual review of redesigned pads against a Circuit Tracks photo.

---

## Decisions

- **In scope**: assessment, refactor plan, visual redesign, GH Pages hardening, MIDI feature, real audio similarity. Stays client-only per `AGENTS.md`.
- **Out of scope**: accounts, cloud sync, marketplace, native wrappers.
- **Recommended ordering**: Phase 1 (a single short PR), then Phase 2 (refactor without UI churn), then Phase 3 (visual lands on clean architecture), then Phase 4.


---

# Agent Rules & Coding Standards

# Trackster - AI Agent Instructions & Guardrails

Welcome to the Trackster codebase. You are an expert AI software engineer / coding agent. When writing code, generating documentation, or editing files in this repository, you must adhere strictly to the following guardrails, planning protocols, and architectural rules.

---

## 1. Critical Rules & Code Style

### No Em-Dashes (`—`)
* **Strict Prohibition:** Never use the em-dash character (`—`) in code comments, markdown documentation, commit messages, console output, or user interfaces.
* **Alternative:** Use standard hyphens (`-`), colons (`:`), or clear phrasing instead.

### No Verbose/Thinking Comments
* **Strict Prohibition:** Avoid verbose, self-explanatory, narrative, or "silly" comments that document your step-by-step thinking process or state changes (e.g., `// Now we need to set state`, `// Let's iterate over the slots because...`).
* **Guidelines:** 
  * Code comments must be clean, sparse, highly professional, and technical.
  * Only explain **why** non-obvious logic or hardware-specific constraints exist.
  * Never explain **what** the code does when it is self-evident from readable variable and function names.

### Strict TypeScript Typings
* **Strict Mode:** Always run TypeScript in strict mode.
* **No `any`:** Never use the `any` type. If a type is unknown, use `unknown` and type guards.
* **Safe Indexing:** Accessing elements in fixed-size arrays (like the 64 pad grid) must check for `undefined` if `noUncheckedIndexedAccess` is enabled.
* **Return Types:** Explicitly define return types for all store actions, hooks, and complex utility functions.

---

## 2. Tech Stack & Architectural Protocols

Trackster is a browser-based, offline-capable Progressive Web App for managing sample packs for the Novation Circuit Tracks groovebox.

### Framework & Client-Only Nature
* **Stack:** Vite + React 19 + TypeScript + Zustand + Tailwind CSS v4.
* **Strict Client-Only:** Zero server-side code, API routes, SSR, or database dependencies. Everything must execute locally using browser APIs.

### State Management: Zustand 5.x
* **Rule:** Never use React Context for the core 64-pad grid state to avoid massive re-render cascades during drag-and-drop or select operations.
* **Store Division:** Use three separate domain-focused Zustand stores:
  1. `useFileSystemStore` - Directory handle, slots array, rename plan, commit logic.
  2. `useAudioStore` - Playback state, decoded buffers cache, wavesurfer instance, similarity analysis.
  3. `useUIStore` - Active page index (0-3), selected pad index, modal states, notifications.
* **Selector Pattern:** Always subscribe to stores using strict selector-based hooks:
  ```typescript
  // CORRECT: Component only re-renders when this specific slot's sample changes
  const sample = useFileSystemStore((state) => state.slots[index]?.sample);
  ```

### Feature-Based Architecture
* **Strict Division:** Components must be isolated into feature domains under `src/components/`.
  * `Core/` - App shell, navigation, global UI primitives (modals, buttons, toolbars).
  * `Overview/` - The interactive DAWless routing canvas and hardware node elements.
  * `Circuit/` - Circuit Tracks-specific views (Pack Organizer, Sample Organizer, Grids, Waveform).
* **No Flat Structures:** Do not place domain components directly inside `src/components/`.

### File System Access API
* **Fallback Check:** This API is Chromium-only. Every entry point must verify if `showDirectoryPicker` is available in `window` and gracefully render a full-page fallback (`BrowserWarning.tsx`) otherwise.
* **Commit-Only Writing:** Never write or rename files on drag-and-drop actions. Perform all re-orderings in-memory first. Batch-write and rename files only when the user explicitly triggers a "Commit".

### Collisions & File Renaming
* **The Rename Strategy:** When executing a rename plan, files can swap places (e.g. `01_Kick.wav` swaps with `02_Snare.wav`). To prevent name collisions during the batch process, you must use a **two-pass swap strategy**:
  1. **Pass 1:** Rename all target files to a temporary name using the suffix `__trackster_tmp` (e.g. `__tmp_NN_name.wav`).
  2. **Pass 2:** Rename the temporary files to their final destination names (e.g. `NN_name.wav`).

### Audio DSP & Web Worker
* **Web Worker offloading:** Running duplicate detection/audio similarity calculations (RMS, Spectral Centroid, MFCC via Meyda) on 64 files requires heavy CPU cycles. This **must** be run inside a Web Worker (`audioAnalyzer.worker.ts`) to prevent freezing the main UI thread.
* **Playback:** Maintain a single-voice playback model. Decoded audio data (`AudioBuffer`) should be cached dynamically by slot index in `useAudioStore` to avoid re-decoding.

---

## 3. UI, UX & Styling Guidelines

* **Premium Design:** Base background should be a rich dark theme (`#0a0a0f`) with surface elevations via lightened grays.
* **Hardware-Mirrored Page Colors:** Mirror the Novation Circuit Tracks page colors strictly:
  * Page 1 (slots 00-15): Orange (`#ff8c00`)
  * Page 2 (slots 16-31): Yellow (`#ffd700`)
  * Page 3 (slots 32-47): Purple (`#9370db`)
  * Page 4 (slots 48-63): Aqua (`#00e5ff`)
* **Accents:** The active page determines the UI accent color on the root element via a CSS custom property `--accent`.
* **Micro-Animations:** Implement smooth hover states, a pulsing border for playing pads, a pulsing amber warning for duplicate pads, and subtle scale-up effects for drag targets.


---

