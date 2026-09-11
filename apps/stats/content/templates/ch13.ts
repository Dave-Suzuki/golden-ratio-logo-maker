import { round } from '../../src/lib/stats/dist';
import type { Template } from '../../src/lib/types';

export const CH13_TEMPLATES: Template[] = [
  {
    id: 'anova-f-ratio',
    sectionId: '13.2',
    conceptTag: '13.2',
    kind: 'numeric',
    generate(rng) {
      const k = rng.pick([3, 4, 5]);
      const n = rng.pick([4, 5, 6]);
      const ssb = rng.int(20, 200);
      const ssw = rng.int(50, 400);
      const dfb = k - 1, dfw = k * (n - 1);
      const f = round((ssb / dfb) / (ssw / dfw), 3);
      const ask = rng.pick(['f', 'dfb', 'dfw'] as const);
      return {
        sectionId: '13.2',
        conceptTag: '13.2',
        kind: 'numeric',
        context: `A one-way ANOVA compares ${k} groups with ${n} observations each. SS_between = ${ssb} and SS_within = ${ssw}.`,
        stem: ask === 'f' ? 'Compute the F statistic. Round to three decimals.' : ask === 'dfb' ? 'What are the degrees of freedom for the numerator (between groups)?' : 'What are the degrees of freedom for the denominator (within groups)?',
        answer: ask === 'f' ? f : ask === 'dfb' ? dfb : dfw,
        tolerance: { abs: ask === 'f' ? 0.02 : 0.01 },
        explanation: [`df_between = k − 1 = ${dfb}; df_within = n_total − k = ${k * n} − ${k} = ${dfw}`, `MS_between = ${ssb}/${dfb} = ${round(ssb / dfb, 3)}; MS_within = ${ssw}/${dfw} = ${round(ssw / dfw, 3)}`, `F = MS_between / MS_within = ${f}`],
      };
    },
  },
  {
    id: 'f-two-variances',
    sectionId: '13.4',
    conceptTag: '13.4',
    kind: 'numeric',
    generate(rng) {
      const s1 = round(rng.float(2, 10, 2), 2), s2 = round(rng.float(2, 10, 2), 2);
      const n1 = rng.int(8, 25), n2 = rng.int(8, 25);
      const f = round((s1 * s1) / (s2 * s2), 3);
      return {
        sectionId: '13.4',
        conceptTag: '13.4',
        kind: 'numeric',
        stem: `Two samples: s₁ = ${s1} (n₁ = ${n1}) and s₂ = ${s2} (n₂ = ${n2}). To test H0: σ₁² = σ₂², compute F = s₁²/s₂². Round to three decimals.`,
        answer: f,
        tolerance: { abs: 0.01 },
        explanation: [`F = s₁² / s₂² = ${round(s1 * s1, 4)} / ${round(s2 * s2, 4)} = ${f}`, `df = (n₁ − 1, n₂ − 1) = (${n1 - 1}, ${n2 - 1})`],
      };
    },
  },
];
