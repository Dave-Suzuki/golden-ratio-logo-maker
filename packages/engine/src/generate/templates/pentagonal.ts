import type { ConstructionPlan } from '../../schema/plan';
import { assemble, pickStrokeStep, type TemplateArgs } from './shared';

type Variant = 'pentaCut' | 'star' | 'ringDots' | 'petals' | 'pentagram';

const BY_BAND: Record<string, Variant[]> = {
  low: ['pentaCut', 'petals'],
  mid: ['star', 'ringDots', 'pentaCut'],
  high: ['pentagram', 'ringDots', 'star'],
};

/** Pentagonal family — five-fold symmetry, every radius on the φ ring series. */
export function pentagonalTemplate({ brief, slot, rng }: TemplateArgs): ConstructionPlan {
  const variant = rng.pick(BY_BAND[slot.band]!);

  switch (variant) {
    case 'pentaCut': {
      const cutter = rng.pick(['circle', 'polygon'] as const);
      return assemble(slot, {
        depth: 3,
        elements: [
          { type: 'polygon', id: 'p', at: 'C', r: { step: 0 }, sides: 5, pointUp: true },
          cutter === 'circle'
            ? { type: 'circle', id: 'cut', at: rng.pick(['C', 'X0.0'] as const), r: { step: -2 } }
            : { type: 'polygon', id: 'cut', at: 'C', r: { step: -1 }, sides: 5, pointUp: false },
        ],
        composite: [{ op: 'subtract', of: 'p', by: 'cut', as: 'mark' }],
        transforms: [],
        style: { strokeStep: null, render: 'fill' },
      });
    }
    case 'star': {
      // Two pentagons a half-turn apart intersect into a decagonal star core.
      return assemble(slot, {
        depth: 3,
        elements: [
          { type: 'polygon', id: 'up', at: 'C', r: { step: 0 }, sides: 5, pointUp: true },
          { type: 'polygon', id: 'down', at: 'C', r: { step: 0 }, sides: 5, pointUp: false },
        ],
        composite: [
          { op: rng.chance(0.5) ? 'intersect' : 'unite', of: 'up', by: 'down', as: 'star' },
        ],
        transforms: [],
        style: { strokeStep: null, render: 'fill' },
      });
    }
    case 'ringDots': {
      const dotStep = rng.pick([-3, -4]);
      const withCenter = rng.chance(0.6);
      return assemble(slot, {
        depth: 2,
        elements: [
          { type: 'circle', id: 'dot', at: 'P0.0', r: { step: dotStep } },
          ...(withCenter
            ? [{ type: 'circle' as const, id: 'core', at: 'C', r: { step: dotStep + 1 } }]
            : []),
        ],
        composite: [],
        transforms: [{ kind: 'ring', target: 'dot', count: 5, angle: 72, about: 'C' }],
        style: { strokeStep: null, render: 'fill' },
      });
    }
    case 'petals': {
      // One circle on the pentagram's inner ring, repeated five-fold — a φ flower.
      return assemble(slot, {
        depth: 2,
        elements: [{ type: 'circle', id: 'petal', at: 'X0.0', r: { step: -1 } }],
        composite: [],
        transforms: [{ kind: 'ring', target: 'petal', count: 5, angle: 72, about: 'C' }],
        style: { strokeStep: null, render: 'fill' },
        optical: rng.chance(0.4)
          ? [{ target: 'petal', dx: 0, dy: -4, scale: 1, reason: 'optical centering of the rosette' }]
          : [],
      });
    }
    case 'pentagram': {
      // The chord star drawn as strokes: P0.v → P0.v+2 for all v.
      const stroke = pickStrokeStep(brief, rng);
      return assemble(slot, {
        depth: 2,
        elements: [{ type: 'line', id: 'chord', from: 'P0.0', to: 'P0.2' }],
        composite: [],
        transforms: [{ kind: 'ring', target: 'chord', count: 5, angle: 72, about: 'C' }],
        style: { strokeStep: stroke, render: 'stroke' },
      });
    }
  }
}
