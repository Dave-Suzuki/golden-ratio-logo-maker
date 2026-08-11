import { describe, expect, it } from 'vitest';
import { applyDelta, centerAnchor } from '../src/refine/applyDelta';
import { fallbackNlEdit } from '../src/refine/nlEdit';
import { validatePlan } from '../src/validate';
import { crescentPlan, root2Plan, sampleBrief } from './fixtures';

describe('applyDelta', () => {
  it('steps stroke weight along the φ series and clamps at the ends', () => {
    let plan = root2Plan; // strokeStep -3
    const up = applyDelta(plan, { op: 'weight', direction: 1 });
    expect(up.ok && up.plan.style.strokeStep).toBe(-2);
    let r = applyDelta(plan, { op: 'weight', direction: -1 });
    for (let i = 0; i < 6 && r.ok; i++) {
      plan = r.plan;
      r = applyDelta(plan, { op: 'weight', direction: -1 });
    }
    expect(r.ok).toBe(false);
    expect(!r.ok && r.message).toMatch(/lightest/);
  });

  it('refuses weight on filled marks with a helpful message', () => {
    const r = applyDelta(crescentPlan, { op: 'weight', direction: 1 });
    expect(r.ok).toBe(false);
    expect(!r.ok && r.message).toMatch(/filled/);
  });

  it('rotation appends a whitelisted transform about a lattice anchor', () => {
    const r = applyDelta(crescentPlan, { op: 'rotate', angle: 137.5 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      const t = r.plan.transforms.at(-1)!;
      expect(t.kind).toBe('rotate');
      expect(validatePlan(r.plan).ok).toBe(true);
    }
  });

  it('counterform steps the subtracted element and stays valid', () => {
    const r = applyDelta(crescentPlan, { op: 'counterform', direction: 1 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      const carve = r.plan.elements.find((e) => e.id === 'b')!;
      expect('r' in carve && carve.r.step).toBe(0); // was −1
    }
    const none = applyDelta(root2Plan, { op: 'counterform', direction: 1 });
    expect(none.ok).toBe(true); // root2Plan has a subtract with a sized `by`
  });

  it('optical toggle flips the labeled layer', () => {
    const off = applyDelta(crescentPlan, { op: 'optical', enabled: false });
    expect(off.ok && off.plan.optical.enabled).toBe(false);
  });

  it('centerAnchor returns a legal lattice address for every family', () => {
    for (const plan of [crescentPlan, root2Plan]) {
      const addr = centerAnchor(plan);
      expect(addr.length).toBeGreaterThan(0);
    }
  });
});

describe('fallbackNlEdit', () => {
  it('maps editing verbs to deltas', () => {
    expect(fallbackNlEdit('make it heavier', sampleBrief)).toEqual({ op: 'weight', direction: 1 });
    expect(fallbackNlEdit('a bit thinner please', sampleBrief)).toEqual({ op: 'weight', direction: -1 });
    expect(fallbackNlEdit('rotate it to the left', sampleBrief)).toEqual({ op: 'rotate', angle: -90 });
    expect(fallbackNlEdit('turn by the golden angle', sampleBrief)).toEqual({ op: 'rotate', angle: 137.5 });
    expect(fallbackNlEdit('flip it', sampleBrief)).toEqual({ op: 'mirror', axis: 'vertical' });
    expect(fallbackNlEdit('open up the gap', sampleBrief)).toEqual({ op: 'counterform', direction: 1 });
    expect(fallbackNlEdit('turn the optical corrections off', sampleBrief)).toEqual({ op: 'optical', enabled: false });
  });

  it('maps abstraction requests to replans with an adjusted brief', () => {
    const d = fallbackNlEdit('make it more abstract', sampleBrief);
    expect(d.op).toBe('replan');
    if (d.op === 'replan') expect(d.brief.motif.abstraction).toBeCloseTo(0.9, 5);
  });

  it('returns a visible message for unmappable input', () => {
    const d = fallbackNlEdit('make it feel like a warm hug from grandma', sampleBrief);
    expect(d.op).toBe('unrecognized');
    if (d.op === 'unrecognized') expect(d.message).toMatch(/slider/);
  });
});
