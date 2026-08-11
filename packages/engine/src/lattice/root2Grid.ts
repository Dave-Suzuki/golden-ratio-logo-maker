import { ROOT2 } from '../schema/plan';
import { CANVAS_SIZE, type Lattice, type Pt, type Rect } from './types';

/**
 * √2 modular grid (大和比 / A-series proportion).
 *
 * The construction rect is an A-series rectangle (W = 1000, H = 1000/√2), vertically
 * centered. Recursive halving of the long side to `depth` levels — the same operation
 * that turns A4 into A5 — yields a lattice of split lines.
 *
 * Addresses:
 *   G{i}.{j} — intersection of the i-th vertical and j-th horizontal line
 *              (0-indexed, including the rect edges, sorted ascending)
 * Cells:
 *   C{i}.{j} — the cell to the lower-right of G{i}.{j}
 */
export function buildRoot2Grid(depth: number): Lattice {
  const W = CANVAS_SIZE;
  const H = CANVAS_SIZE / ROOT2;
  const y0 = (CANVAS_SIZE - H) / 2;
  const root: Rect = { x: 0, y: y0, w: W, h: H };

  const xSet = new Map<number, number>(); // coord -> level
  const ySet = new Map<number, number>();
  const addX = (x: number, level: number) => {
    const key = Number(x.toFixed(6));
    if (!xSet.has(key)) xSet.set(key, level);
  };
  const addY = (y: number, level: number) => {
    const key = Number(y.toFixed(6));
    if (!ySet.has(key)) ySet.set(key, level);
  };
  addX(root.x, 0);
  addX(root.x + root.w, 0);
  addY(root.y, 0);
  addY(root.y + root.h, 0);

  const split = (r: Rect, level: number) => {
    if (level > depth) return;
    if (r.w >= r.h) {
      const mx = r.x + r.w / 2;
      addX(mx, level);
      split({ x: r.x, y: r.y, w: r.w / 2, h: r.h }, level + 1);
      split({ x: mx, y: r.y, w: r.w / 2, h: r.h }, level + 1);
    } else {
      const my = r.y + r.h / 2;
      addY(my, level);
      split({ x: r.x, y: r.y, w: r.w, h: r.h / 2 }, level + 1);
      split({ x: r.x, y: my, w: r.w, h: r.h / 2 }, level + 1);
    }
  };
  split(root, 1);

  const xs = [...xSet.entries()].sort((a, b) => a[0] - b[0]);
  const ys = [...ySet.entries()].sort((a, b) => a[0] - b[0]);

  const points = new Map<string, Pt>();
  const cells = new Map<string, Rect>();
  const lines: Lattice['lines'] = [];

  xs.forEach(([x, level], i) => {
    if (level > 0) lines.push({ x1: x, y1: root.y, x2: x, y2: root.y + root.h, level });
    ys.forEach(([y], j) => {
      points.set(`G${i}.${j}`, { x, y });
    });
  });
  ys.forEach(([y, level]) => {
    if (level > 0) lines.push({ x1: root.x, y1: y, x2: root.x + root.w, y2: y, level });
  });
  for (let i = 0; i < xs.length - 1; i++) {
    for (let j = 0; j < ys.length - 1; j++) {
      cells.set(`C${i}.${j}`, {
        x: xs[i]![0],
        y: ys[j]![0],
        w: xs[i + 1]![0] - xs[i]![0],
        h: ys[j + 1]![0] - ys[j]![0],
      });
    }
  }

  return {
    kind: 'root2_grid',
    depth,
    size: CANVAS_SIZE,
    points,
    cells,
    lines,
    rects: [{ ...root, label: 'A-series rect 1 : √2', level: 0 }],
  };
}
