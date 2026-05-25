# Trackster - Circuit Tracks PCM Manager

A browser-based, offline-capable Progressive Web App for managing sample packs for the **Novation Circuit Tracks** groovebox.

## What It Does

The Circuit Tracks uses a strict `00_` - `63_` filename prefix convention to map `.wav` files to its 64 sample pads across 4 pages. **Trackster** gives you a visual, hardware-mirrored interface to audition, re-order, auto-tag, and batch-rename those files - all without leaving your browser or uploading anything to a server.

## Key Features

- **Hardware-Mirrored Grid** - 4-page, 2×8 pad layout matching the Circuit Tracks' physical interface, with per-page color theming (Orange -> Yellow -> Purple -> Aqua).
- **Drag & Drop Resequencing** - Rearrange pads visually; file renaming is computed but only written on explicit "Commit".
- **Instant Audition** - Click any pad to hear the sample via an inline waveform visualizer.
- **Magic Sort** - One-click auto-arrangement that scans filenames, infers instrument categories (kicks, snares, hats, FX…), and sorts them into the correct hardware pages.
- **Duplicate Detection** - Client-side audio fingerprinting flags perceptually similar samples so you don't waste pad slots.
- **Fully Offline** - PWA with service worker caching. Zero network traffic for audio files.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Vite + React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| State | Zustand |
| Drag & Drop | @dnd-kit |
| Audio Viz | wavesurfer.js v7 |
| Audio DSP | Meyda (via Web Worker) |
| PWA | vite-plugin-pwa |

## Getting Started

```bash
npm install
npm run dev
```

Requires a Chromium-based browser (Chrome, Edge, Arc, Brave) for the File System Access API.

## Documentation

- [Design Document](doc/DESIGN.md) - Architecture, business logic, and UX specification.
- [Detailed Design](doc/DETAILED_DESIGN.md) - Folder structure, type definitions, component contracts, and implementation guide.

## License

MIT
