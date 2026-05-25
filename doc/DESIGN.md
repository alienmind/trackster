# DESIGN.md - Trackster: Circuit Tracks PCM Manager

## 1. Overview

Trackster is a browser-based, offline-capable Progressive Web App (PWA) for managing, auditioning, auto-tagging, and re-sequencing local `.wav` sample files before packing them onto the **Novation Circuit Tracks** groovebox.

The app reads a local directory via the File System Access API, presents the samples in a 4-page, 2�-8 grid that mirrors the hardware layout, and allows drag-and-drop reordering. It includes client-side audio analysis for duplicate detection and heuristic filename parsing for auto-arrangement.

**All operations are local.** No audio file ever leaves the user's machine.

---

## 2. Circuit Tracks Hardware Constraints

Understanding the hardware is essential - the app's entire data model derives from it.

| Constraint | Value |
|---|---|
| Total sample slots | **64** (indexed `00`–`63`) |
| Pages | **4** (16 pads each) |
| Pad grid per page | **2 rows �- 8 columns** |
| Filename convention | `{NN}_{name}.wav` where `NN` is the zero-padded slot index |
| Supported format | `.wav` - **48 kHz, 16-bit, mono** preferred; stereo files are accepted but summed to mono by the hardware |
| Max sample length | ~15 seconds (hardware RAM limited) |
| Page color scheme | Page 1: Orange, Page 2: Yellow, Page 3: Purple, Page 4: Aqua |

The hardware reads the SD card's `PCM` folder and maps files exclusively by their numeric prefix. File ordering, tagging, and page assignment are therefore entirely determined by this prefix.

## 3. Architecture & Toolchain

### 3.1 Architectural Choice: Vite + React

**Vite + React** is the chosen architecture for this project due to the following structural and deployment reasons:

- **Zero Server-Side Logic:** There are no API routes, databases, or SSR requirements. Every component uses browser-only APIs (`showDirectoryPicker`, Web Audio, drag events), making a client-only static architecture the optimal choice.
- **Faster DX:** Vite's dev server starts in <300ms and provides instant HMR, ensuring maximum developer productivity.
- **Simpler Deployment:** The build output is a static `dist/` folder deployable anywhere (GitHub Pages, Netlify, or a local `file://` open).
- **Smaller Bundle:** No framework runtime overhead for routing, server components, or middleware.

### 3.2 Technology Stack

| Layer | Library | Version | Rationale |
|---|---|---|---|
| Build tool | **Vite** | 6.x | Fast, zero-config for React + TS |
| UI Framework | **React** | 19.x | Component model, hooks, ecosystem |
| Language | **TypeScript** | 5.x | Strict mode. Catches file-index math bugs at compile time |
| Styling | **Tailwind CSS** | 4.x | Utility-first, rapid prototyping, easy theming via CSS custom properties |
| State management | **Zustand** | 5.x | Minimal API, no provider nesting, selector-based re-renders (critical for 64-pad grid performance) |
| Drag & Drop | **@dnd-kit/core** + **@dnd-kit/sortable** | 6.x | Hook-based, accessible, grid-layout-friendly, touch support |
| Waveform display | **wavesurfer.js** | 7.x | Mature, Web Audio–backed, responsive, React wrapper available |
| Audio DSP | **Meyda** | 5.x | Client-side feature extraction (RMS, spectral centroid, MFCC) |
| Icons | **lucide-react** | latest | Consistent, tree-shakeable icon set |
| PWA | **vite-plugin-pwa** | latest | Workbox-based service worker generation for Vite |
| Linting | **ESLint** + **Prettier** | latest | Code quality and formatting consistency |

### 3.3 State Management: Zustand over React Context

React Context triggers re-renders for **all consumers** when any part of the context value changes. With 64 pad components subscribing to a shared file-list context, this creates a cascade of unnecessary re-renders on every drag operation.

**Zustand** solves this with selector-based subscriptions:
```typescript
// Only re-renders when THIS pad's data changes
const pad = useFileStore((s) => s.slots[padIndex]);
```

We will use **three stores**, each responsible for a distinct domain:
1. **`useFileSystemStore`** - Directory handle, file list, slot assignments, pending changes, commit logic.
2. **`useAudioStore`** - Currently playing pad, waveform data, playback state.
3. **`useUIStore`** - Active page, selected pad, modal state, notification queue.

---

## 4. Core Mechanics & Browser APIs

### 4.1 File System Access API

```typescript
const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
```

- Grants persistent, user-consented access to the local `PCM` folder.
- Allows reading file contents (for audio playback and analysis) and writing (for renaming).
- **Browser support:** Chromium-only (Chrome, Edge, Arc, Brave). Firefox and Safari do not support this API. The app must display a clear compatibility warning on unsupported browsers.

### 4.2 File Renaming Strategy

When a user drags a pad to a new slot, or triggers "Magic Sort", the app must rewrite the file's numeric prefix. The approach:

1. **Never mutate files during drag.** All drag operations update in-memory state only.
2. **Compute a rename plan.** A diff between the current on-disk prefixes and the desired new prefixes.
3. **Execute on "Commit".** Batch rename via the File System Access API:
   - Read old file → Write new file with updated prefix → Delete old file.
   - Use a temporary suffix (e.g., `__trackster_tmp`) during the rename to avoid name collisions when two files swap positions.
4. **Show a confirmation dialog** listing all planned renames before executing.

### 4.3 Audio Playback

- Use the **Web Audio API** (`AudioContext`) for low-latency sample audition.
- **Single-voice playback:** clicking a new pad stops the currently playing sample.
- **wavesurfer.js** renders the waveform of the currently selected/playing pad.
- Decode audio via `audioContext.decodeAudioData()` on pad selection (lazy, not on directory load).

### 4.4 Offline / PWA

- **vite-plugin-pwa** generates a Workbox service worker that caches the app shell (HTML, JS, CSS, icons).
- Audio files are never cached by the service worker - they live on the user's local filesystem.
- The app must function fully offline after the first visit.

---

## 5. Business Logic

### 5.1 Heuristic Auto-Tagging

A "Magic Sort" button scans filenames and assigns functional tags via case-insensitive regex matching. The tag dictionary:

| Tag | Display | Regex Patterns |
|---|---|---|
| `kick` | 🔴 BD | `kick`, `bd`, `bassdrum`, `808`, `sub` |
| `snare` | 🟡 SD | `snare`, `sd`, `clap`, `rim`, `clp`, `snap` |
| `hihat` | 🔵 HH | `hat`, `hh`, `oh`, `ch`, `hihat`, `open.?hat`, `closed.?hat` |
| `cymbal` | 🟣 CY | `crash`, `cym`, `ride`, `bell`, `splash` |
| `tom` | 🟠 TM | `tom`, `conga`, `bongo` |
| `perc` | 🟤 PC | `perc`, `shaker`, `tamb`, `wood`, `cowbell`, `click`, `clave`, `cabasa`, `guiro`, `maracas`, `triangle` |
| `fx` | ⚪ FX | `fx`, `synth`, `stab`, `chord`, `impact`, `mel`, `noise`, `riser`, `sweep`, `drop`, `vocal`, `vox`, `hit` |
| `unknown` | ⬜ ?? | _(no match)_ |

**Matching rules:**
- Match against the filename **after** stripping the numeric prefix and file extension.
- First match wins (ordered by table priority above).
- `unknown`-tagged samples remain in their current position during auto-arrange.

### 5.2 Auto-Arrangement ("Magic Sort")

When triggered, the app assigns tagged samples to hardware pages:

| Page | Slots | Assigned Tags | Rationale |
|---|---|---|---|
| **1 (Orange)** | `00`–`15` | `kick` | Low-end foundation |
| **2 (Yellow)** | `16`–`31` | `snare`, `clap` | Backbeat elements |
| **3 (Purple)** | `32`–`47` | `hihat`, `cymbal` | Top-end / metallic |
| **4 (Aqua)** | `48`–`63` | `tom`, `perc`, `fx`, `unknown` | Everything else |

**Overflow handling:** If a category has more samples than available slots on its designated page, overflow samples are placed in Page 4's remaining slots. If Page 4 is also full, overflow samples retain their current position and are flagged with a warning.

**Algorithm:**
1. Tag all files via the heuristic dictionary.
2. Sort each tag group alphabetically by filename.
3. Assign to page slots sequentially.
4. Compute the rename plan (old prefix → new prefix).
5. Present the plan for user review in a confirmation modal.
6. Execute on user approval.

### 5.3 Audio Similarity / Duplicate Detection

Detect perceptually similar samples without uploading files:

1. **Decode:** Load each `.wav` `ArrayBuffer` into an `OfflineAudioContext` to get raw PCM data.
2. **Extract features** (via `Meyda`):
   - **RMS envelope** - overall volume shape.
   - **Spectral Centroid** - brightness/timbre proxy.
   - **MFCC** (Mel-Frequency Cepstral Coefficients) - timbral fingerprint.
   - **Duration** - simple but effective filter.
3. **Compare:** Compute cosine similarity between each pair's feature vectors.
4. **Threshold:** If similarity exceeds **0.92** (configurable), flag both pads as "Potential Duplicate".
5. **UI:** Flagged pads receive a pulsing warning border and a tooltip showing which other pad(s) they match.

**Performance:** Analysis runs in a **Web Worker** to avoid blocking the UI thread. A progress indicator shows scan status ("Analyzing 23/64…").

---

## 6. UI/UX Specification

### 6.1 Overall Layout

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
│  PAD GRID (2 rows �- 8 columns)                         │
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

### 6.2 Color Theming

The active page determines the UI accent color, mirroring the Circuit Tracks hardware LEDs:

| Page | CSS Custom Property | Hex | Usage |
|---|---|---|---|
| 1 | `--color-page-1` | `#ff8c00` | Pad borders, active tab, toolbar accent |
| 2 | `--color-page-2` | `#ffd700` | Same |
| 3 | `--color-page-3` | `#9370db` | Same |
| 4 | `--color-page-4` | `#00e5ff` | Same (adjusted from `#00ffff` for readability) |

Background: dark theme (`#0a0a0f` base) with subtle surface elevation via lightened grays.

### 6.3 Pad Anatomy

Each pad is a square, interactive tile displaying:

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
- **Empty** - Dashed border, muted color, shows slot number only.
- **Occupied** - Solid border in page accent color, full content.
- **Selected** - Elevated (box-shadow), brighter border, waveform loads.
- **Playing** - Pulsing glow animation on border.
- **Dragging** - Semi-transparent, with a drag preview showing the pad content.
- **Drop target** - Border brightens with a scale-up micro-animation.
- **Duplicate warning** - Amber pulsing border overlay + ⚠ icon.

### 6.4 Interactions

| Action | Behavior |
|---|---|
| **Click pad** | Select pad → load waveform → begin playback |
| **Click playing pad** | Stop playback |
| **Drag pad** | Pick up and reorder within the current page's 16 slots |
| **Drag pad to another page tab** | Move sample to the first empty slot on that page |
| **Click page tab** | Switch visible page, update accent color |
| **Magic Sort** | Tag → arrange → show confirmation modal → commit on approve |
| **Scan Duplicates** | Analyze all 64 files → flag matches → show count in status bar |
| **Commit** | Show rename plan → execute on confirm → refresh file list |
| **Undo** | Revert the last in-memory reorder (pre-commit only) |

### 6.5 Keyboard Shortcuts

| Key | Action |
|---|---|
| `1`–`4` | Switch to page 1–4 |
| `Space` | Play/stop selected pad |
| `←` `→` `↑` `↓` | Navigate pad selection |
| `Ctrl+Z` | Undo last move |
| `Ctrl+S` | Open commit dialog |

### 6.6 Responsive Design

- **Desktop (≥1024px):** Full 2�-8 grid, waveform above grid.
- **Tablet (768–1023px):** 2�-8 grid with smaller pads, waveform collapses to mini-bar.
- **Mobile (<768px):** 2�-4 grid (horizontal scroll for remaining columns), bottom-sheet waveform. Note: File System Access API is not available on mobile browsers, so the mobile layout is secondary.

---

## 7. File Validation

Before a directory is accepted, the app performs basic validation:

| Check | Action |
|---|---|
| Non-`.wav` files | Ignored silently |
| Files without `NN_` prefix | Shown in a separate "Unassigned" tray below the grid |
| Files with duplicate prefixes | Flagged with error; user must resolve before committing |
| Files > 20 MB | Warning badge (unusually large for a one-shot sample) |
| More than 64 `.wav` files | Only first 64 (by prefix) loaded; remainder shown in overflow list |

---

## 8. Error Handling

| Scenario | Behavior |
|---|---|
| Unsupported browser | Full-page message with browser recommendations |
| Permission denied / revoked | Re-prompt with explanation toast |
| Rename collision during commit | Use temp-file swap strategy (see §4.2) |
| Corrupt `.wav` file | Skip with error toast; mark pad with ❌ |
| Web Worker crash | Graceful fallback to main-thread analysis with progress warning |

---

## 9. Deployment

The app is a **static site**. The Vite build outputs a `dist/` folder containing:
- `index.html`
- Hashed JS/CSS bundles
- PWA manifest + service worker

**Deployment targets:**
- **GitHub Pages** - Deployed automatically via GitHub Actions workflow.
- **Netlify** - Push to repo with build command `npm run build`, publish dir `dist`.
- **GitHub Pages** - Via GitHub Actions.
- **Local** - `npx serve dist` or just open `index.html` (service worker requires HTTP).

---

## 10. Future Considerations (Out of Scope for v1)

- **Waveform editing** - Trim, normalize, fade in/out before committing.
- **Multi-pack management** - Switch between different sample pack directories.
- **Sample import** - Drag external `.wav` files into empty pad slots.
- **Circuit Tracks sysex** - Direct USB MIDI communication for live sample transfer.
- **Audio format conversion** - Auto-convert non-48kHz/non-16-bit files to Circuit Tracks spec.
- **Tag persistence** - Save tag assignments to a sidecar `.json` file so they survive across sessions.

