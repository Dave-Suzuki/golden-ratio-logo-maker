import { buildLattice, type Lattice, type Pt } from '../lattice';
import type { ParamDelta } from '../schema/delta';
import type { ConstructionPlan } from '../schema/plan';
import { validatePlan, visibleIds } from '../validate';
import { LIMITS } from '../validate';

export type DeltaResult =
  | { ok: true; plan: ConstructionPlan }
  | { ok: false; message: string };

/**
 * Apply a ParamDelta to a plan. Every path re-validates, so a mark can never
 * leave its proportion system (REF-1). Deltas the plan cannot express return
 * a user-facing message instead of failing silently.
 */
export function applyDelta(plan: ConstructionPlan, delta: ParamDelta): DeltaResult {
  switch (delta.op) {
    case 'weight': {
      if (plan.style.strokeStep === null) {
        return { ok: false, message: 'This mark is filled, not stroked — weight does not apply.' };
      }
      const next = plan.style.strokeStep + delta.direction;
      if (next < LIMITS.strokeStepMin || next > LIMITS.strokeStepMax) {
        return { ok: false, message: `Weight is already at its ${delta.direction > 0 ? 'heaviest' : 'lightest'} φ-step.` };
      }
      return revalidate({ ...plan, style: { ...plan.style, strokeStep: next } });
    }
    case 'rotate': {
      const about = centerAnchor(plan);
      return revalidate({
        ...plan,
        transforms: [
          ...plan.transforms,
          { kind: 'rotate', targets: visibleIds(plan), angle: delta.angle, about },
        ],
      });
    }
    case 'mirror': {
      return revalidate({
        ...plan,
        transforms: [...plan.transforms, { kind: 'mirror', targets: visibleIds(plan), axis: delta.axis }],
      });
    }
    case 'counterform': {
      const sub = plan.composite.find((c) => c.op === 'subtract');
      if (!sub) {
        return { ok: false, message: 'This mark has no counterform to adjust — nothing is subtracted.' };
      }
      const idx = plan.elements.findIndex((e) => e.id === sub.by && 'r' in e);
      if (idx < 0) {
        return { ok: false, message: 'The counterform of this mark is not a sized shape.' };
      }
      const el = plan.elements[idx]! as Extract<ConstructionPlan['elements'][number], { r: { step: number } }>;
      const next = el.r.step + delta.direction;
      if (next < LIMITS.radiusStepMin || next > LIMITS.radiusStepMax) {
        return { ok: false, message: 'The counterform is already at the end of the series.' };
      }
      const elements = plan.elements.map((e, i) => (i === idx ? { ...el, r: { step: next } } : e));
      return revalidate({ ...plan, elements });
    }
    case 'optical': {
      return revalidate({ ...plan, optical: { ...plan.optical, enabled: delta.enabled } });
    }
    case 'replan':
      return { ok: false, message: 'replan deltas are handled by the planner, not applyDelta' };
    case 'unrecognized':
      return { ok: false, message: delta.message };
  }
}

function revalidate(candidate: ConstructionPlan): DeltaResult {
  const result = validatePlan(candidate);
  if (!result.ok) {
    return { ok: false, message: `That change would leave the proportion system: ${result.issues[0]?.message}` };
  }
  return { ok: true, plan: result.plan };
}

/** The lattice point nearest the canvas center — a legal `about` for whole-mark transforms. */
export function centerAnchor(plan: ConstructionPlan): string {
  const lattice = buildLattice(plan.canvas.lattice, plan.canvas.depth);
  return nearestAnchor(lattice, { x: 500, y: 500 });
}

export function nearestAnchor(lattice: Lattice, target: Pt): string {
  let best = '';
  let bestDist = Infinity;
  for (const [id, p] of lattice.points) {
    const d = (p.x - target.x) ** 2 + (p.y - target.y) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = id;
    }
  }
  return best;
}
