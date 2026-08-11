import { describe, expect, it } from 'vitest';
import { buildLattice, r0For } from '../src/lattice';
import { PHI, ROOT2 } from '../src/schema/plan';

const H = 1000 / PHI; // ≈ 618.034

describe('golden_subdivision lattice', () => {
  const lat = buildLattice('golden_subdivision', 5);

  it('subdivision squares shrink by φ per step', () => {
    for (let k = 1; k <= 5; k++) {
      const q = lat.cells.get(`Q${k}`)!;
      expect(q.w).toBeCloseTo(q.h, 6);
      expect(q.w).toBeCloseTo(H * Math.pow(PHI, -(k - 1)), 3);
    }
  });

  it('squares tile the golden rect (spiral is closed)', () => {
    // Q1 fills the left; Q2 sits atop the remainder; all squares stay inside R0
    const r0 = lat.cells.get('R0')!;
    for (let k = 1; k <= 5; k++) {
      const q = lat.cells.get(`Q${k}`)!;
      expect(q.x).toBeGreaterThanOrEqual(r0.x - 1e-6);
      expect(q.y).toBeGreaterThanOrEqual(r0.y - 1e-6);
      expect(q.x + q.w).toBeLessThanOrEqual(r0.x + r0.w + 1e-6);
      expect(q.y + q.h).toBeLessThanOrEqual(r0.y + r0.h + 1e-6);
    }
  });

  it('anchor grids are row-major 3×3 with center at .4', () => {
    const q1 = lat.cells.get('Q1')!;
    const c = lat.points.get('L1.4')!;
    expect(c.x).toBeCloseTo(q1.x + q1.w / 2, 6);
    expect(c.y).toBeCloseTo(q1.y + q1.h / 2, 6);
    const tl = lat.points.get('L1.0')!;
    expect(tl.x).toBeCloseTo(q1.x, 6);
    expect(tl.y).toBeCloseTo(q1.y, 6);
  });

  it('spiral focus F matches the closed-form eye of the golden rectangle', () => {
    const f = lat.points.get('F')!;
    expect(f.x).toBeCloseTo((1000 * PHI * PHI) / (1 + PHI * PHI), 3); // = 723.607
    expect(f.x).toBeCloseTo(723.607, 2);
    expect(f.y).toBeCloseTo((1000 - H) / 2 + 447.214, 2);
  });

  it('a step-0 circle at L1.4 inscribes Q1 (r₀ = H/2)', () => {
    expect(r0For('golden_subdivision')).toBeCloseTo(H / 2, 6);
  });
});

describe('pentagonal lattice', () => {
  const lat = buildLattice('pentagonal', 3);

  it('ring radii form a φ series', () => {
    const c = lat.points.get('C')!;
    for (let k = 0; k <= 3; k++) {
      const p = lat.points.get(`P${k}.0`)!;
      const r = Math.hypot(p.x - c.x, p.y - c.y);
      expect(r).toBeCloseTo(400 * Math.pow(PHI, -k), 3);
    }
  });

  it('vertex 0 sits at 12 o’clock, vertices 72° apart', () => {
    const p0 = lat.points.get('P0.0')!;
    expect(p0.x).toBeCloseTo(500, 6);
    expect(p0.y).toBeCloseTo(100, 3);
    const p1 = lat.points.get('P0.1')!;
    const a = (Math.atan2(p1.y - 500, p1.x - 500) * 180) / Math.PI;
    expect(a).toBeCloseTo(-18, 3); // -90 + 72
  });

  it('pentagram intersections sit at r·φ⁻², rotated 36°', () => {
    const x0 = lat.points.get('X0.0')!;
    const r = Math.hypot(x0.x - 500, x0.y - 500);
    expect(r).toBeCloseTo(400 * Math.pow(PHI, -2), 3);
  });
});

describe('root2_grid lattice', () => {
  const lat = buildLattice('root2_grid', 4);

  it('construction rect is 1 : √2', () => {
    const r = lat.rects[0]!;
    expect(r.w / r.h).toBeCloseTo(ROOT2, 6);
  });

  it('depth-4 halving yields the expected vertical lines', () => {
    const xs = ['G0.0', 'G1.0', 'G2.0', 'G3.0', 'G4.0'].map((a) => lat.points.get(a)!.x);
    expect(xs).toEqual([0, 250, 500, 750, 1000]);
  });

  it('grid center is addressable', () => {
    const c = lat.points.get('G2.2')!;
    expect(c.x).toBeCloseTo(500, 6);
    expect(c.y).toBeCloseTo(500, 6);
  });

  it('cells have √2 proportion at every level', () => {
    const cell = lat.cells.get('C0.0')!;
    const ratio = Math.max(cell.w, cell.h) / Math.min(cell.w, cell.h);
    expect(ratio).toBeCloseTo(ROOT2, 6);
  });
});
