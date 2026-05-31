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
