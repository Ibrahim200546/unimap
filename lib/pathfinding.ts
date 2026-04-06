import type { Room, FloorData } from "./building-data";

interface Point {
  x: number;
  y: number;
}

/**
 * Builds a route from `start` point to `end` room center
 * going through corridors on the given floor.
 * Uses a simple waypoint-based approach through the corridor system.
 */
export function buildRoute(
  floor: FloorData,
  start: Point,
  endRoom: Room
): { path: Point[]; distance: number } {
  const endCenter: Point = {
    x: endRoom.x + endRoom.width / 2,
    y: endRoom.y + endRoom.height / 2,
  };

  // Get corridor centers as navigation waypoints
  const corridorCenters = floor.corridors.map((c) => ({
    x: c.x + c.width / 2,
    y: c.y + c.height / 2,
  }));

  // Find nearest corridor entry point from start
  const startCorridorEntry = findNearestCorridorPoint(floor, start);
  // Find nearest corridor entry point from end room
  const endCorridorEntry = findNearestCorridorPoint(floor, endCenter);

  // Build the path: start -> corridor entry -> corridor waypoints -> corridor exit -> end
  const path: Point[] = [start];

  if (startCorridorEntry) {
    // Snap to corridor edge nearest to start
    path.push(startCorridorEntry);
  }

  // Add corridor centers that are between start and end
  const relevantCorridors = getRelevantCorridorPath(
    corridorCenters,
    startCorridorEntry || start,
    endCorridorEntry || endCenter
  );
  path.push(...relevantCorridors);

  if (endCorridorEntry) {
    path.push(endCorridorEntry);
  }

  path.push(endCenter);

  // Simplify by removing duplicate close points
  const simplified = simplifyPath(path);

  const distance = calculatePathDistance(simplified);

  return { path: simplified, distance };
}

function findNearestCorridorPoint(
  floor: FloorData,
  point: Point
): Point | null {
  let nearest: Point | null = null;
  let minDist = Infinity;

  for (const corridor of floor.corridors) {
    // Clamp point to corridor bounds
    const cx = Math.max(corridor.x, Math.min(point.x, corridor.x + corridor.width));
    const cy = Math.max(corridor.y, Math.min(point.y, corridor.y + corridor.height));
    const d = dist(point, { x: cx, y: cy });
    if (d < minDist) {
      minDist = d;
      nearest = { x: cx, y: cy };
    }
  }

  return nearest;
}

function getRelevantCorridorPath(
  centers: Point[],
  _from: Point,
  _to: Point
): Point[] {
  // For a simple corridor layout, sort by distance from start to end
  if (centers.length <= 1) return centers;
  return [...centers].sort(
    (a, b) => dist(a, _from) - dist(b, _from)
  );
}

function simplifyPath(path: Point[]): Point[] {
  if (path.length <= 2) return path;
  const result: Point[] = [path[0]];
  for (let i = 1; i < path.length; i++) {
    const prev = result[result.length - 1];
    if (dist(prev, path[i]) > 5) {
      result.push(path[i]);
    }
  }
  return result;
}

function calculatePathDistance(path: Point[]): number {
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    total += dist(path[i - 1], path[i]);
  }
  return total;
}

function dist(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/**
 * Convert pixel distance to approximate walking meters
 * (1 grid pixel ~ 0.15m in our scale)
 */
export function pixelsToMeters(px: number): number {
  return px * 0.15;
}

/**
 * Estimate walking time in minutes (average speed ~1.2 m/s indoor)
 */
export function estimateWalkingTime(meters: number): number {
  return meters / 1.2 / 60;
}
