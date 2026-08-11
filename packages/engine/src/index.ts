export * from './schema/brief';
export * from './schema/plan';
export * from './schema/delta';
export * from './lattice';
export * from './validate';
export * from './render/types';
export { renderPlan, strokeWeight, stepLabel } from './render/renderPlan';
export { emitSvg, emitVariant, type EmitOptions, type Variant } from './svg/emit';
export { optimizeMark, roundPathData } from './svg/optimize';
export { mulberry32, hashString, makeRng, type Rng } from './generate/prng';
export { buildSlots, preferredFamily, type GenerationSlot, type AbstractionBand } from './generate/slots';
export { fallbackInterpret } from './generate/fallbackInterpreter';
export { fallbackPlanBatch, planSlot, briefHash } from './generate/fallbackPlanner';
export {
  planDescriptor,
  descriptorDistance,
  findNearDuplicates,
  NEAR_DUPLICATE_THRESHOLD,
  type PlanDescriptor,
} from './generate/diversity';
export { rationaleFor } from './rationale';
export { analyzeLegibility, CHECK_SIZES, type LegibilityFlag } from './analyze';
export {
  generatePalette,
  contrastRatio,
  relativeLuminance,
  hslToHex,
  GOLDEN_ANGLE,
  type Palette,
} from './palette';
