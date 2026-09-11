import { round } from '../../src/lib/stats/dist';
import type { Template } from '../../src/lib/types';

export const CH10_TEMPLATES: Template[] = [
  {
    id: 'two-mean-t-stat',
    sectionId: '10.1',
    conceptTag: '10.1',
    kind: 'numeric',
    generate(rng) {
      const x1 = round(rng.int(50, 90) + rng.float(0, 0.9, 1), 1);
      const x2 = round(x1 + rng.float(-6, 6, 1), 1);
      const s1 = rng.int(4, 12), s2 = rng.int(4, 12);
      const n1 = rng.pick([20, 25, 30, 40]), n2 = rng.pick([20, 25, 30, 40]);
      const se = Math.sqrt((s1 * s1) / n1 + (s2 * s2) / n2);
      const t = round((x1 - x2) / se, 3);
      return {
        sectionId: '10.1',
        conceptTag: '10.1',
        kind: 'numeric',
        context: `Two independent samples: group 1 has x̄₁ = ${x1}, s₁ = ${s1}, n₁ = ${n1}; group 2 has x̄₂ = ${x2}, s₂ = ${s2}, n₂ = ${n2}. Population standard deviations are unknown.`,
        stem: 'Compute the test statistic t for H0: μ₁ − μ₂ = 0. Round to three decimals.',
        answer: t,
        tolerance: { abs: 0.01 },
        explanation: [`t = (x̄₁ − x̄₂) / √(s₁²/n₁ + s₂²/n₂)`, `= (${x1} − ${x2}) / √(${s1}²/${n1} + ${s2}²/${n2}) = ${round(x1 - x2, 2)} / ${round(se, 4)}`, `= ${t}`],
      };
    },
  },
  {
    id: 'two-prop-z-stat',
    sectionId: '10.3',
    conceptTag: '10.3',
    kind: 'numeric',
    generate(rng) {
      const n1 = rng.pick([100, 150, 200, 250]), n2 = rng.pick([100, 150, 200, 250]);
      const x1 = rng.int(Math.round(n1 * 0.3), Math.round(n1 * 0.7));
      const x2 = rng.int(Math.round(n2 * 0.3), Math.round(n2 * 0.7));
      const p1 = x1 / n1, p2 = x2 / n2, pc = (x1 + x2) / (n1 + n2);
      const se = Math.sqrt(pc * (1 - pc) * (1 / n1 + 1 / n2));
      const z = round((p1 - p2) / se, 3);
      return {
        sectionId: '10.3',
        conceptTag: '10.3',
        kind: 'numeric',
        context: `In sample 1, ${x1} of ${n1} people approve; in sample 2, ${x2} of ${n2} approve.`,
        stem: 'Compute the test statistic z for H0: p₁ − p₂ = 0. Round to three decimals.',
        answer: z,
        tolerance: { abs: 0.01 },
        explanation: [`p̂₁ = ${round(p1, 4)}, p̂₂ = ${round(p2, 4)}, pooled p_c = (${x1} + ${x2})/(${n1} + ${n2}) = ${round(pc, 4)}`, `z = (p̂₁ − p̂₂) / √(p_c(1 − p_c)(1/n₁ + 1/n₂)) = ${round(p1 - p2, 4)} / ${round(se, 4)}`, `= ${z}`],
      };
    },
  },
  {
    id: 'paired-diff-mean',
    sectionId: '10.4',
    conceptTag: '10.4',
    kind: 'numeric',
    generate(rng) {
      const n = rng.int(5, 7);
      const before = Array.from({ length: n }, () => rng.int(60, 90));
      const after = before.map((b) => b + rng.int(-3, 8));
      const d = after.map((a, i) => a - (before[i] as number));
      const mean = d.reduce((a, b) => a + b, 0) / n;
      const sd = Math.sqrt(d.reduce((a, x) => a + (x - mean) ** 2, 0) / (n - 1));
      const askMean = rng.next() < 0.5;
      const ans = round(askMean ? mean : sd, 3);
      return {
        sectionId: '10.4',
        conceptTag: '10.4',
        kind: 'numeric',
        context: `Scores before and after a training course for ${n} employees (matched pairs).\n[TABLE]\nEmployee | Before | After\n${before.map((b, i) => `${i + 1} | ${b} | ${after[i]}`).join('\n')}\n[/TABLE]`,
        stem: `Using differences d = after − before, find the ${askMean ? 'sample mean x̄_d' : 'sample standard deviation s_d'} of the differences. Round to three decimals.`,
        answer: ans,
        tolerance: { abs: 0.006 },
        explanation: [`Differences: ${d.join(', ')}`, askMean ? `x̄_d = (${d.join(' + ')}) / ${n} = ${ans}` : `x̄_d = ${round(mean, 3)}; s_d = √(Σ(d − x̄_d)² / (n − 1)) = ${ans}`],
      };
    },
  },
];
