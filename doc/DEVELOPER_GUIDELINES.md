# Trackster Developer & Architecture Guidelines

Welcome to the Trackster developer guide. This document serves as a unified reference for human developers and AI models (LLMs) to understand Trackster's architecture, folder layout, design system, mobile considerations, and coding workflows.

---

## 1. Overview & Purpose
Trackster is a fully client-side, offline-capable Progressive Web App (PWA) designed for documentation, routing orchestration, and sample management of hybrid DAWless studio setups.
*   **DAWless Routing Overview**: Interactive, gestural vector canvas mapping out physical inputs, outputs, and cabling (audio/MIDI) between device nodes.
*   **Sample Pack Management**: Specifically handles file reordering, heuristic auto-tagging, duplicate analysis, and page assignments for the Novation Circuit Tracks SD card.
*   **Strictly Local**: Zero server-side API dependencies, databases, or cloud sync. All operations (file operations, Web Audio playback, and audio similarity analyses) run locally inside the user's browser.

---

## 2. Technology Stack & Core APIs
*   **Package Manager**: `pnpm` (Strictly `pnpm` - do not use `npm` or `yarn`).
*   **Bundler & Dev Server**: Vite (instant HMR and static production builds).
*   **UI Framework**: React 19.x (using TypeScript 5.x in strict mode).
*   **State Management**: Zustand 5.x (minimal selector-based state subscriptions to prevent excessive React re-renders on highly interactive grids).
*   **Styling**: Tailwind CSS v4 (responsive utility classes with custom CSS properties for dynamic color page themes).
*   **Drag & Drop**: `@dnd-kit/core` + `@dnd-kit/sortable` for sample layout grids.
*   **Browser Storage**: IndexedDB (via `idb-keyval` for cache persistence).
*   **Core Browser APIs**:
    *   *File System Access API* (`window.showDirectoryPicker`): Grants direct access to read, modify, and delete files in the SD card's `PCM` directory. Since this is a Chromium-only API, the app warns non-Chromium users via a dedicated fallback warning view.
    *   *Web Audio API* (`AudioContext`): Provides low-latency audio rendering, dynamic waveform decoding, and sample playback monitoring.
    *   *Web Workers*: Heavy CPU operations (like computing audio similarities) are offloaded to dedicated background workers (`audioAnalyzer.worker.ts`) to keep the main UI thread at 60fps.

---

## 3. Directory Layout & Architecture
Trackster follows a strictly structured folder configuration:
```
trackster/
├── src/
│   ├── components/
│   │   ├── Core/            # App shell, toolbar, modals, and reusable UI primitives
│   │   │   ├── HardwareUI/  # Reusable front-panel controls (Knobs, Buttons, Pads, etc)
│   │   │   ├── ManualsList/ # Sidebar listing available PDF manuals for selected device
│   │   │   ├── PdfViewer/   # In-app PDF rendering frame for device documentation
│   │   │   └── ui/          # Primitives like Buttons, Dialogs, tooltips, drawers, etc
│   │   ├── Overview/        # DAWless interactive routing canvas & touch gesture viewport
│   │   └── devices/         # Hardware specific UI implementations
│   │       ├── Circuit/     # Novation Circuit Tracks layout (grids, sample page tabs)
│   │       ├── Grind/       # Behringer Grind interface visualizer & user guide sync
│   │       └── MiniFreak/   # Arturia MiniFreak interface visualizer & controls mapping
│   ├── stores/              # Zustand state containers (useCircuitTracksStore, useUIStore, etc)
│   ├── hooks/               # Core utility hooks (audio playback, browser capabilities)
│   ├── utils/               # Pure functions (filename parsing, cosine similarity, auto-taggers)
│   ├── workers/             # Background thread for audio analysis feature extraction (Meyda DSP)
│   └── types/               # Type definition files
├── devices/                 # Device hardware typescript/JSON definitions (top-level)
└── doc/                     # Project documentation, guides, and manuals
```

---

## 4. State Management (Zustand)
We split states across domain-focused Zustand stores:
1.  **`useCircuitTracksStore`**: Controls the local folder directories, in-memory sample slots, unassigned lists, rename planning queue, and undo/redo history stacks. Also manages the `AudioContext` lifecycle, analysis workers, audio level meters, waveform cached buffers, and duplicate detection markers.
2.  **`useUIStore`**: Holds the global UI navigation state: `activeMainView`, active page index, selected pads, notification arrays, active PDF manual url, and sidebar expansion states.
3.  **`useGrindStore`**: Tracks the selected documentation section for the Behringer Grind interactive user guide.

### Selector Subscription Pattern
Always subscribe to Zustand state selectors. Never pull the entire store state. This prevents components from re-rendering when unrelated state slices change:
```typescript
// CORRECT: Component only re-renders when this specific slot is updated
const slotSample = useFileSystemStore((state) => state.slots[index]?.sample);
```

---

## 5. Styling & Visual Language
Trackster implements a hardware-centric, high-fidelity dark aesthetic mimicking physical studio units:
*   **Base Palette**: Gunmetal gray panels, vertical linear gradients, and a full-screen CSS noise texture overlay.
*   **Accent Color Mapping**: Root color custom property `--accent` matches active pages (Page 1: Orange, Page 2: Yellow, Page 3: Purple, Page 4: Cyan).
*   **Tactile Hardware Elements**:
    *   *Rubberized Pads*: Inset gradients, 3D shadows, inner glowing LED indicators, and pulsing halos to indicate active playback.
    *   *Rotary Knobs*: Classic metallic indices, custom pointer-drag event hooks, double-click to reset, and LED rings indicating value offsets.

### Button Design Language
We enforce a strict semantic color coding for UI buttons (`src/components/Core/ui/button.tsx`) to avoid visual conflict:
*   **Action (`variant="default"`)**: Primary actions that execute and complete (e.g., "Auto-Tag & Arrange"). **Color: Cyan/Blue**.
*   **Positive Action (`variant="success"`)**: Actions that establish connections or confirm state (e.g., "Mount SD Card"). **Color: Green**.
*   **Secondary Tool (`variant="secondary"`)**: Auxiliary actions (e.g., "Find Duplicates"). **Color: Neutral Grey**.
*   **State Toggle (`variant="state"`)**: Buttons representing an active/inactive mode or view (e.g., "Pack A", "Tags in Filenames"). 
    *   **Inactive**: Outline grey.
    *   **Active**: Solid white/light grey with black text. *(Never blue, to prevent conflict with Action buttons)*.
*   **Links/Manuals (`variant="ghost"`)**: External links or document selections. Hover state transitions to white without background colors.

---

## 6. Desktop vs. Mobile & Touch Gestures
To support desktop, tablet, and mobile devices:
*   **ScaleFit Wrapper**: Skeuomorphic UI layouts (like the detailed Behringer Grind or MiniFreak layouts) are designed at a fixed resolution and wrapped in a `<ScaleFit>` component. This scales the vector panels down to fit smaller tablet or mobile screens perfectly without breaking proportions or overflowing.
*   **Responsive Drawer**: Mobile device sidebars are housed inside a sliding overlay drawer (`isMobileDrawerOpen`), while desktop devices render them inline.
*   **Interactive Overview Navigation**: Panning and zooming on the Overview canvas is fully optimized for mobile devices:
    *   *Touch Gestures*: Dual-finger pinch zooms the canvas relative to the fingers' midpoint; dual-finger drag pans.
    *   *Panning Transitions*: Seamlessly falls back to single-finger panning when one finger is released during a pinch.
    *   *Auto-Fitting*: The canvas automatically centers and fits all device nodes on initial load and window resize (e.g. tablet rotation) to ensure no nodes are cut off.

---

## 7. How to Add a New Device
Trackster maps equipment on the routing canvas. To add support for a new device:

### Step 1: Create the Device Definition
Use a multimodal LLM to generate the hardware configuration from a top-down transparent image of the gear.
1.  Search for a transparent, top-down view of the gear (using Google Image search).
2.  Right-click and copy the image to the clipboard.
3.  In Trackster's "Add Custom Device" tool, paste (`Ctrl+V` / `Cmd+V`) the image to auto-convert it to a Base64 string.
4.  Provide a prompt to the LLM to output a JSON schema matching this format:
```json
{
  "brand": "Manufacturer Name",
  "model": "Device Name",
  "tagline": "ONE-WORD CATEGORY (e.g., SYNTH, SEQUENCER)",
  "width": 300,
  "theme": {
    "border": "border-t-cyan-500",
    "header": "bg-neutral-900",
    "title": "text-white",
    "badge": "bg-neutral-800 text-neutral-400"
  },
  "ports": [
    // Map out the physical ports visible on the device.
    // ID should conventionally contain "In" or "Out" (e.g. "audioIn", "midiOut") so they are auto-placed on the left/right.
    // Type must be one of the standard port types: XLR, TRS, TR, MINIJACK, MIDI_5PIN, USB_A, USB_B, USB_C, POWER.
    { "id": "audioOut", "type": "TRS" },
    { "id": "midiIn", "type": "MIDI_5PIN" }
  ],
  "svgRender": "<svg viewBox=\"0 0 300 200\" xmlns=\"http://www.w3.org/2000/svg\">...</svg>",
  "imageUrl": ""
}


### Step 2: Create the React Visual Component
The JSON data generated above lives in the root `/devices/` folder. However, the interactive UI must be crafted by hand.

1.  Create a `[device].tsx` file inside `src/devices/`.
2.  Import the JSON definition, extend it with a custom `visual` React function, and export it as a `HardwareBlueprint`.
3.  Register the blueprint inside `src/devices/index.ts` so the `OverviewTab` can load it.

### Step 3: Register in Store Type Definitions
1.  Add the new device id to the `activeMainView` union type inside `src/stores/useUIStore.ts`.
2.  Update the rendering switch block in `src/App.tsx` (around line 150) to render the new device component when active.

---

## 8. How to Add Device-Specific Features
For devices that need deeper interactive editors (like the Behringer Grind manual browser or Arturia MiniFreak control interface):
1.  **Create a View Folder**: Under `src/components/devices/[DeviceName]/` (e.g., `src/components/devices/Grind/`).
2.  **Utilize Hardware Primitives**: Assemble the panel layout using shared tactile UI components under `src/components/Core/HardwareUI/` (e.g., `Knob`, `FunctionButton`, `FunctionPad`).
3.  **PDF Manual Integration**: Place the device manuals (PDF format) under `/devices/[device_name]/doc/`. Name them with the device prefix (e.g., `behringer-grind-manual.pdf`). The `ManualsList` component will automatically pick them up and load them inside the built-in iframe `PdfViewer` on-demand.
4.  **Local State**: If state persistence is needed for control panel inputs, create a separate Zustand store (e.g., `src/stores/useGrindStore.ts`) to isolate state changes.

---

## 9. How to Add General Features
1.  **Modals & UI Elements**: Put new global/reusable modals under `src/components/Core/`.
2.  **Shared UI Primitives**: Put basic elements (input fields, badges, scroll containers) in `src/components/Core/ui/`.
3.  **App Shell Controls**: Put global actions in `src/components/Core/Toolbar/Toolbar.tsx` or `StatusBar/StatusBar.tsx`, and map them in `src/App.tsx`.
4.  **Zustand Updates**: Implement corresponding states and action functions in `useFileSystemStore.ts`, `useAudioStore.ts`, or `useUIStore.ts`.

---

## 10. Developer Guardrails & Rules
When contributing, these rules are **strictly enforced**:
*   **No Native Javascript Popups**: Never use browser-blocking `alert()`, `confirm()`, or `prompt()` dialogues. These freeze the event loop and degrade mobile usage. Always use custom Tailwind modal boxes or Sonner notification popups.
*   **Strict Types**: Never use the `any` type. Build precise interface schemas and type check your work (`pnpm tsc --noEmit`).
*   **No Em-Dashes (`—`)**: Do not use the em-dash (`—`) character in markdown files, UI text, or comments. Use hyphens (`-`) or colons (`:`) instead.
*   **Clear & Clean Comments**: Do not write comments explaining self-evident state mutations. Write comments explaining **why** specific hardware restrictions or complex calculations are implemented.
