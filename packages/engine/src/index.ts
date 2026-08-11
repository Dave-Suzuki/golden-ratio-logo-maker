export * from './schema/brief';
export * from './schema/plan';
export * from './schema/delta';
export * from './lattice';
export * from './validate';
export * from './render/types';
export { renderPlan, strokeWeight, stepLabel } from './render/renderPlan';
export { emitSvg, emitVariant, type EmitOptions, type Variant } from './svg/emit';
export { optimizeMark, roundPathData } from './svg/optimize';
