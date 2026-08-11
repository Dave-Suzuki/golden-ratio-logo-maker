import type { BrandBrief } from '../schema/brief';
import type { ConstructionPlan, Family } from '../schema/plan';
import { validatePlan } from '../validate';
import { findNearDuplicates } from './diversity';
import { hashString, makeRng } from './prng';
import { buildSlots, type GenerationSlot } from './slots';
import { goldenRectTemplate } from './templates/goldenRect';
import { pentagonalTemplate } from './templates/pentagonal';
import { phiCircleChainTemplate } from './templates/phiCircleChain';
import { root2GridTemplate } from './templates/root2Grid';
import type { TemplateArgs } from './templates/shared';

const TEMPLATES: Record<Family, (args: TemplateArgs) => ConstructionPlan> = {
  phi_circle_chain: phiCircleChainTemplate,
  golden_rect_subdivision: goldenRectTemplate,
  pentagonal: pentagonalTemplate,
  root2_grid: root2GridTemplate,
};

export function briefHash(brief: BrandBrief): number {
  return hashString(JSON.stringify(brief));
}

/** Deterministic: same brief + seed → deep-equal plans (GEN-8). */
export function planSlot(brief: BrandBrief, slot: GenerationSlot, seed: number, roll = 0): ConstructionPlan {
  const rng = makeRng((briefHash(brief) ^ seed) + slot.index * 7919 + roll * 104729);
  const plan = TEMPLATES[slot.family]({ brief, slot, rng });
  const result = validatePlan(plan);
  if (!result.ok) {
    // Templates are written to be always-legal; this guards template regressions.
    throw new Error(
      `fallback template '${slot.family}' produced an invalid plan: ${JSON.stringify(result.issues)}`,
    );
  }
  return result.plan;
}

/**
 * The full no-key batch: 9 slots → 9 validated plans, with one re-roll round
 * for any plan that lands too close to an earlier one.
 */
export function fallbackPlanBatch(brief: BrandBrief, seed: number): ConstructionPlan[] {
  const slots = buildSlots(brief);
  const plans = slots.map((slot) => planSlot(brief, slot, seed));
  for (const i of findNearDuplicates(plans)) {
    plans[i] = planSlot(brief, slots[i]!, seed, 1);
  }
  return plans;
}
