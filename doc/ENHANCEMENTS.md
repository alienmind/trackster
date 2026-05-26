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
- **3.6** Responsive pass: 2x8 collapses to 4x4 below 640px; panes become tabs.
- **3.7** Compact mode verified at 1366x768.
- **3.8** Accessibility: WCAG AA contrast for text and focus rings.

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
