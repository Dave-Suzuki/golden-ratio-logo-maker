import type { ConstructionPlan } from '../../schema/plan';
import { assemble, pickStrokeStep, type TemplateArgs } from './shared';

type Variant = 'quadDots' | 'blocks' | 'target' | 'cross' | 'overlap';

const BY_BAND: Record<string, Variant[]> = {
  low: ['target', 'blocks'],
  mid: ['quadDots', 'overlap', 'target'],
  high: ['cross', 'quadDots', 'overlap'],
};

/** √2 modular grid (大和比) — halving symmetry, radii on the √2 series. */
export function root2GridTemplate({ brief, slot, rng }: TemplateArgs): ConstructionPlan {
  const variant = rng.pick(BY_BAND[slot.band]!);

  switch (variant) {
    case 'quadDots': {
      const step = rng.pick([-2, -3]);
      return assemble(slot, {
        depth: 4,
        elements: [{ type: 'circle', id: 'dot', at: rng.pick(['G1.1', 'G1.3'] as const), r: { step } }],
        composite: [],
        transforms: [{ kind: 'ring', target: 'dot', count: 4, angle: 90, about: 'G2.2' }],
        style: { strokeStep: null, render: 'fill' },
      });
    }
    case 'blocks': {
      return assemble(slot, {
        depth: 4,
        elements: [
          { type: 'rect', id: 'a', cell: rng.pick(['C1.1', 'C1.2'] as const) },
          { type: 'rect', id: 'b', cell: rng.pick(['C2.2', 'C2.1'] as const) },
          { type: 'circle', id: 'bite', at: 'G2.2', r: { step: rng.pick([-2, -3]) } },
        ],
        composite: [
          { op: 'unite', of: 'a', by: 'b', as: 'blocks' },
          { op: 'subtract', of: 'blocks', by: 'bite', as: 'mark' },
        ],
        transforms: [],
        style: { strokeStep: null, render: 'fill' },
      });
    }
    case 'target': {
      return assemble(slot, {
        depth: 4,
        elements: [
          { type: 'circle', id: 'outer', at: 'G2.2', r: { step: 0 } },
          { type: 'circle', id: 'inner', at: 'G2.2', r: { step: -1 } },
          ...(rng.chance(0.5)
            ? [{ type: 'circle' as const, id: 'core', at: 'G2.2', r: { step: -3 } }]
            : []),
        ],
        composite: [{ op: 'subtract', of: 'outer', by: 'inner', as: 'ring' }],
        transforms: [],
        style: { strokeStep: null, render: 'fill' },
      });
    }
    case 'cross': {
      const stroke = pickStrokeStep(brief, rng);
      const diagonal = rng.chance(0.4);
      return assemble(slot, {
        depth: 4,
        elements: diagonal
          ? [
              { type: 'line', id: 'l1', from: 'G1.1', to: 'G3.3' },
              { type: 'line', id: 'l2', from: 'G3.1', to: 'G1.3' },
            ]
          : [
              { type: 'line', id: 'l1', from: 'G2.1', to: 'G2.3' },
              { type: 'line', id: 'l2', from: 'G1.2', to: 'G3.2' },
            ],
        composite: [],
        transforms: [],
        style: { strokeStep: stroke, render: 'stroke' },
      });
    }
    case 'overlap': {
      return assemble(slot, {
        depth: 4,
        elements: [
          { type: 'circle', id: 'a', at: 'G1.2', r: { step: 0 } },
          { type: 'circle', id: 'b', at: 'G3.2', r: { step: 0 } },
        ],
        composite: [{ op: rng.chance(0.6) ? 'intersect' : 'subtract', of: 'a', by: 'b', as: 'mark' }],
        transforms: rng.chance(0.4)
          ? [{ kind: 'rotate', targets: ['mark'], angle: 90, about: 'G2.2' }]
          : [],
        style: { strokeStep: null, render: 'fill' },
      });
    }
  }
}
