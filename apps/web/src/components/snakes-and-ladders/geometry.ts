/** Board positions in square widths: the board is 10 by 10, with (0, 0) at the top left. */
export interface Point {
  x: number;
  y: number;
}

/** The center of a square. Square 1 is bottom left, and rows go back and forth. */
export function centerOf(square: number): Point {
  const rowFromBottom = Math.floor((square - 1) / 10);
  const along = (square - 1) % 10;
  const col = rowFromBottom % 2 === 0 ? along : 9 - along;
  return { x: col + 0.5, y: 9 - rowFromBottom + 0.5 };
}

/** Snakes whose first bend goes the other way. Worked out so that no two snakes on this board cross. */
const BENT_THE_OTHER_WAY = new Set([93]);

/** Points along a snake from its head to its tail, waving side to side. */
export function snakePoints(head: number, tail: number, count = 28): Point[] {
  const h = centerOf(head);
  const t = centerOf(tail);
  const [vx, vy] = [t.x - h.x, t.y - h.y];
  const length = Math.hypot(vx, vy);
  const [nx, ny] = [-vy / length, vx / length];
  // Longer snakes bend more times. Whole half waves mean both ends sit on their square's center.
  const halfWaves = Math.max(2, Math.round(length / 1.5));
  const amplitude = Math.min(0.42, 0.22 + length * 0.03);
  const side = BENT_THE_OTHER_WAY.has(head) ? 1 : -1;
  return Array.from({ length: count + 1 }, (_, i) => {
    const along = i / count;
    const offset = side * amplitude * Math.sin(Math.PI * halfWaves * along);
    return { x: h.x + vx * along + nx * offset, y: h.y + vy * along + ny * offset };
  });
}

/** The point a share of the way along a path, measured by distance. */
export function pointAlong(points: readonly Point[], share: number): Point {
  const lengths = points.slice(1).map((p, i) => Math.hypot(p.x - points[i].x, p.y - points[i].y));
  let left = Math.max(0, Math.min(1, share)) * lengths.reduce((sum, length) => sum + length, 0);
  for (let i = 0; i < lengths.length; i++) {
    if (left <= lengths[i] || i === lengths.length - 1) {
      const part = lengths[i] === 0 ? 0 : Math.min(1, left / lengths[i]);
      const [a, b] = [points[i], points[i + 1]];
      return { x: a.x + (b.x - a.x) * part, y: a.y + (b.y - a.y) * part };
    }
    left -= lengths[i];
  }
  return points[0];
}
