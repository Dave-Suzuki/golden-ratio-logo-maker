import type { ConstructionPlan } from '../src/schema/plan';

/** Canonical valid plan per family — the crescent from the PRD example. */
export const crescentPlan: ConstructionPlan = {
  version: 1,
  family: 'phi_circle_chain',
  logoType: 'pictorial',
  canvas: { size: 1000, lattice: 'golden_subdivision', depth: 4 },
  elements: [
    { type: 'circle', id: 'a', at: 'L1.4', r: { step: 0 } },
    { type: 'circle', id: 'b', at: 'L1.5', r: { step: -1 } },
  ],
  composite: [{ op: 'subtract', of: 'a', by: 'b', as: 'crescent' }],
  transforms: [],
  style: { strokeStep: null, render: 'fill' },
  optical: {
    enabled: true,
    corrections: [{ target: 'crescent', dx: 0, dy: -6, scale: 1, reason: 'optical centering' }],
  },
};

export const goldenRectPlan: ConstructionPlan = {
  version: 1,
  family: 'golden_rect_subdivision',
  logoType: 'abstract',
  canvas: { size: 1000, lattice: 'golden_subdivision', depth: 4 },
  elements: [
    { type: 'rect', id: 'r1', cell: 'Q2' },
    { type: 'rect', id: 'r2', cell: 'Q3' },
    { type: 'circle', id: 'c1', at: 'L2.4', r: { step: -2 } },
  ],
  composite: [
    { op: 'unite', of: 'r1', by: 'r2', as: 'steps' },
    { op: 'subtract', of: 'steps', by: 'c1', as: 'mark' },
  ],
  transforms: [],
  style: { strokeStep: null, render: 'fill' },
  optical: { enabled: false, corrections: [] },
};

export const pentagonalPlan: ConstructionPlan = {
  version: 1,
  family: 'pentagonal',
  logoType: 'abstract',
  canvas: { size: 1000, lattice: 'pentagonal', depth: 3 },
  elements: [
    { type: 'polygon', id: 'p', at: 'C', r: { step: 0 }, sides: 5, pointUp: true },
    { type: 'circle', id: 'c', at: 'C', r: { step: -2 } },
  ],
  composite: [{ op: 'subtract', of: 'p', by: 'c', as: 'mark' }],
  transforms: [],
  style: { strokeStep: null, render: 'fill' },
  optical: { enabled: false, corrections: [] },
};

export const root2Plan: ConstructionPlan = {
  version: 1,
  family: 'root2_grid',
  logoType: 'abstract',
  canvas: { size: 1000, lattice: 'root2_grid', depth: 4 },
  elements: [
    { type: 'circle', id: 'a', at: 'G2.2', r: { step: 0 } },
    { type: 'circle', id: 'b', at: 'G2.1', r: { step: -1 } },
    { type: 'line', id: 'l', from: 'G1.1', to: 'G3.3' },
  ],
  composite: [{ op: 'subtract', of: 'a', by: 'b', as: 'cut' }],
  transforms: [],
  style: { strokeStep: -3, render: 'mixed' },
  optical: { enabled: false, corrections: [] },
};

export const allCanonicalPlans = [crescentPlan, goldenRectPlan, pentagonalPlan, root2Plan];

export const sampleBrief = {
  name: 'Kessa Coffee',
  industry: 'food_beverage/coffee',
  personality: ['warm', 'precise'],
  motif: { subject: 'crescent', metaphors: ['moon', 'bean'], abstraction: 0.65 },
  form_language: 'geometric' as const,
  logo_type: 'pictorial' as const,
  proportion_system: 'phi' as const,
  palette_intent: { temperature: 'warm' as const, contrast: 'high' as const },
  constraints: { monochrome_required: true, min_size_px: 24, avoid: ['cup', 'steam'] },
};
