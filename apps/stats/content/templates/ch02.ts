import { mean, median, quartiles, sampleSd } from '../../src/lib/stats/descriptive';
import { round } from '../../src/lib/stats/dist';
import type { Template } from '../../src/lib/types';

const SCENARIOS = [
  ['quiz scores', 'points', 60, 100],
  ['commute times', 'minutes', 10, 60],
  ['weekly hours worked', 'hours', 5, 40],
  ['prices of lunch', 'dollars', 6, 18],
  ['ages of club members', 'years', 18, 65],
] as const;

export const CH02_TEMPLATES: Template[] = [
  {
    id: 'desc-mean-median',
    sectionId: '2.5',
    conceptTag: '2.5',
    kind: 'numeric',
    generate(rng) {
      const [what, unit, lo, hi] = rng.pick(SCENARIOS);
      const n = rng.int(7, 9);
      const xs = Array.from({ length: n }, () => rng.int(lo, hi)).sort((a, b) => a - b);
      const askMean = rng.next() < 0.5;
      const m = round(mean(xs), 2);
      const md = median(xs);
      return {
        sectionId: '2.5',
        conceptTag: '2.5',
        kind: 'numeric',
        stem: `A sample of ${n} ${what} (${unit}) is: ${xs.join('; ')}. Find the sample ${askMean ? 'mean' : 'median'}.`,
        answer: askMean ? m : md,
        tolerance: { abs: 0.01 },
        explanation: askMean
          ? [`Sum = ${xs.reduce((a, b) => a + b, 0)}`, `Mean = ${xs.reduce((a, b) => a + b, 0)} / ${n} = ${m}`]
          : [`Ordered data: ${xs.join(', ')}`, n % 2 ? `Middle value (position ${(n + 1) / 2}) = ${md}` : `Average of the two middle values = ${md}`],
      };
    },
  },
  {
    id: 'desc-sample-sd',
    sectionId: '2.7',
    conceptTag: '2.7',
    kind: 'numeric',
    generate(rng) {
      const [what, unit, lo, hi] = rng.pick(SCENARIOS);
      const n = rng.int(5, 7);
      const xs = Array.from({ length: n }, () => rng.int(lo, hi));
      const m = mean(xs);
      const s = round(sampleSd(xs), 2);
      const devs = xs.map((x) => round((x - m) ** 2, 4));
      return {
        sectionId: '2.7',
        conceptTag: '2.7',
        kind: 'numeric',
        stem: `Sample of ${what} (${unit}): ${xs.join('; ')}. Find the sample standard deviation s (round to two decimals).`,
        answer: s,
        tolerance: { abs: 0.02 },
        explanation: [
          `x̄ = ${round(m, 4)}`,
          `Squared deviations: ${devs.join(', ')} → sum = ${round(devs.reduce((a, b) => a + b, 0), 4)}`,
          `s² = sum / (n − 1) = ${round(devs.reduce((a, b) => a + b, 0), 4)} / ${n - 1} = ${round(devs.reduce((a, b) => a + b, 0) / (n - 1), 4)}`,
          `s = √(s²) = ${s}`,
        ],
      };
    },
  },
  {
    id: 'desc-zscore-data',
    sectionId: '2.7',
    conceptTag: '2.7',
    kind: 'numeric',
    generate(rng) {
      const mu = rng.int(40, 90);
      const s = rng.int(3, 12);
      const x = mu + rng.int(-3, 3) * s + rng.int(-2, 2);
      const z = round((x - mu) / s, 2);
      return {
        sectionId: '2.7',
        conceptTag: '2.7',
        kind: 'numeric',
        stem: `A data set has mean ${mu} and standard deviation ${s}. How many standard deviations from the mean is the value x = ${x}? (Give the z-score, two decimals.)`,
        answer: z,
        tolerance: { abs: 0.01 },
        explanation: [`z = (x − x̄) / s = (${x} − ${mu}) / ${s} = ${z}`, z < 0 ? `The value is ${Math.abs(z)} standard deviations below the mean.` : `The value is ${z} standard deviations above the mean.`],
      };
    },
  },
  {
    id: 'desc-quartiles-iqr',
    sectionId: '2.3',
    conceptTag: '2.3',
    kind: 'numeric',
    generate(rng) {
      const [what, unit, lo, hi] = rng.pick(SCENARIOS);
      const n = rng.int(9, 12);
      const xs = Array.from({ length: n }, () => rng.int(lo, hi)).sort((a, b) => a - b);
      const q = quartiles(xs);
      const ask = rng.pick(['q1', 'q3', 'iqr'] as const);
      const label = { q1: 'first quartile Q1', q3: 'third quartile Q3', iqr: 'interquartile range IQR' }[ask];
      return {
        sectionId: '2.3',
        conceptTag: '2.3',
        kind: 'numeric',
        stem: `Ordered ${what} (${unit}): ${xs.join('; ')}. Find the ${label}.`,
        answer: q[ask],
        tolerance: { abs: 0.01 },
        explanation: [
          `Median (Q2) = ${q.q2}`,
          `Q1 = median of the lower half = ${q.q1}; Q3 = median of the upper half = ${q.q3}`,
          `IQR = Q3 − Q1 = ${q.q3} − ${q.q1} = ${q.iqr}`,
        ],
      };
    },
  },
  {
    id: 'desc-outlier-fence',
    sectionId: '2.4',
    conceptTag: '2.4',
    kind: 'tf',
    generate(rng) {
      const q1 = rng.int(20, 40);
      const iqr = rng.int(6, 15);
      const q3 = q1 + iqr;
      const upper = q3 + 1.5 * iqr;
      const isOut = rng.next() < 0.5;
      const x = isOut ? upper + rng.int(1, 6) : upper - rng.int(1, 6);
      return {
        sectionId: '2.4',
        conceptTag: '2.4',
        kind: 'tf',
        stem: `A data set has Q1 = ${q1} and Q3 = ${q3}. True or false: the value ${x} is a potential outlier by the 1.5·IQR rule.`,
        answer: isOut,
        explanation: [`IQR = ${q3} − ${q1} = ${iqr}`, `Upper fence = Q3 + 1.5·IQR = ${q3} + ${1.5 * iqr} = ${upper}`, isOut ? `${x} > ${upper}, so it is a potential outlier.` : `${x} ≤ ${upper}, so it is not a potential outlier.`],
      };
    },
  },
];
