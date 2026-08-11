import type { ConstructionPlan } from '../schema/plan';

/**
 * Reactive diversity layer (GEN-1): a compact descriptor per plan and a pairwise
 * distance. The slot matrix makes batches diverse by construction; this catches
 * the residual case where two seeded rolls land on near-identical geometry.
 */
export interface PlanDescriptor {
  family: string;
  elementCount: number;
  distinctSteps: number;
  symmetry: string;
  opSignature: string;
  renderMode: string;
  variantKey: string;
}

export function planDescriptor(plan: ConstructionPlan): PlanDescriptor {
  const steps = new Set<number>();
  for (const el of plan.elements) {
    if ('r' in el) steps.add(el.r.step);
  }
  const ring = plan.transforms.find((t) => t.kind === 'ring');
  const mirror = plan.transforms.some((t) => t.kind === 'mirror');
  const symmetry = ring ? `ring${ring.count}` : mirror ? 'mirror' : 'none';
  const opSignature = plan.composite.map((c) => c.op[0]).join('');
  const anchors = plan.elements
    .map((e) => ('at' in e ? e.at : e.type === 'line' ? `${e.from}-${e.to}` : e.cell))
    .join(',');
  return {
    family: plan.family,
    elementCount: plan.elements.length,
    distinctSteps: steps.size,
    symmetry,
    opSignature,
    renderMode: plan.style.render,
    variantKey: `${plan.elements.map((e) => e.type).join(',')}|${anchors}`,
  };
}

/** 0 = identical construction, higher = more different. */
export function descriptorDistance(a: PlanDescriptor, b: PlanDescriptor): number {
  let d = 0;
  if (a.family !== b.family) d += 4;
  if (a.symmetry !== b.symmetry) d += 2;
  if (a.opSignature !== b.opSignature) d += 2;
  if (a.renderMode !== b.renderMode) d += 2;
  if (a.variantKey !== b.variantKey) d += 3;
  d += Math.min(2, Math.abs(a.elementCount - b.elementCount));
  d += Math.min(2, Math.abs(a.distinctSteps - b.distinctSteps));
  return d;
}

export const NEAR_DUPLICATE_THRESHOLD = 3;

/** Indices of plans that sit too close to an earlier plan in the batch. */
export function findNearDuplicates(plans: ConstructionPlan[]): number[] {
  const descriptors = plans.map(planDescriptor);
  const dupes: number[] = [];
  for (let i = 1; i < descriptors.length; i++) {
    for (let j = 0; j < i; j++) {
      if (descriptorDistance(descriptors[i]!, descriptors[j]!) < NEAR_DUPLICATE_THRESHOLD) {
        dupes.push(i);
        break;
      }
    }
  }
  return dupes;
}
