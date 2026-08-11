import { buildLattice, r0For } from './lattice';
import { ratioFor, type ConstructionPlan } from './schema/plan';
import { strokeWeight } from './render/renderPlan';

export interface LegibilityFlag {
  belowPx: number;
  message: string;
  severity: 'warn' | 'fail';
}

export const CHECK_SIZES = [16, 24, 32, 60] as const;

/**
 * Geometric legibility heuristic (ANA-2): from the plan alone, find the smallest
 * features — stroke widths, counterform gaps, dot diameters — and report the pixel
 * size below which each stops resolving (< ~1.5px). No rasterization involved.
 */
export function analyzeLegibility(plan: ConstructionPlan): LegibilityFlag[] {
  const flags: LegibilityFlag[] = [];
  const lattice = buildLattice(plan.canvas.lattice, plan.canvas.depth);
  const ratio = ratioFor(plan.family);
  const r0 = r0For(plan.canvas.lattice);
  const radiusOf = (step: number) => r0 * Math.pow(ratio, step);
  const MIN_FEATURE_PX = 1.5;
  const sizeWhere = (featureUnits: number) => Math.ceil((MIN_FEATURE_PX * 1000) / featureUnits);

  if (plan.style.strokeStep !== null) {
    const w = strokeWeight(plan.style.strokeStep);
    const below = sizeWhere(w);
    if (below > 12) {
      flags.push({
        belowPx: below,
        message: `strokes thin below ${below}px — consider a heavier weight step`,
        severity: below > 32 ? 'fail' : 'warn',
      });
    }
  }

  const circles = new Map(
    plan.elements.flatMap((el) =>
      el.type === 'circle' ? [[el.id, { at: el.at, r: radiusOf(el.r.step) }] as const] : [],
    ),
  );
  for (const op of plan.composite) {
    if (op.op !== 'subtract') continue;
    const a = circles.get(op.of);
    const b = circles.get(op.by);
    if (!a || !b) continue;
    const pa = lattice.points.get(a.at)!;
    const pb = lattice.points.get(b.at)!;
    const dist = Math.hypot(pa.x - pb.x, pa.y - pb.y);
    // thinnest wall of the ring/crescent left after the cut
    const wall = a.r - (dist + b.r) > 0 ? a.r - (dist + b.r) : a.r - b.r - dist;
    if (wall > 0 && wall < a.r) {
      const below = sizeWhere(wall);
      if (below > 12) {
        flags.push({
          belowPx: below,
          message: `counterform closes below ${below}px`,
          severity: below > 32 ? 'fail' : 'warn',
        });
      }
    }
  }

  let minDiameter = Infinity;
  for (const el of plan.elements) {
    if (el.type === 'circle') minDiameter = Math.min(minDiameter, 2 * radiusOf(el.r.step));
  }
  if (Number.isFinite(minDiameter)) {
    const below = sizeWhere(minDiameter);
    if (below > 12) {
      flags.push({
        belowPx: below,
        message: `smallest circle disappears below ${below}px`,
        severity: 'warn',
      });
    }
  }

  return flags.sort((a, b) => b.belowPx - a.belowPx);
}
