# Trackster Overview System Architecture

The Overview screen provides a dynamic, grid-based routing diagram of your studio setup. It has been entirely rebuilt to ensure legibility, prevent overlaps, and offer a premium, organized view of the hardware layout.

## Core Requirements & Specifications

The following specifications govern the Overview's behavior, based on direct design requirements:

### 1. Grid-Based Layout & Viewport Scaling
- **Strict Grid System**: Devices are placed on discrete `(gridX, gridY)` integer coordinates to eliminate messy overlapping and manual alignment. Each device occupies exactly one cell, with consistent margins on all sides.
- **No Scrollbars**: The viewport relies on pure scaling to fit the grid. The container calculates the total grid dimensions (`CELL_W` and `CELL_H` plus `MARGIN`) and applies a CSS `transform: scale(zoom)` centered perfectly in the available space.
- **Discrete Zoom Levels**: Users can zoom in/out (changing the grid size from 3x3 to 4x4, etc.) via `Ctrl + Scroll` or the sidebar buttons.
- **Minimum Grid Size**: The system actively prevents zooming in past the point where devices would be hidden. The grid is locked to a minimum dimension of `ceil(sqrt(deviceCount))`.

### 2. Device Representation & Interaction
- **Scalable Visuals**: Devices render either using raster images (`device.png`) or native React/SVG components via the blueprint's `visual()` function. The container automatically applies a `scale()` transform so complex SVG dashboards (like the Circuit Tracks) perfectly fit the bounds without cropping.
- **Split Click Targets**: 
  - Clicking the **Header** (device name/brand) selects the device and slides out the properties pane.
  - Clicking the **Body/Picture** navigates the user directly to the device's dedicated application view.

### 3. Drag, Drop, and Live Preview
Users can rearrange the layout by dragging and dropping devices onto other grid cells.
- **Stable Drop Zones**: HTML5 drag-and-drop often fails when the DOM element under the cursor moves. To solve this, Trackster renders an invisible `z-30` grid of "Drop Zones" that sit over the physical nodes during a drag but never move themselves.
- **Live State Interception**: While dragging over a drop zone, a `previewNodes` state is dynamically generated. This state temporally swaps the coordinates of the `draggedNode` and the `dragHoverNode`. 
- **Real-Time Visual Feedback**: The visual device cards instantly read from `previewNodes`. When hovering over a drop zone, the target device gracefully moves out of the way (highlighted in cyan), and the dragged device snaps into its new position—complete with smooth CSS transition animations.

### 4. Intelligent Cable Routing
Cables between devices never intersect the device bodies and always route cleanly around them.
- **Edge Anchoring**: Cables connect perfectly flush to the absolute center of a device's edge.
- **4-Sided Smart Anchoring (`bestSide`)**: The system calculates the relative `dx` and `dy` between the source and target device to pick the optimal face. Devices stacked vertically connect top-to-bottom. Devices side-by-side connect left-to-right. Diagonals prefer the axis with the larger delta.
- **The Routing Grid (2N+1)**: To route cables *around* devices, we project the N×N device grid into a `(2N+1) x (2N+1)` routing grid. Odd coordinates represent the solid device cells (obstacles), and even coordinates represent the empty "margin lanes".
- **A* Pathfinding**: The `findPath` algorithm navigates through the margin lanes to find the shortest rectilinear route.
- **Live Re-Routing**: Because the path generation hooks into the `previewNodes` state, cables instantly animate and re-route themselves *while* you drag a device around the grid.

### 5. Properties Sidebar & Connection Editor
- **Smooth Animations**: The left sidebar properties menu animates smoothly in and out. It retains the `activeNodeId` internally even after being deselected, ensuring the CSS slide-out transition completes properly before the component unmounts.
- **Connection Management**: The sidebar provides a full connection editor for the selected device. It displays incoming and outgoing cables using HTML `<select>` dropdowns to change the target device and the physical cable type. Users can also add new connections or delete existing ones.
- **Centralized Cable Types**: The specific standards for physical cables (e.g., `audio_trs`, `midi_din`) and their corresponding render colors are strictly defined in `src/devices/cables.ts`. When a user changes a cable type in the sidebar, the routing path on the canvas instantly updates its color to match the standard.
