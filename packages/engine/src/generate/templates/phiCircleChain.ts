import type { ConstructionPlan } from '../../schema/plan';
import { assemble, crescentish, pickStrokeStep, type TemplateArgs } from './shared';

type Variant = 'crescent' | 'vesica' | 'chain' | 'orbit' | 'arcs';

const BY_BAND: Record<string, Variant[]> = {
  low: ['crescent', 'vesica', 'crescent'],
  mid: ['chain', 'orbit', 'crescent'],
  high: ['arcs', 'chain', 'orbit'],
};

/** φ circle chain — circles whose radii walk the golden series along the spiral squares. */
export function phiCircleChainTemplate({ brief, slot, rng }: TemplateArgs): ConstructionPlan {
  let variant = rng.pick(BY_BAND[slot.band]!);
  if (slot.band === 'low' && crescentish(brief)) variant = 'crescent';

  switch (variant) {
    case 'crescent': {
      const carveAt = rng.pick(['L1.5', 'L1.1', 'L1.7', 'L2.4'] as const);
      const carveStep = rng.pick([-1, -2]);
      const withCorrection = rng.chance(0.6);
      return assemble(slot, {
        depth: 4,
        elements: [
          { type: 'circle', id: 'body', at: 'L1.4', r: { step: 0 } },
          { type: 'circle', id: 'carve', at: carveAt, r: { step: carveStep } },
        ],
        composite: [{ op: 'subtract', of: 'body', by: 'carve', as: 'crescent' }],
        transforms: rng.chance(0.3)
          ? [{ kind: 'rotate', targets: ['crescent'], angle: rng.pick([90, -90, 137.5] as const), about: 'L1.4' }]
          : [],
        style: { strokeStep: null, render: 'fill' },
        optical: withCorrection
          ? [{ target: 'crescent', dx: 0, dy: -6, scale: 1, reason: 'optical centering of the counterform' }]
          : [],
      });
    }
    case 'vesica': {
      return assemble(slot, {
        depth: 4,
        elements: [
          { type: 'circle', id: 'a', at: 'L1.4', r: { step: 0 } },
          { type: 'circle', id: 'b', at: rng.pick(['L1.5', 'L1.7'] as const), r: { step: 0 } },
        ],
        composite: [{ op: 'intersect', of: 'a', by: 'b', as: 'lens' }],
        transforms: rng.chance(0.5)
          ? [{ kind: 'rotate', targets: ['lens'], angle: rng.pick([90, -90] as const), about: 'L1.4' }]
          : [],
        style: { strokeStep: null, render: 'fill' },
      });
    }
    case 'chain': {
      const count = rng.pick([3, 4]);
      const stroke = pickStrokeStep(brief, rng);
      return assemble(slot, {
        depth: Math.max(4, count + 1),
        elements: Array.from({ length: count }, (_, k) => ({
          type: 'circle' as const,
          id: `c${k}`,
          at: `L${k + 1}.4`,
          r: { step: -k },
        })),
        composite: [],
        transforms: [],
        style: { strokeStep: stroke, render: 'stroke' },
      });
    }
    case 'orbit': {
      return assemble(slot, {
        depth: 4,
        elements: [
          { type: 'circle', id: 'ring', at: 'L1.4', r: { step: 0 } },
          { type: 'circle', id: 'dotA', at: 'L2.4', r: { step: rng.pick([-3, -4]) } },
          { type: 'circle', id: 'dotB', at: 'L3.4', r: { step: rng.pick([-4, -5]) } },
        ],
        composite: [],
        transforms: [],
        style: { strokeStep: pickStrokeStep(brief, rng), render: 'mixed' },
      });
    }
    case 'arcs': {
      const sweep = rng.pick([137.5, 216, 270] as const);
      const start = rng.pick([90, 180, 270] as const);
      return assemble(slot, {
        depth: 4,
        elements: [
          { type: 'arc', id: 'a1', at: 'L1.4', r: { step: 0 }, startAngle: start, sweep },
          { type: 'arc', id: 'a2', at: 'L2.4', r: { step: -1 }, startAngle: start, sweep },
          ...(rng.chance(0.6)
            ? [{ type: 'arc' as const, id: 'a3', at: 'L3.4', r: { step: -2 }, startAngle: start, sweep }]
            : []),
        ],
        composite: [],
        transforms: [],
        style: { strokeStep: pickStrokeStep(brief, rng), render: 'stroke' },
      });
    }
  }
}
