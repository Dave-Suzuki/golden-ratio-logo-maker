import { describe, expect, it } from 'vitest';
import { renderPlan } from '../src/render/renderPlan';
import { emitSvg, emitVariant } from '../src/svg/emit';
import { optimizeMark } from '../src/svg/optimize';
import type { ConstructionPlan } from '../src/schema/plan';
import { allCanonicalPlans, crescentPlan, pentagonalPlan, root2Plan } from './fixtures';

describe('renderPlan', () => {
  it('renders the crescent as a subtraction of two φ-stepped circles', () => {
    const r = renderPlan(crescentPlan);
    expect(r.mark.paths.length).toBeGreaterThan(0);
    expect(r.mark.paths[0]!.role).toBe('fill');
    // guide circles carry the actual radii of the series
    expect(r.construction.guideCircles).toHaveLength(2);
    const [big, small] = r.construction.guideCircles;
    expect(big!.r / small!.r).toBeCloseTo((1 + Math.sqrt(5)) / 2, 6);
    expect(big!.label).toBe('r₀');
    expect(small!.label).toBe('r₀·φ⁻¹');
  });

  it('is deterministic: identical SVG on repeated renders', () => {
    for (const plan of allCanonicalPlans) {
      const a = emitSvg(renderPlan(plan).mark);
      const b = emitSvg(renderPlan(plan).mark);
      expect(a).toBe(b);
    }
  });

  it('keeps parallel scopes isolated', () => {
    const results = allCanonicalPlans.map((p) => renderPlan(p));
    const again = allCanonicalPlans.map((p) => renderPlan(p));
    results.forEach((r, i) => {
      expect(emitSvg(r.mark)).toBe(emitSvg(again[i]!.mark));
    });
  });

  it('separates pure and optically-corrected states', () => {
    const r = renderPlan(crescentPlan);
    expect(r.opticalApplied).toHaveLength(1);
    expect(emitSvg(r.mark)).not.toBe(emitSvg(r.markPure));
    const off: ConstructionPlan = {
      ...crescentPlan,
      optical: { ...crescentPlan.optical, enabled: false },
    };
    const r2 = renderPlan(off);
    expect(r2.opticalApplied).toHaveLength(0);
    expect(emitSvg(r2.mark)).toBe(emitSvg(r2.markPure));
    // pure state is identical whether or not corrections are enabled
    expect(emitSvg(r.markPure)).toBe(emitSvg(r2.mark));
  });

  it('applies ring transforms as rotational copies', () => {
    const ringed: ConstructionPlan = {
      ...pentagonalPlan,
      elements: [{ type: 'circle', id: 'dot', at: 'P0.0', r: { step: -3 } }],
      composite: [],
      transforms: [{ kind: 'ring', target: 'dot', count: 5, angle: 72, about: 'C' }],
    };
    const r = renderPlan(ringed);
    expect(r.mark.paths.length).toBe(5);
  });

  it('strokes open elements and fills closed ones in mixed mode', () => {
    const r = renderPlan(root2Plan);
    const roles = r.mark.paths.map((p) => p.role);
    expect(roles).toContain('fill'); // the cut circle
    expect(roles).toContain('stroke'); // the line
    const stroke = r.mark.paths.find((p) => p.role === 'stroke')!;
    // w₀·φ⁻³ ≈ 34.4
    expect(stroke.strokeWidth).toBeCloseTo(1000 / Math.pow((1 + Math.sqrt(5)) / 2, 7), 1);
  });

  it('emits construction geometry for the reveal', () => {
    const r = renderPlan(crescentPlan);
    expect(r.construction.latticeLines.length).toBeGreaterThan(0);
    expect(r.construction.guideRects.length).toBeGreaterThan(1);
    expect(r.construction.spiralPath).toBeTruthy();
    expect(r.construction.anchors.map((a) => a.id)).toEqual(['L1.4', 'L1.5']);
    expect(r.construction.labels.some((l) => l.text === '1 : φ')).toBe(true);
  });
});

describe('svg emit + optimize', () => {
  it('keeps node counts within the craft budget (≤40)', () => {
    for (const plan of allCanonicalPlans) {
      const r = renderPlan(plan);
      expect(r.mark.nodeCount).toBeLessThanOrEqual(40);
    }
  });

  it('rounds coordinates to at most 3 decimals', () => {
    const svg = emitSvg(renderPlan(crescentPlan).mark);
    const numbers = svg.match(/\d+\.\d{4,}/g);
    expect(numbers).toBeNull();
  });

  it('merges same-style paths', () => {
    const r = renderPlan(pentagonalPlan);
    const optimized = optimizeMark(r.mark);
    expect(optimized.paths.length).toBeLessThanOrEqual(r.mark.paths.length);
  });

  it('emits mono and inverted variants', () => {
    const r = renderPlan(crescentPlan);
    expect(emitVariant(r.mark, 'mono')).toContain('#000000');
    const inv = emitVariant(r.mark, 'inverted');
    expect(inv).toContain('#ffffff');
    expect(inv).toContain('<rect');
  });
});
