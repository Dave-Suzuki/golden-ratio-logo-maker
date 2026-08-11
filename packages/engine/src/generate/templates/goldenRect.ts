import type { ConstructionPlan } from '../../schema/plan';
import { assemble, pickStrokeStep, type TemplateArgs } from './shared';

type Variant = 'steps' | 'quarter' | 'frame' | 'monolith';

const BY_BAND: Record<string, Variant[]> = {
  low: ['quarter', 'monolith'],
  mid: ['steps', 'quarter', 'frame'],
  high: ['frame', 'steps'],
};

/** Golden-rectangle subdivision — blocky marks cut from the spiral squares themselves. */
export function goldenRectTemplate({ brief, slot, rng }: TemplateArgs): ConstructionPlan {
  const variant = rng.pick(BY_BAND[slot.band]!);

  switch (variant) {
    case 'steps': {
      // Two adjacent spiral squares united, a φ-stepped circle carved out.
      const carveAt = rng.pick(['L2.4', 'L2.0', 'L3.4'] as const);
      return assemble(slot, {
        depth: 4,
        elements: [
          { type: 'rect', id: 'q2', cell: 'Q2' },
          { type: 'rect', id: 'q3', cell: 'Q3' },
          { type: 'circle', id: 'bite', at: carveAt, r: { step: rng.pick([-1, -2]) } },
        ],
        composite: [
          { op: 'unite', of: 'q2', by: 'q3', as: 'steps' },
          { op: 'subtract', of: 'steps', by: 'bite', as: 'mark' },
        ],
        transforms: rng.chance(0.4)
          ? [{ kind: 'mirror', targets: ['mark'], axis: rng.pick(['vertical', 'horizontal'] as const) }]
          : [],
        style: { strokeStep: null, render: 'fill' },
      });
    }
    case 'quarter': {
      // The big square with a quarter-circle bite at a corner — round meets rational.
      const corner = rng.pick(['L1.0', 'L1.2', 'L1.6', 'L1.8'] as const);
      return assemble(slot, {
        depth: 3,
        elements: [
          { type: 'rect', id: 'sq', cell: 'Q1' },
          { type: 'circle', id: 'round', at: corner, r: { step: 0 } },
        ],
        composite: [
          {
            op: rng.chance(0.5) ? 'subtract' : 'intersect',
            of: 'sq',
            by: 'round',
            as: 'mark',
          },
        ],
        transforms: [],
        style: { strokeStep: null, render: 'fill' },
        optical: rng.chance(0.4)
          ? [{ target: 'mark', dx: 0, dy: -5, scale: 1, reason: 'optical centering against the cut corner' }]
          : [],
      });
    }
    case 'frame': {
      // Concentric golden geometry: Q1 minus Q2-sized square placed inside it.
      return assemble(slot, {
        depth: 4,
        elements: [
          { type: 'rect', id: 'outer', cell: 'Q1' },
          { type: 'circle', id: 'inner', at: 'L1.4', r: { step: rng.pick([-1, -2]) } },
          { type: 'circle', id: 'dot', at: rng.pick(['L2.4', 'L3.4'] as const), r: { step: -3 } },
        ],
        composite: [
          { op: 'subtract', of: 'outer', by: 'inner', as: 'frame' },
          { op: 'unite', of: 'frame', by: 'dot', as: 'mark' },
        ],
        transforms: [],
        style: { strokeStep: null, render: 'fill' },
      });
    }
    case 'monolith': {
      const stroke = pickStrokeStep(brief, rng);
      return assemble(slot, {
        depth: 4,
        elements: [
          { type: 'rect', id: 'block', cell: rng.pick(['Q2', 'Q3'] as const) },
          // open arc → stroked in mixed mode; the filled block sits inside its sweep
          { type: 'arc', id: 'halo', at: 'L1.4', r: { step: 0 }, startAngle: rng.pick([90, 270] as const), sweep: 300 },
        ],
        composite: [],
        transforms: [],
        style: { strokeStep: stroke, render: 'mixed' },
      });
    }
  }
}
