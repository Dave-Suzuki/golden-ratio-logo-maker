import { round } from '../../src/lib/stats/dist';
import type { Template } from '../../src/lib/types';

export const CH05_TEMPLATES: Template[] = [
  {
    id: 'uniform-prob',
    sectionId: '5.2',
    conceptTag: '5.2',
    kind: 'numeric',
    generate(rng) {
      const a = rng.int(0, 10);
      const b = a + rng.int(5, 20);
      const c = a + rng.int(1, b - a - 2);
      const d = c + rng.int(1, b - c - 1);
      const ask = rng.pick(['between', 'less', 'more', 'mean', 'sd'] as const);
      const width = b - a;
      const table = {
        between: { stem: `Find P(${c} < X < ${d}).`, ans: round((d - c) / width, 4), steps: [`P(c < X < d) = (d − c) · 1/(b − a) = (${d} − ${c}) / ${width}`] },
        less: { stem: `Find P(X < ${c}).`, ans: round((c - a) / width, 4), steps: [`P(X < ${c}) = (${c} − ${a}) / ${width}`] },
        more: { stem: `Find P(X > ${d}).`, ans: round((b - d) / width, 4), steps: [`P(X > ${d}) = (${b} − ${d}) / ${width}`] },
        mean: { stem: 'Find the mean μ of X.', ans: round((a + b) / 2, 4), steps: [`μ = (a + b)/2 = (${a} + ${b})/2`] },
        sd: { stem: 'Find the standard deviation σ of X. Round to four decimals.', ans: round(width / Math.sqrt(12), 4), steps: [`σ = √((b − a)²/12) = (${b} − ${a}) / √12`] },
      }[ask];
      return {
        sectionId: '5.2',
        conceptTag: '5.2',
        kind: 'numeric',
        context: `The time (minutes) a customer waits is uniformly distributed between ${a} and ${b}: X ~ U(${a}, ${b}).`,
        stem: table.stem,
        answer: table.ans,
        tolerance: { abs: 0.0006 },
        explanation: [`f(x) = 1/(b − a) = 1/${width} for ${a} ≤ x ≤ ${b}`, ...table.steps, `= ${table.ans}`],
      };
    },
  },
  {
    id: 'expo-prob',
    sectionId: '5.3',
    conceptTag: '5.3',
    kind: 'numeric',
    generate(rng) {
      const mu = rng.pick([2, 4, 5, 8, 10, 12]);
      const m = 1 / mu;
      const x = rng.int(1, 2 * mu);
      const ask = rng.pick(['less', 'more', 'median'] as const);
      const table = {
        less: { stem: `Find P(X < ${x}). Round to four decimals.`, ans: round(1 - Math.exp(-m * x), 4), steps: [`P(X < x) = 1 − e^(−mx) = 1 − e^(−${round(m, 4)}·${x})`] },
        more: { stem: `Find P(X > ${x}). Round to four decimals.`, ans: round(Math.exp(-m * x), 4), steps: [`P(X > x) = e^(−mx) = e^(−${round(m, 4)}·${x})`] },
        median: { stem: 'Find the median of X. Round to four decimals.', ans: round(Math.log(2) / m, 4), steps: [`Median: 1 − e^(−m·k) = 0.5 → k = ln(2)/m = ln(2) × ${mu}`] },
      }[ask];
      return {
        sectionId: '5.3',
        conceptTag: '5.3',
        kind: 'numeric',
        context: `The time (minutes) between customer arrivals is exponential with mean ${mu} minutes: X ~ Exp(${round(m, 4)}).`,
        stem: table.stem,
        answer: table.ans,
        tolerance: { abs: 0.002 },
        explanation: [`Decay rate m = 1/μ = 1/${mu} = ${round(m, 4)}`, ...table.steps, `= ${table.ans}`],
      };
    },
  },
  {
    id: 'continuous-pdf-area',
    sectionId: '5.1',
    conceptTag: '5.1',
    kind: 'numeric',
    generate(rng) {
      const b = rng.int(4, 20);
      const c = rng.int(1, b - 2);
      const d = c + rng.int(1, b - c - 1);
      const ans = round((d - c) / b, 4);
      return {
        sectionId: '5.1',
        conceptTag: '5.1',
        kind: 'numeric',
        stem: `A continuous random variable has the density f(x) = 1/${b} for 0 ≤ x ≤ ${b}. Find P(${c} ≤ x ≤ ${d}) — the area under f(x) between ${c} and ${d}. Round to four decimals.`,
        answer: ans,
        tolerance: { abs: 0.0006 },
        explanation: [`Probability = area of the rectangle = base × height = (${d} − ${c}) × 1/${b}`, `= ${ans}`],
      };
    },
  },
];
