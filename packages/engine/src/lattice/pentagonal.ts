import { PHI } from '../schema/plan';
import { CANVAS_SIZE, type Lattice, type Pt } from './types';

/**
 * Pentagonal lattice.
 *
 * Center C at canvas center; rings k = 0..depth with radius r_k = 400·φ^−k.
 * Addresses:
 *   C        — center
 *   P{k}.{v} — ring-k pentagon vertex v (v = 0..4), v0 at 12 o'clock, 72° apart
 *   X{k}.{v} — ring-k pentagram self-intersection v (radius r_k·φ^−2, rotated 36°)
 */
export function buildPentagonal(depth: number): Lattice {
  const c: Pt = { x: CANVAS_SIZE / 2, y: CANVAS_SIZE / 2 };
  const R0 = 400;

  const points = new Map<string, Pt>();
  const lines: Lattice['lines'] = [];

  points.set('C', c);

  for (let k = 0; k <= depth; k++) {
    const r = R0 * Math.pow(PHI, -k);
    const verts: Pt[] = [];
    for (let v = 0; v < 5; v++) {
      const a = (-90 + v * 72) * (Math.PI / 180);
      const p = { x: c.x + r * Math.cos(a), y: c.y + r * Math.sin(a) };
      points.set(`P${k}.${v}`, p);
      verts.push(p);
    }
    const rx = r * Math.pow(PHI, -2);
    for (let v = 0; v < 5; v++) {
      const a = (-90 + 36 + v * 72) * (Math.PI / 180);
      points.set(`X${k}.${v}`, { x: c.x + rx * Math.cos(a), y: c.y + rx * Math.sin(a) });
    }
    // display: pentagon edges + pentagram chords of ring k
    for (let v = 0; v < 5; v++) {
      const a = verts[v]!;
      const b = verts[(v + 1) % 5]!;
      const d = verts[(v + 2) % 5]!;
      lines.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, level: k });
      lines.push({ x1: a.x, y1: a.y, x2: d.x, y2: d.y, level: k });
    }
  }

  return {
    kind: 'pentagonal',
    depth,
    size: CANVAS_SIZE,
    points,
    cells: new Map(),
    lines,
    rects: [],
  };
}
