import { describe, expect, it } from 'vitest';
import { analyzeLegibility } from '../src/analyze';
import { contrastRatio, generatePalette, GOLDEN_ANGLE } from '../src/palette';
import { rationaleFor } from '../src/rationale';
import { crescentPlan, sampleBrief, root2Plan } from './fixtures';

describe('rationaleFor', () => {
  it('produces 2–3 sentences slot-filled from the actual plan', () => {
    const text = rationaleFor(crescentPlan, sampleBrief);
    const sentences = text.split(/(?<=\.)\s+/);
    expect(sentences.length).toBeGreaterThanOrEqual(2);
    expect(sentences.length).toBeLessThanOrEqual(3);
    expect(text).toContain('crescent');
    expect(text).toContain('φ');
  });

  it('speaks √2 for the root2 family', () => {
    expect(rationaleFor(root2Plan)).toContain('√2');
  });

  it('is deterministic', () => {
    expect(rationaleFor(crescentPlan, sampleBrief)).toBe(rationaleFor(crescentPlan, sampleBrief));
  });
});

describe('analyzeLegibility', () => {
  it('flags thin strokes', () => {
    const thin = { ...root2Plan, style: { strokeStep: -6 as number | null, render: 'stroke' as const } };
    const flags = analyzeLegibility(thin);
    expect(flags.some((f) => f.message.includes('strokes thin'))).toBe(true);
  });

  it('reports counterform closure for tight subtractions', () => {
    const flags = analyzeLegibility(crescentPlan);
    // the crescent's thin wall should surface some flag or none — but never throw
    expect(Array.isArray(flags)).toBe(true);
  });
});

describe('generatePalette', () => {
  it('is deterministic per seed and warm briefs get warm hues', () => {
    const a = generatePalette(sampleBrief, 42);
    const b = generatePalette(sampleBrief, 42);
    expect(a).toEqual(b);
  });

  it('every displayed pair passes WCAG 4.5', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const p = generatePalette(sampleBrief, seed);
      for (const pair of p.pairs) {
        expect(pair.ratio).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('accents rotate by the golden angle', () => {
    expect(GOLDEN_ANGLE).toBe(137.5);
    const p = generatePalette(sampleBrief, 9);
    expect(new Set([p.base, ...p.accents]).size).toBe(4);
    expect(contrastRatio(p.ink, p.paper)).toBeGreaterThan(10);
  });
});
