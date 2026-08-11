import type { BrandBrief } from '../../schema/brief';
import type { ConstructionPlan, OpticalCorrection } from '../../schema/plan';
import type { Rng } from '../prng';
import type { GenerationSlot } from '../slots';

export interface TemplateArgs {
  brief: BrandBrief;
  slot: GenerationSlot;
  rng: Rng;
}

export type PlanParts = Pick<ConstructionPlan, 'elements' | 'composite' | 'transforms'> & {
  depth: number;
  style: ConstructionPlan['style'];
  optical?: OpticalCorrection[];
};

export function assemble(slot: GenerationSlot, parts: PlanParts): ConstructionPlan {
  return {
    version: 1,
    family: slot.family,
    logoType: slot.logoType,
    canvas: {
      size: 1000,
      lattice:
        slot.family === 'pentagonal'
          ? 'pentagonal'
          : slot.family === 'root2_grid'
            ? 'root2_grid'
            : 'golden_subdivision',
      depth: parts.depth,
    },
    elements: parts.elements,
    composite: parts.composite,
    transforms: parts.transforms,
    style: parts.style,
    optical: {
      enabled: (parts.optical?.length ?? 0) > 0,
      corrections: parts.optical ?? [],
    },
  };
}

/** Personality → stroke weight step: bold marks go heavy, minimal marks go light. */
export function pickStrokeStep(brief: BrandBrief, rng: Rng): number {
  const p = brief.personality.join(' ').toLowerCase();
  if (/bold|strong|heavy|confident/.test(p)) return rng.pick([-2, -3]);
  if (/minimal|light|delicate|elegant|precise/.test(p)) return rng.pick([-4, -5]);
  return rng.pick([-3, -4]);
}

/** Does the motif read as a crescent/arc-like subject? */
export function crescentish(brief: BrandBrief): boolean {
  const words = `${brief.motif.subject} ${brief.motif.metaphors.join(' ')}`.toLowerCase();
  return /crescent|moon|arc|wave|leaf|drop|bean|smile|sail|swoosh/.test(words);
}
