import type { LatticeKind } from '../schema/plan';
import { buildGoldenSubdivision } from './goldenSubdivision';
import { buildPentagonal } from './pentagonal';
import { buildRoot2Grid } from './root2Grid';
import type { Lattice } from './types';

const cache = new Map<string, Lattice>();

export function buildLattice(kind: LatticeKind, depth: number): Lattice {
  const key = `${kind}:${depth}`;
  const hit = cache.get(key);
  if (hit) return hit;
  let lattice: Lattice;
  switch (kind) {
    case 'golden_subdivision':
      lattice = buildGoldenSubdivision(depth);
      break;
    case 'pentagonal':
      lattice = buildPentagonal(depth);
      break;
    case 'root2_grid':
      lattice = buildRoot2Grid(depth);
      break;
  }
  cache.set(key, lattice);
  return lattice;
}

/**
 * Base radius r₀ of each lattice's geometric series (r = r₀ · ratio^step).
 * golden_subdivision: half the golden rect's height — a step-0 circle at L1.4
 * inscribes square Q1. pentagonal: ring-0 radius. root2_grid: half the A-rect height.
 */
export function r0For(kind: LatticeKind): number {
  const PHI = (1 + Math.sqrt(5)) / 2;
  switch (kind) {
    case 'golden_subdivision':
      return 1000 / PHI / 2;
    case 'pentagonal':
      return 400;
    case 'root2_grid':
      return 1000 / Math.SQRT2 / 2;
  }
}

export * from './types';
