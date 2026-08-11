import { buildLattice } from '@kiwari/engine';

/**
 * The ConstructionPlan DSL spec given to the planner model. The legal address
 * vocabulary is generated from the actual lattices so the model can only be
 * told the truth; the validator rejects anything else anyway.
 */
export function dslSpec(): string {
  return `You emit ConstructionPlan JSON — a geometry program executed by a deterministic engine.
You are a PLANNER, never a renderer. Every mark you plan is built from:

- elements: circle {id, at, r:{step}}, arc {id, at, r:{step}, startAngle, sweep},
  line {id, from, to}, polygon {id, at, r:{step}, sides: 3|4|5|6, pointUp},
  rect {id, cell}
- composite: boolean ops {op: unite|subtract|intersect, of, by, as} — operands must be
  already-defined ids; each result gets a new id via "as"
- transforms: {kind: rotate, targets, angle, about} | {kind: mirror, targets, axis} |
  {kind: ring, target, count: 2-6, angle, about} (ring = rotational repetition)
- style: {strokeStep: -6..-1 or null, render: stroke|fill|mixed}
  (mixed strokes open paths — arcs, lines — and fills closed shapes)
- optical: {enabled, corrections: [{target, dx, dy, scale, reason}]} — small labeled
  deviations from the math, each with a stated reason; |dx|,|dy| ≤ 100, scale 0.95-1.05

HARD CONSTRAINTS (the validator rejects violations):
- Every radius is r₀·ratio^step with integer step in [-6, 2]. You never give absolute sizes.
- Every position is a lattice address from the vocabulary below. Nothing is placed freehand.
- Rotation angles are exactly ±137.5, ±72, ±90, ±60. Arbitrary rotation is rejected.
- Arc startAngle ∈ {0,45,60,72,90,120,135,137.5,144,180,216,225,270,315}, sweep ∈ {60,72,90,120,137.5,144,180,216,270,300}.
- Max 12 elements, max 8 composite ops. Element ids and composite "as" ids must all be unique.
- canvas.size is always 1000. canvas.lattice must match the family:
  phi_circle_chain, golden_rect_subdivision → golden_subdivision;
  pentagonal → pentagonal; root2_grid → root2_grid. canvas.depth ∈ [2, 6].
- strokeStep is required (non-null) when render is "stroke" or "mixed"; null when "fill".

${addressVocabulary()}

DESIGN GUIDANCE:
- 2-4 elements and one or two boolean ops usually beat complexity. Subtraction (counterforms)
  and rotational repetition are the strongest moves.
- The φ circle chain: a circle at L{k}.4 with step -(k-1) inscribes spiral square Q{k} exactly.
- Aim for marks that survive at 24px: avoid steps below -5 for primary shapes.
- Respect the brief's avoid-list (anti-clichés).`;
}

function addressVocabulary(): string {
  const parts: string[] = ['ADDRESS VOCABULARY (per lattice, at the depth you choose):'];

  const golden = buildLattice('golden_subdivision', 6);
  parts.push(
    `golden_subdivision (golden rect 1000×618 centered on 1000×1000 canvas, spiral squares Q1..Qdepth):
- Points: "L{k}.{i}" for k = 0..depth, i = 0..8 — a 3×3 row-major anchor grid of square Qk
  (L0 = the whole golden rect; i=0 top-left, 4 center, 8 bottom-right). Plus "F" (spiral focus).
  At depth d only L0..Ld exist. Example points at depth 4: L1.4 = (${fmtPt(golden, 'L1.4')}), L2.4 = (${fmtPt(golden, 'L2.4')}), L3.4 = (${fmtPt(golden, 'L3.4')}), F = (${fmtPt(golden, 'F')}).
- Cells (for rect elements): "R0" (whole golden rect), "Q1".."Qdepth" (spiral squares; Q1 is the big left square, Q2 sits top-right of it, spiraling inward clockwise).`,
  );

  const penta = buildLattice('pentagonal', 6);
  parts.push(
    `pentagonal (rings of radius 400·φ^-k around the canvas center):
- Points: "C" (center, ${fmtPt(penta, 'C')}), "P{k}.{v}" (ring-k pentagon vertex v = 0..4, v0 at 12 o'clock, 72° apart), "X{k}.{v}" (ring-k pentagram inner intersections, radius ·φ⁻², rotated 36°). k = 0..depth. No cells.`,
  );

  const root2 = buildLattice('root2_grid', 6);
  const xs = countLines(root2, 'x');
  const ys = countLines(root2, 'y');
  parts.push(
    `root2_grid (A-series rect 1000×707 centered, recursively halved):
- Points: "G{i}.{j}" — intersection of the i-th vertical and j-th horizontal grid line (0-indexed
  ascending, edges included). At depth 4: i ∈ 0..4 (x = 0,250,500,750,1000), j ∈ 0..4; center = G2.2.
  At depth 6: i ∈ 0..${xs - 1}, j ∈ 0..${ys - 1}.
- Cells: "C{i}.{j}" — the cell to the lower-right of G{i}.{j} (valid for i,j below the last line).`,
  );

  return parts.join('\n\n');
}

function fmtPt(lattice: ReturnType<typeof buildLattice>, addr: string): string {
  const p = lattice.points.get(addr)!;
  return `${p.x.toFixed(0)},${p.y.toFixed(0)}`;
}

function countLines(lattice: ReturnType<typeof buildLattice>, axis: 'x' | 'y'): number {
  const coords = new Set<number>();
  for (const [id, p] of lattice.points) {
    if (id.startsWith('G')) coords.add(axis === 'x' ? p.x : p.y);
  }
  return coords.size;
}

export const FEW_SHOT_PLAN = `Example plan (a crescent for a coffee roastery, phi_circle_chain):
{
  "version": 1, "family": "phi_circle_chain", "logoType": "pictorial",
  "canvas": {"size": 1000, "lattice": "golden_subdivision", "depth": 4},
  "elements": [
    {"type": "circle", "id": "body", "at": "L1.4", "r": {"step": 0}},
    {"type": "circle", "id": "carve", "at": "L1.5", "r": {"step": -1}}
  ],
  "composite": [{"op": "subtract", "of": "body", "by": "carve", "as": "crescent"}],
  "transforms": [],
  "style": {"strokeStep": null, "render": "fill"},
  "optical": {"enabled": true, "corrections": [
    {"target": "crescent", "dx": 0, "dy": -6, "scale": 1, "reason": "optical centering of the counterform"}
  ]}
}

Example plan (five-fold rosette, pentagonal):
{
  "version": 1, "family": "pentagonal", "logoType": "abstract",
  "canvas": {"size": 1000, "lattice": "pentagonal", "depth": 2},
  "elements": [{"type": "circle", "id": "petal", "at": "X0.0", "r": {"step": -1}}],
  "composite": [],
  "transforms": [{"kind": "ring", "target": "petal", "count": 5, "angle": 72, "about": "C"}],
  "style": {"strokeStep": null, "render": "fill"},
  "optical": {"enabled": false, "corrections": []}
}`;
