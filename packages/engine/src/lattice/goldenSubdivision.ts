import { PHI } from '../schema/plan';
import { CANVAS_SIZE, type Lattice, type Pt, type Rect } from './types';

/**
 * Golden-subdivision lattice.
 *
 * The construction rect is a golden rectangle (W = 1000, H = 1000/φ), vertically
 * centered on the canvas. Classic spiral subdivision: square Q1 splits off the left,
 * the remainder is again a golden rectangle; Q2 splits off its top; clockwise spiral
 * to `depth` squares.
 *
 * Addresses:
 *   L0.{0..8}  — 3×3 anchor grid of the full golden rect (row-major, 4 = center)
 *   Lk.{0..8}  — 3×3 anchor grid of square Qk (k = 1..depth)
 *   F          — the spiral focus (intersection of the first two remainder diagonals)
 * Cells:
 *   R0         — the full golden rect
 *   Qk         — square k
 *
 * A circle at Lk.4 with radius step −(k−1) inscribes square Qk exactly:
 * side(Qk) = H·φ^−(k−1) and r₀ = H/2 — the φ circle chain falls out of the lattice.
 */
export function buildGoldenSubdivision(depth: number): Lattice {
  const W = CANVAS_SIZE;
  const H = CANVAS_SIZE / PHI;
  const y0 = (CANVAS_SIZE - H) / 2;

  const points = new Map<string, Pt>();
  const cells = new Map<string, Rect>();
  const lines: Lattice['lines'] = [];
  const rects: Lattice['rects'] = [];

  const addAnchors = (key: string, r: Rect) => {
    const xs = [r.x, r.x + r.w / 2, r.x + r.w];
    const ys = [r.y, r.y + r.h / 2, r.y + r.h];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        points.set(`${key}.${row * 3 + col}`, { x: xs[col]!, y: ys[row]! });
      }
    }
  };

  const root: Rect = { x: 0, y: y0, w: W, h: H };
  addAnchors('L0', root);
  cells.set('R0', root);
  rects.push({ ...root, label: 'golden rect 1 : φ', level: 0 });

  // Spiral subdivision. Cut side cycles clockwise: left, top, right, bottom.
  let rem: Rect = { ...root };
  const squares: Rect[] = [];
  const spiralSegs: string[] = [];

  for (let k = 1; k <= depth; k++) {
    const dir = (k - 1) % 4;
    let sq: Rect;
    if (dir === 0) {
      sq = { x: rem.x, y: rem.y, w: rem.h, h: rem.h };
      rem = { x: rem.x + rem.h, y: rem.y, w: rem.w - rem.h, h: rem.h };
      lines.push({ x1: sq.x + sq.w, y1: sq.y, x2: sq.x + sq.w, y2: sq.y + sq.h, level: k });
      // quarter arc: from top-left of square to bottom-right, centered at bottom-left+w? —
      // spiral arc for a left-cut square sweeps from its top-right to its bottom-left? No:
      // classic spiral passes corner-to-corner; center is the corner shared with the remainder.
      spiralSegs.push(arcSeg({ x: sq.x, y: sq.y }, { x: sq.x + sq.w, y: sq.y + sq.h }, sq.w, k === 1));
    } else if (dir === 1) {
      sq = { x: rem.x, y: rem.y, w: rem.w, h: rem.w };
      rem = { x: rem.x, y: rem.y + rem.w, w: rem.w, h: rem.h - rem.w };
      lines.push({ x1: sq.x, y1: sq.y + sq.h, x2: sq.x + sq.w, y2: sq.y + sq.h, level: k });
      spiralSegs.push(arcSeg({ x: sq.x + sq.w, y: sq.y }, { x: sq.x, y: sq.y + sq.h }, sq.w, false));
    } else if (dir === 2) {
      sq = { x: rem.x + rem.w - rem.h, y: rem.y, w: rem.h, h: rem.h };
      rem = { x: rem.x, y: rem.y, w: rem.w - rem.h, h: rem.h };
      lines.push({ x1: sq.x, y1: sq.y, x2: sq.x, y2: sq.y + sq.h, level: k });
      spiralSegs.push(arcSeg({ x: sq.x + sq.w, y: sq.y + sq.h }, { x: sq.x, y: sq.y }, sq.w, false));
    } else {
      sq = { x: rem.x, y: rem.y + rem.h - rem.w, w: rem.w, h: rem.w };
      rem = { x: rem.x, y: rem.y, w: rem.w, h: rem.h - rem.w };
      lines.push({ x1: sq.x, y1: sq.y, x2: sq.x + sq.w, y2: sq.y, level: k });
      spiralSegs.push(arcSeg({ x: sq.x, y: sq.y + sq.h }, { x: sq.x + sq.w, y: sq.y }, sq.w, false));
    }
    squares.push(sq);
    addAnchors(`L${k}`, sq);
    cells.set(`Q${k}`, sq);
    rects.push({ ...sq, label: `Q${k} · side = H·φ^−${k - 1}`, level: k });
  }

  // Spiral focus F: intersection of the root rect's diagonal and the first remainder's diagonal.
  const r1: Rect = { x: root.x + H, y: root.y, w: W - H, h: H };
  const F = lineIntersect(
    { x: root.x, y: root.y },
    { x: root.x + root.w, y: root.y + root.h },
    { x: r1.x + r1.w, y: r1.y },
    { x: r1.x, y: r1.y + r1.h },
  );
  points.set('F', F);

  return {
    kind: 'golden_subdivision',
    depth,
    size: CANVAS_SIZE,
    points,
    cells,
    lines,
    rects,
    spiralPath: spiralSegs.join(' '),
  };
}

function arcSeg(from: Pt, to: Pt, r: number, isFirst: boolean): string {
  const move = isFirst ? `M ${fmt(from.x)} ${fmt(from.y)} ` : '';
  return `${move}A ${fmt(r)} ${fmt(r)} 0 0 1 ${fmt(to.x)} ${fmt(to.y)}`;
}

function fmt(n: number): string {
  return Number(n.toFixed(3)).toString();
}

function lineIntersect(a1: Pt, a2: Pt, b1: Pt, b2: Pt): Pt {
  const d1 = { x: a2.x - a1.x, y: a2.y - a1.y };
  const d2 = { x: b2.x - b1.x, y: b2.y - b1.y };
  const denom = d1.x * d2.y - d1.y * d2.x;
  const t = ((b1.x - a1.x) * d2.y - (b1.y - a1.y) * d2.x) / denom;
  return { x: a1.x + t * d1.x, y: a1.y + t * d1.y };
}
