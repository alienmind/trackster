# Trackster Developer & Architecture Guidelines

Welcome to the Trackster developer guide. This document serves as a unified reference for human developers and AI models (LLMs) to understand Trackster's architecture, folder layout, design system, and coding workflows.

---

## 1. Overview & Purpose
Trackster is a fully client-side, offline-capable Progressive Web App (PWA) designed for documentation, routing orchestration, and sample management of hybrid DAWless studio setups.
*   **DAWless Routing Overview**: Interactive, gestural vector canvas mapping out physical inputs, outputs, and cabling (audio/MIDI) between device nodes.
*   **Sample Pack Management**: Specifically handles file reordering, heuristic auto-tagging, duplicate analysis, and page assignments for the Novation Circuit Tracks SD card.
*   **Strictly Local**: Zero server-side API dependencies, databases, or cloud sync. All operations (file operations, Web Audio playback, and audio similarity analyses) run locally inside the user's browser.

---

## 2. Technology Stack & Core APIs
*   **Package Manager**: `pnpm` (Strictly `pnpm` - do not use `npm` or `yarn`). All terminal commands, build tests, and package installations MUST use `pnpm` (e.g., `pnpm build`, `pnpm dev`).
*   **Bundler & Dev Server**: Vite.
*   **UI Framework**: React 19.x (using TypeScript 5.x in strict mode).
*   **State Management**: Zustand 5.x (minimal selector-based state subscriptions to prevent excessive React re-renders).
*   **Styling**: Tailwind CSS v4 (responsive utility classes with custom CSS properties for dynamic color page themes).
*   **Browser Storage**: IndexedDB (via `idb-keyval` for cache persistence).
*   **Core Browser APIs**: File System Access API (`window.showDirectoryPicker`), Web Audio API (`AudioContext`), Web Workers (for heavy DSP).

---

## 3. Directory Layout & Architecture
Trackster follows a strictly structured folder configuration:
```
trackster/
├── src/
│   ├── components/
│   │   ├── Core/               # App shell, toolbar, modals, and reusable UI primitives
│   │   │   ├── HardwareUI/     # Reusable front-panel controls (Knobs, Buttons, Pads, etc)
│   │   │   ├── DocumentationDrawer/ # Global sliding drawer for displaying manuals/markdown
│   │   │   ├── ManualsList/    # Sidebar listing available PDF manuals for selected device
│   │   │   ├── DownloadsList/  # Generic list for fetching device-specific files
│   │   │   └── ui/             # Strictly for verbatim shadcn components (do not modify or place custom components here)
│   │   ├── Overview/           # DAWless interactive routing canvas & touch gesture viewport
│   │   └── devices/            # Hardware specific UI implementations
│   │       ├── Circuit/        # Novation Circuit Tracks layout and utility panes
│   │       ├── Grind/          # Behringer Grind interface visualizer
│   │       └── MiniFreak/      # Arturia MiniFreak interface visualizer & controls mapping
│   ├── stores/                 # Zustand state containers (useCircuitTracksStore, useUIStore)
│   ├── hooks/                  # Core utility hooks
│   ├── utils/                  # Pure functions
│   └── workers/                # Background thread for audio analysis feature extraction
├── doc/                        # Device documentation, PDF manuals, and markdown guides
│   ├── circuit/
│   ├── flow8/
│   └── minifreak/
└── downloads/                  # Firmware/software patches available for download
    ├── circuit/
    ├── flow8/
    └── grind/
```

### 3.1 Device Nomenclature & Consistency
Always use the **short keyname** (`circuit`, `flow8`, `s1`, `grind`, `minifreak`) as the authoritative identifier for devices. 
* Use the `deviceId` for directory names (`doc/{deviceId}/`, `downloads/{deviceId}/`).
* Use the `deviceId` for routing and internal state (e.g. `activeMainView === 'flow8'`).
* Intermediate or long names (e.g. "Behringer Flow 8") should only be used as display strings mapped dynamically from standard configurations, never hardcoded as directory names or keys.

---

## 4. Documentation & Downloads Architecture

We employ a unified, global approach to manuals and downloads to prevent fragmenting features across specific devices.

### DocumentationDrawer
* Reuse global components where necessary, do not add device specific components to the global layout.
* All manuals (PDFs) and interactive user guides (Markdown) are loaded into the global `<DocumentationDrawer />` component.
* The drawer state is managed globally in `useUIStore.ts` via `activeDoc`, `activeDocSection`, and `hoveredDocSection`.

### Interactive Hardware Guides
Interactive visualizers (like the Behringer Grind or Arturia Minifreak) allow users to click hardware buttons on screen to pull up the relevant documentation.
* Map hardware components (using `<Knob>`, `<FunctionButton>`, `<DocLink>`, etc.) to specific anchors in the markdown guide by passing a `sectionId` prop.
* When a user hovers over an interactive component, update `useUIStore.getState().setHoveredDocSection(sectionId)`. The hardware UI should visually glow (e.g., a cyan ring) to indicate interactivity.
* When clicked, the global `DocumentationDrawer` will slide in, load the device's markdown document, and scroll to the anchor matching the `sectionId`.

### Downloads
* Place all firmware, drivers, and software utilities inside `downloads/{deviceId}/`.
* In the device's UI, utilize the shared `<DownloadsList deviceId="myDevice" />` component to automatically list and provide download links to those files.

---

## 5. State Management (Zustand)
We split states across domain-focused Zustand stores:
1.  **`useCircuitTracksStore`**: Controls the local folder directories, in-memory sample slots, unassigned lists, rename planning queue, and undo/redo history stacks.
2.  **`useUIStore`**: Holds the global UI navigation state: `activeMainView`, active page index, global documentation state (`activeDoc`, `hoveredDocSection`), and confirmation modals.

### Selector Subscription Pattern
Always subscribe to Zustand state selectors. Never pull the entire store state. This prevents components from re-rendering when unrelated state slices change:
```typescript
// CORRECT: Component only re-renders when this specific slot is updated
const slotSample = useCircuitTracksStore((state) => state.slots[index]?.sample);
```

---

## 6. Layouts & Device-Specific Components
*   **Global App Shell**: `App.tsx` handles top-level routing, switching out the main view based on `activeMainView`. Keep `App.tsx` clean and agnostic.
*   **Device Wrappers**: Any device-specific side panels, toolbars, or utility panes (such as the `CircuitTracksUtilityPane`) **must** be nested inside their respective device layouts (`CircuitTracksLayout.tsx`). Do not pollute the global `App.tsx` layout with conditional renders for specific device components.
*   **ScaleFit Wrapper**: Skeuomorphic UI layouts (detailed SVG hardware renders) are designed at a fixed resolution and wrapped in a `<ScaleFit>` component. This automatically scales the vector panels down to fit smaller tablet or mobile screens perfectly.

---

## 7. Styling & Visual Language
Trackster implements a hardware-centric, high-fidelity dark aesthetic mimicking physical studio units:
*   **Base Palette**: Gunmetal gray panels, vertical linear gradients, and a full-screen CSS noise texture overlay.
*   **Tactile Hardware Elements**: Rubberized pads, LED indicators, pulsing halos, rotary knobs with metallic indices and custom pointer-drag event hooks.

### Button Design Language
We enforce a strict semantic color coding for UI buttons (`src/components/Core/ui/button.tsx`) to avoid visual conflict:
*   **Action (`variant="default"`)**: Primary actions that execute and complete. **Color: Cyan/Blue**.
*   **Positive Action (`variant="success"`)**: Actions that establish connections or confirm state. **Color: Green**.
*   **Secondary Tool (`variant="secondary"`)**: Auxiliary actions. **Color: Neutral Grey**.
*   **State Toggle (`variant="state"`)**: Active/inactive mode or view. Active state is solid white/light grey with black text *(Never blue)*.

---

## 8. How to Add a New Device
1.  **Device Definition**: Create a JSON definition outlining the device's metadata and its inputs/outputs to be used in the routing canvas. Store this JSON inside `devices/[deviceId]/[deviceId].json`. Provide a transparent top-down image as `device.png` in the same directory.
    
    Here is an empty skeleton of the device JSON definition. For complete examples, look at `devices/minifreak/minifreak.json` or `devices/circuit/circuit.json`:
    
    ```json
    {
      "id": "short_device_id",
      "longName": "Manufacturer Device Name",
      "brand": "Manufacturer",
      "model": "Device Name",
      "tagline": "SYNTH",
      "width": 300,
      "theme": { 
        "border": "border-t-cyan-500", 
        "header": "bg-neutral-900", 
        "title": "text-white", 
        "badge": "bg-neutral-800 text-neutral-400" 
      },
      "ports": [
        { "id": "audioOut", "type": "TRS" },
        { "id": "midiIn", "type": "MIDI_5PIN" }
      ]
    }
    ```
2.  **Interactive Layout**: Create a `[device].tsx` layout inside `src/components/devices/[deviceId]/`.
3.  **Documentation**: Add the device's PDF manual and markdown interactive guide to `doc/[deviceId]/`.
4.  **Hardware UI Mapping**: Assemble the panel layout using shared tactile UI components under `src/components/Core/HardwareUI/`. Wrap sections in `<DocLink sectionId="...">` or assign `sectionId` directly to knobs/pads to hook into the global `DocumentationDrawer`.
5.  **Downloads**: Place related software/firmware in `downloads/[deviceId]/` and expose it via `<DownloadsList deviceId="[deviceId]" />`.
6.  **Routing**: Add the `deviceId` to the `activeMainView` union type inside `src/stores/useUIStore.ts` and add the component to the render switch block in `src/App.tsx`.

---

## 9. Developer Guardrails & Rules
When contributing, these rules are **strictly enforced**:
*   **No Native Javascript Popups**: Never use browser-blocking `alert()`, `confirm()`, or `prompt()` dialogues. These freeze the event loop and degrade mobile usage. Always use custom Tailwind modal boxes.
*   **Strict Types**: Never use the `any` type. Build precise interface schemas and type check your work (`pnpm tsc --noEmit`).
*   **No Em-Dashes (`—`)**: Do not use the em-dash (`—`) character in markdown files, UI text, or comments. Use hyphens (`-`) or colons (`:`) instead.
*   **Clean Architecture**: Ensure documentation and download paths respect the `deviceId` consistency rules, and avoid device-specific UI components in the global layout.
*   **UI Component Separation**: The `src/components/Core/ui` directory is strictly reserved for verbatim shadcn/ui components. Do not modify these components or place custom UI components here. Any custom components (e.g., `DeviceUtilityDrawer`, `SidebarSection`) must be placed in their own dedicated folders under `src/components/Core/` or appropriate directories.
*   **Command Execution**: When testing the build, running linting, or starting a dev server, you MUST use `pnpm` (e.g., `pnpm build`). Never run `npm run build` or `npm install`.
