export interface Point {
  x: number;
  y: number;
}

export interface GridPoint {
  rx: number;
  ry: number;
}

function heuristic(a: GridPoint, b: GridPoint) {
  return Math.abs(a.rx - b.rx) + Math.abs(a.ry - b.ry);
}

/**
 * A* pathfinding on the 2N+1 routing grid.
 * Even indices = margin lanes, Odd indices = device cell centers.
 * Cells where both rx and ry are odd are device obstacles (blocked).
 */
export function findPath(
  start: GridPoint,
  end: GridPoint,
  gridCols: number,
  gridRows: number
): GridPoint[] | null {
  const startStr = `${start.rx},${start.ry}`;
  const endStr = `${end.rx},${end.ry}`;
  
  if (startStr === endStr) return [start];

  const openSet: GridPoint[] = [start];
  const cameFrom = new Map<string, GridPoint>();
  const gScore = new Map<string, number>();
  gScore.set(startStr, 0);
  
  const fScore = new Map<string, number>();
  fScore.set(startStr, heuristic(start, end));

  while (openSet.length > 0) {
    openSet.sort((a, b) => {
      const fa = fScore.get(`${a.rx},${a.ry}`) ?? Infinity;
      const fb = fScore.get(`${b.rx},${b.ry}`) ?? Infinity;
      return fa - fb;
    });

    const current = openSet.shift()!;
    const currentStr = `${current.rx},${current.ry}`;
    
    if (currentStr === endStr) {
      const path: GridPoint[] = [current];
      let cs = currentStr;
      while (cameFrom.has(cs)) {
        const prev = cameFrom.get(cs)!;
        path.unshift(prev);
        cs = `${prev.rx},${prev.ry}`;
      }
      return path;
    }

    const neighbors = [
      { rx: current.rx + 1, ry: current.ry },
      { rx: current.rx - 1, ry: current.ry },
      { rx: current.rx, ry: current.ry + 1 },
      { rx: current.rx, ry: current.ry - 1 },
    ];

    for (const neighbor of neighbors) {
      // Bounds: allow routing in the margin around the outermost cells too
      if (neighbor.rx < 0 || neighbor.rx > gridCols * 2 || neighbor.ry < 0 || neighbor.ry > gridRows * 2) {
        continue;
      }
      // Block: cells where both rx and ry are odd are device interiors
      if (neighbor.rx % 2 === 1 && neighbor.ry % 2 === 1) {
        continue;
      }

      const neighborStr = `${neighbor.rx},${neighbor.ry}`;
      const tentativeGScore = (gScore.get(currentStr) ?? Infinity) + 1;

      if (tentativeGScore < (gScore.get(neighborStr) ?? Infinity)) {
        cameFrom.set(neighborStr, current);
        gScore.set(neighborStr, tentativeGScore);
        fScore.set(neighborStr, tentativeGScore + heuristic(neighbor, end));
        if (!openSet.some(p => p.rx === neighbor.rx && p.ry === neighbor.ry)) {
          openSet.push(neighbor);
        }
      }
    }
  }

  return null;
}

/**
 * Convert a routing grid coordinate to a physical pixel position.
 * 
 * The layout is: [margin] [cell] [margin] [cell] [margin] ...
 * 
 * For even r (margin lane): center of that margin gap
 * For odd r (cell center): center of that cell
 */
export function getPhysicalCoordinate(rx: number, ry: number, cellW: number, cellH: number, margin: number): Point {
  const getPos = (r: number, cellSize: number) => {
    // Each "unit" alternates: margin, cell, margin, cell...
    // r=0 -> first margin center
    // r=1 -> first cell center
    // r=2 -> second margin center
    // r=3 -> second cell center
    // etc.
    const cellIndex = Math.floor(r / 2);
    if (r % 2 === 0) {
      // Margin lane: position is at cellIndex * (cellSize + margin) + margin/2
      return cellIndex * (cellSize + margin) + margin / 2;
    } else {
      // Cell center: position is at margin + cellIndex * (cellSize + margin) + cellSize/2
      return margin + cellIndex * (cellSize + margin) + cellSize / 2;
    }
  };
  return {
    x: getPos(rx, cellW),
    y: getPos(ry, cellH)
  };
}

/**
 * Get the physical anchor point on the edge of a device cell.
 * This is where a cable visually connects to the device.
 */
export function getEdgeAnchor(
  gridX: number, gridY: number,
  side: 'left' | 'right' | 'top' | 'bottom',
  cellW: number, cellH: number, margin: number
): Point {
  const cellLeft = margin + gridX * (cellW + margin);
  const cellTop = margin + gridY * (cellH + margin);
  const centerX = cellLeft + cellW / 2;
  const centerY = cellTop + cellH / 2;

  switch (side) {
    case 'left':   return { x: cellLeft, y: centerY };
    case 'right':  return { x: cellLeft + cellW, y: centerY };
    case 'top':    return { x: centerX, y: cellTop };
    case 'bottom': return { x: centerX, y: cellTop + cellH };
  }
}

/**
 * Determine which side of the source/target device to use for the cable anchor,
 * based on the relative grid positions of the two devices.
 */
export function bestSide(
  srcX: number, srcY: number,
  tgtX: number, tgtY: number
): { sourceSide: 'left' | 'right' | 'top' | 'bottom'; targetSide: 'left' | 'right' | 'top' | 'bottom' } {
  const dx = tgtX - srcX;
  const dy = tgtY - srcY;

  // If they're in the same column, use top/bottom
  if (dx === 0) {
    if (dy > 0) return { sourceSide: 'bottom', targetSide: 'top' };
    return { sourceSide: 'top', targetSide: 'bottom' };
  }
  // If they're in the same row, use left/right
  if (dy === 0) {
    if (dx > 0) return { sourceSide: 'right', targetSide: 'left' };
    return { sourceSide: 'left', targetSide: 'right' };
  }
  // Diagonal: prefer the axis with the larger delta
  if (Math.abs(dx) >= Math.abs(dy)) {
    if (dx > 0) return { sourceSide: 'right', targetSide: 'left' };
    return { sourceSide: 'left', targetSide: 'right' };
  } else {
    if (dy > 0) return { sourceSide: 'bottom', targetSide: 'top' };
    return { sourceSide: 'top', targetSide: 'bottom' };
  }
}

/**
 * Get the routing grid point for a device edge.
 * This is the margin lane adjacent to the device on the given side.
 */
export function getRoutingGridPoint(gridX: number, gridY: number, side: 'left' | 'right' | 'top' | 'bottom'): GridPoint {
  // Device at (gridX, gridY) occupies routing cell (2*gridX+1, 2*gridY+1)
  // Its edges are at:
  //   left:   rx = 2*gridX,     ry = 2*gridY+1
  //   right:  rx = 2*gridX+2,   ry = 2*gridY+1
  //   top:    rx = 2*gridX+1,   ry = 2*gridY
  //   bottom: rx = 2*gridX+1,   ry = 2*gridY+2
  switch (side) {
    case 'left':   return { rx: 2 * gridX,     ry: 2 * gridY + 1 };
    case 'right':  return { rx: 2 * gridX + 2, ry: 2 * gridY + 1 };
    case 'top':    return { rx: 2 * gridX + 1, ry: 2 * gridY };
    case 'bottom': return { rx: 2 * gridX + 1, ry: 2 * gridY + 2 };
  }
}

export function roundedPathFromPoints(points: Point[], radius: number = 10): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0]!.x} ${points[0]!.y}`;

  let d = `M ${points[0]!.x} ${points[0]!.y}`;

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1]!;
    const curr = points[i]!;
    const next = points[i + 1]!;

    const dir1 = {
      x: Math.sign(prev.x - curr.x),
      y: Math.sign(prev.y - curr.y)
    };
    const dir2 = {
      x: Math.sign(next.x - curr.x),
      y: Math.sign(next.y - curr.y)
    };

    // If points are collinear, no curve needed
    if ((dir1.x === 0 && dir2.x === 0) || (dir1.y === 0 && dir2.y === 0)) {
      d += ` L ${curr.x} ${curr.y}`;
      continue;
    }

    const dist1 = Math.hypot(prev.x - curr.x, prev.y - curr.y);
    const dist2 = Math.hypot(next.x - curr.x, next.y - curr.y);
    
    const actualRadius = Math.min(radius, dist1 / 2, dist2 / 2);

    const p1 = {
      x: curr.x + dir1.x * actualRadius,
      y: curr.y + dir1.y * actualRadius
    };
    const p2 = {
      x: curr.x + dir2.x * actualRadius,
      y: curr.y + dir2.y * actualRadius
    };

    d += ` L ${p1.x} ${p1.y} Q ${curr.x} ${curr.y} ${p2.x} ${p2.y}`;
  }

  const last = points[points.length - 1]!;
  d += ` L ${last.x} ${last.y}`;

  return d;
}
