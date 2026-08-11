import { describe, expect, it } from 'vitest';
import { fallbackInterpret } from '../src/generate/fallbackInterpreter';
import { fallbackPlanBatch } from '../src/generate/fallbackPlanner';
import { buildSlots } from '../src/generate/slots';
import { findNearDuplicates, planDescriptor } from '../src/generate/diversity';
import { buildLattice, r0For } from '../src/lattice';
import { ratioFor, ROTATION_ANGLES } from '../src/schema/plan';
import { validatePlan } from '../src/validate';
import { renderPlan } from '../src/render/renderPlan';
import { emitSvg } from '../src/svg/emit';
import { sampleBrief } from './fixtures';

describe('fallbackInterpret', () => {
  it('maps a coffee prompt to the expected brief fields', () => {
    const brief = fallbackInterpret(
      'A coffee roastery in Kirkland called "Kessa". Warm but precise. Something to do with a crescent.',
    );
    expect(brief.industry).toBe('food_beverage/coffee');
    expect(brief.name).toBe('Kessa');
    expect(brief.motif.subject).toBe('crescent');
    expect(brief.personality).toContain('warm');
    expect(brief.personality).toContain('precise');
    expect(brief.palette_intent.temperature).toBe('warm');
    expect(brief.constraints.avoid).toEqual(['cup', 'steam']);
  });

  it('produces a sane default brief for garbage input', () => {
    const brief = fallbackInterpret('asdf qwerty');
    expect(brief.name).toBe('Untitled');
    expect(brief.industry).toBe('general');
    expect(validatePlan(fallbackPlanBatch(brief, 1)[0]).ok).toBe(true);
  });

  it('detects the √2 preference', () => {
    expect(fallbackInterpret('a stationery brand on the yamato ratio').proportion_system).toBe('root2');
  });
});

describe('slot matrix', () => {
  it('covers all four families in every batch', () => {
    const slots = buildSlots(sampleBrief);
    expect(slots).toHaveLength(9);
    expect(new Set(slots.map((s) => s.family)).size).toBe(4);
  });

  it('gives the preferred family three slots', () => {
    const slots = buildSlots(sampleBrief);
    expect(slots.filter((s) => s.family === 'phi_circle_chain')).toHaveLength(3);
  });
});

describe('fallback batch — determinism and invariants', () => {
  it('same brief + seed → deep-equal plans; different seed → different batch', () => {
    const a = fallbackPlanBatch(sampleBrief, 42);
    const b = fallbackPlanBatch(sampleBrief, 42);
    const c = fallbackPlanBatch(sampleBrief, 43);
    expect(a).toEqual(b);
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(c));
    // and the rendered SVG is byte-identical
    expect(emitSvg(renderPlan(a[0]!).mark)).toBe(emitSvg(renderPlan(b[0]!).mark));
  });

  it('50 seeded plans across all families validate and honor the step series', () => {
    const prompts = [
      sampleBrief,
      fallbackInterpret('a bold tech startup, abstract mark'),
      fallbackInterpret('a calm yoga studio with a flower, organic and minimal'),
      fallbackInterpret('a modular grid stationery brand on root 2'),
      fallbackInterpret('Mountain Trail outfitters, literal mountain mark'),
    ];
    let count = 0;
    for (const brief of prompts) {
      for (const seed of [1, 2]) {
        for (const plan of fallbackPlanBatch(brief, seed)) {
          count++;
          const v = validatePlan(plan);
          expect(v.ok, JSON.stringify(!v.ok && v.issues)).toBe(true);
          // every radius is exactly r₀·ratio^step for an integer step in range
          const lattice = buildLattice(plan.canvas.lattice, plan.canvas.depth);
          const r0 = r0For(plan.canvas.lattice);
          const ratio = ratioFor(plan.family);
          const rendered = renderPlan(plan);
          for (const gc of rendered.construction.guideCircles) {
            const step = Math.log(gc.r / r0) / Math.log(ratio);
            expect(Math.abs(step - Math.round(step))).toBeLessThan(1e-9);
            expect(Math.round(step)).toBeGreaterThanOrEqual(-6);
            expect(Math.round(step)).toBeLessThanOrEqual(2);
          }
          // every anchor is a real lattice point
          for (const a of rendered.construction.anchors) {
            expect(lattice.points.has(a.id)).toBe(true);
          }
          // every rotation is whitelisted
          for (const t of plan.transforms) {
            if (t.kind === 'rotate' || t.kind === 'ring') {
              expect(ROTATION_ANGLES).toContain(t.angle);
            }
          }
          // node budget
          expect(rendered.mark.nodeCount).toBeLessThanOrEqual(40);
        }
      }
    }
    expect(count).toBeGreaterThanOrEqual(50);
  });

  it('batches pass the diversity check after the re-roll round', () => {
    for (const seed of [1, 7, 99]) {
      const plans = fallbackPlanBatch(sampleBrief, seed);
      expect(findNearDuplicates(plans).length).toBeLessThanOrEqual(1);
    }
  });

  it('descriptor distance separates families and flags duplicates', () => {
    const plans = fallbackPlanBatch(sampleBrief, 5);
    const clone = [plans[0]!, plans[0]!];
    expect(findNearDuplicates(clone)).toEqual([1]);
    const d0 = planDescriptor(plans[0]!);
    const d1 = planDescriptor(plans[1]!);
    expect(d0.family).not.toBe(d1.family);
  });
});
